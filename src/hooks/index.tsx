import { useEffect, useCallback, useMemo } from 'react';
import { SOLC_BINARIES } from '../constants';
import { useSolidityTabOpenManager } from '../contexts/Application';
import { useAST, useCompiledJSON, useContract, useFilenameOfContract, useHash, useUpdateAllContracts } from '../contexts/Contracts';
import { useRemoveHiglightedClass } from '../contexts/Decorations';
import { useCompilerSettingsManager, useSymexecSettingsManager } from '../contexts/LocalStorage';
import { useMappings, useRemoveAllMappings, useUpdateAllMappings } from '../contexts/Mappings';
import { useSourceContentManager } from '../contexts/LocalStorage';
import { CompilerOptimizerDetails, CompilerSettings, COMPILER_CONSTANTOPTIMIZER, COMPILER_CSE, COMPILER_DEDUPLICATE, COMPILER_DETAILS, COMPILER_DETAILS_ENABLED, COMPILER_ENABLE, COMPILER_EVM, COMPILER_INLINER, COMPILER_JUMPDESTREMOVER, COMPILER_ORDERLITERALS, COMPILER_PEEPHOLE, COMPILER_RUNS, COMPILER_VERSION, COMPILER_VIAIR, COMPILER_YUL, EVMSource, Source, SourceContent, SourceState, SOURCE_FILENAME, SOURCE_LAST_SAVED_VALUE, SOURCE_MODEL, SOURCE_VIEW_STATE } from '../types';
import { addSymexecMetrics, compileSourceRemote, etherscanLoader, hashString, isEmpty, parseCompiledJSON, parseLegacyEVMMappings, safeAccess, symExecSourceRemote } from '../utils';
import { useSourceStateManager } from '../contexts/Sources';

export const useRemoteCompiler = () => {

  const updateAllMappings = useUpdateAllMappings()
  const updateAllContracts = useUpdateAllContracts()
  const removeHighlightedClass = useRemoveHiglightedClass()
  const removeAllMappings = useRemoveAllMappings()

  const [compilerSettings, ] = useCompilerSettingsManager()

  return useCallback(
    (sources: {[index: number]: EVMSource}) => {
      if (sources && compilerSettings) {
        return compileSourceRemote(sources, compilerSettings).then((r) => {
          if (r.status === 200) {
            console.log("Compilation result!")
            console.log(r)

            const {contracts, ast} = parseCompiledJSON(r.data.result)

            let hashMap = {} as {[name: string]: number}

            for (const sourceIndex in sources) {
              const hash = hashString(sources[sourceIndex].sourceText)

              hashMap[sources[sourceIndex].name] = hash
            }

            updateAllContracts(contracts, ast, hashMap)

            const parsedMappings = parseLegacyEVMMappings(sources, r.data.result)

            removeAllMappings()

            for (const contractName in parsedMappings) {
              const {mappings, filteredLines, hasSymExec} = parsedMappings[contractName]
              updateAllMappings(contractName, mappings, filteredLines, hasSymExec)
              console.log('updated mappings for ' + contractName)
              console.log(parsedMappings[contractName])
            }

            removeHighlightedClass()
          }
        }).catch((r) => {
          if (r.response != null) {
            const errorMessage = r.response.data.status.split("\n")[0]
          throw new Error(errorMessage)
          }
          else {
            throw new Error(r.message)
          }
        })
      }
      return Promise.reject("Hooks are undefined!");
    },
    [compilerSettings, updateAllMappings, updateAllContracts]
  )
};

export const useRemoteSymExec = (contract: string) => {

  const compiledJSON = useCompiledJSON()
  const compiledAST = useAST()
  const sourceHash = useHash()
  const updateAllMappings = useUpdateAllMappings()
  const mappings = useMappings(contract)

  const [symexecSettings, ] = useSymexecSettingsManager()

  return useCallback(
    async (sources: {[index: number]: EVMSource}) => {
      
      if (sources && compiledJSON && mappings && sourceHash != null && compiledAST) {
        for (const sourceIndex in sources) {
          console.log(sources[sourceIndex].sourceText)
          const newHash = hashString(sources[sourceIndex].sourceText)
          console.log(newHash)
          const filename = sources[sourceIndex].name

          if (sourceHash[filename] === 0 || newHash !== sourceHash[filename]) {
            throw new Error("Source content has changed, please compile first!")
          }
        }

        console.log("Reconstructed JSON")
        console.log(compiledJSON)

        return symExecSourceRemote(contract, sources, compiledJSON, symexecSettings).then((r) => {
          if (r.status === 200) {
            console.log(r.data)
  
            const newMappings = {...mappings.mappings}

            addSymexecMetrics(newMappings, r.data, compiledAST)

            updateAllMappings(contract, newMappings, mappings.filteredLines, true)
          }
        }).catch((r) => {
          console.log(r)

          if (r.response != null) {
            const errorMessage = r.response.data.status.split("\n")[0]
            throw new Error(errorMessage)
          }
          else {
            throw new Error(r.message)
          }
        })
      }
    },
    [updateAllMappings, symexecSettings, sourceHash, compiledJSON, compiledAST, mappings]
  )
};

const ETHERSCAN_SOURCE = "SourceCode"
const ETHERSCAN_LANGUAGE = "language"
const ETHERSCAN_SOURCES = "sources"
const ETHERSCAN_CONTENT = "content"
const ETHERSCAN_RESULT = "result"
const ETHERSCAN_COMPILER_VERSION = "CompilerVersion"
const ETHERSCAN_OPTIMIZATION_USED = "OptimizationUsed"
const ETHERSCAN_RUNS = "Runs"
const ETHERSCAN_EVM_VERSION = "EVMVersion"
const ETHERSCAN_SETTINGS = "settings"

export const useAddressLoader = () => {
  const [, { updateAllSourceContents }] = useSourceContentManager()
  const [, { updateAllSourceStates }] = useSourceStateManager()
  const [, updateCompilerSettings] = useCompilerSettingsManager()
  const removeAllMappings = useRemoveAllMappings()
  const [, updateSolidityTabOpen ] = useSolidityTabOpenManager()

  return useCallback(
    async (address: string, handleCreateModel: ((content: string) => any)) => {
      
      if (address) {
        return etherscanLoader(address).then((r) => {
          if (r.status === 200) {
            console.log("Loaded address from etherscan")
            console.log(r.data)

            const response = r.data

            updateSolidityTabOpen(0)

            if (response[ETHERSCAN_RESULT] == null || response[ETHERSCAN_RESULT].length === 0) {
              throw new Error("Failed to load address, empty response")
            }

            const result = response[ETHERSCAN_RESULT][0]

            if (result[ETHERSCAN_SOURCE] !== "") {
              // remove outermost curly braces

              let newSourceContents = [] as SourceContent[]
              let newSourceStates = [] as SourceState[]
              let detailedOptimizerSettings = {} as any
              let hasDetail = false

              if (result[ETHERSCAN_SOURCE].startsWith('{')) {
                const parsedSource = result[ETHERSCAN_SOURCE].substring(1, result[ETHERSCAN_SOURCE].length - 1)

                const sourceCode = JSON.parse(parsedSource)
                if (sourceCode[ETHERSCAN_LANGUAGE] !== "Solidity") {
                  throw new Error("Address is not compiled from Solidity")
                }

                // parse sources
                const sources = sourceCode[ETHERSCAN_SOURCES]

                for (const sourceFilename in sources) {
                  const newSource = {
                      [SOURCE_FILENAME]: sourceFilename,
                      [SOURCE_LAST_SAVED_VALUE]: safeAccess(sources, [sourceFilename, ETHERSCAN_CONTENT])
                  }

                  const newSourceState = {
                    [SOURCE_MODEL]: handleCreateModel(safeAccess(sources, [sourceFilename, ETHERSCAN_CONTENT])),
                    [SOURCE_VIEW_STATE]: undefined
                  }

                  newSourceContents.push(newSource)
                  newSourceStates.push(newSourceState)
                }

                if (!isEmpty(safeAccess(sourceCode, [ETHERSCAN_SETTINGS, 'optimizer', 'details']))) {
                  hasDetail = true
                  detailedOptimizerSettings = {...safeAccess(sourceCode, [ETHERSCAN_SETTINGS, 'optimizer', 'details'])}
                }
              } else {
                const newSource = {
                    [SOURCE_FILENAME]: `${result['ContractName']}.sol`,
                    [SOURCE_LAST_SAVED_VALUE]: result[ETHERSCAN_SOURCE]
                }

                const newSourceState = {
                  [SOURCE_MODEL]: handleCreateModel(result[ETHERSCAN_SOURCE]),
                  [SOURCE_VIEW_STATE]: undefined
                }

                newSourceContents.push(newSource)
                newSourceStates.push(newSourceState)
              }

              updateAllSourceContents(newSourceContents)
              updateAllSourceStates(newSourceStates)
              removeAllMappings()

              // parse settings

              if (!SOLC_BINARIES.includes(result[ETHERSCAN_COMPILER_VERSION])) {
                throw new Error("Error importing settings: Compiler version not supported!")
              }

              const newSettings = {
                [COMPILER_VERSION]: result[ETHERSCAN_COMPILER_VERSION],
                [COMPILER_EVM]: result[ETHERSCAN_EVM_VERSION],
                [COMPILER_RUNS]: parseInt(result[ETHERSCAN_RUNS]),
                [COMPILER_ENABLE]: result[ETHERSCAN_OPTIMIZATION_USED] === "1",
                [COMPILER_VIAIR]: false, //
                [COMPILER_DETAILS_ENABLED]: hasDetail,
                [COMPILER_DETAILS]: {
                  [COMPILER_PEEPHOLE]: true,
                  [COMPILER_INLINER]: true,
                  [COMPILER_JUMPDESTREMOVER]: true,
                  [COMPILER_ORDERLITERALS]: false,
                  [COMPILER_DEDUPLICATE]: false,
                  [COMPILER_CSE]: false,
                  [COMPILER_CONSTANTOPTIMIZER]: false,
                  [COMPILER_YUL]: false,
                  ...detailedOptimizerSettings
                } as CompilerOptimizerDetails
              } as CompilerSettings

              updateCompilerSettings(newSettings)
            } else {
              throw new Error("Address does not have verified source code")
            }
          }
        }).catch((r) => {
          console.log(r)

          if (r.response != null) {
            const errorMessage = r.response.data.status.split("\n")[0]
            throw new Error(errorMessage)
          }
          else {
            throw new Error(r.message)
          }
        })
      }
    },
    [updateAllSourceContents, updateAllSourceStates, updateCompilerSettings]
  )
}

export const useGasSummary = (contract: string) => {
  const mappings = useMappings(contract)

  return useMemo(() => {
    if (mappings && mappings.hasSymExec) {
      let gasSummary = {} as {[key: string]: number}

      for (const key in mappings.mappings) {
        const gasMap = mappings.mappings[key].gasMap

        const gasClass = gasMap ? gasMap.class : 'frag-heatmap-null'


        // initialise gas summary
        if (gasSummary[gasClass] == null) {
          gasSummary[gasClass] = 0
        }

        gasSummary[gasClass] += 1
      }

      return gasSummary 
    }

    return undefined    
  }, [mappings]);
}

export const useFunctionSummary = (contract: string) => {
  const mappings = useMappings(contract)
  const contractJSON = useContract(contract)

  return useMemo(() => {
    if (mappings && contractJSON && mappings.hasSymExec) {
      let functionSummary = {} as {[key: string]: {gas: number, functionName: string}}

      for (const key in mappings.mappings) {
        const functionGas = mappings.mappings[key].functionGas

        console.log("FN Mapping " + key)

        if (functionGas != null) {
          console.log("FOUND FN!")
          const functionSelector = mappings.mappings[key].functionSelector

          console.log(functionSelector)

          const functionName = Object.keys(contractJSON.evm.methodIdentifiers).find((fn) => {
            return contractJSON.evm.methodIdentifiers[fn] === functionSelector
          })

          if (functionName != null) {
            functionSummary[key] = {
              gas: functionGas,
              functionName: functionName
            }
          }
          
        }
      }

      return functionSummary 
    }

    return undefined    
  }, [mappings, contractJSON]);
}

// export function useSourceManager() {

//   const [sourceState, { updateAllSources: updateAllSourceStates, updateSource: updateSourceState, removeSource: removeSourceState }] = useSourceStateManager()
//   const [sourceContent, { updateAllSources: updateAllSourceContents, updateSource: updateSourceContent, removeSource: removeSourceContent }] = useSourceContentManager()

//   const _updateAllSources = useCallback(
//     (newSources: Source[]) => {
//       if (newSources) {
//         const newSourceContents = newSources.map((s) => {
//           return {
//             [SOURCE_FILENAME]: s[SOURCE_FILENAME],
//             [SOURCE_LAST_SAVED_VALUE]: s[SOURCE_LAST_SAVED_VALUE]
//           }
//         })

//         const newSourceStates = newSources.map((s) => {
//           return {
//             [SOURCE_MODEL]: s[SOURCE_MODEL],
//             [SOURCE_VIEW_STATE]: s[SOURCE_VIEW_STATE]
//           }
//         })

//         updateAllSourceStates(newSourceStates)
//         updateAllSourceContents(newSourceContents)
//       }
//     },
//     [updateAllSourceStates, updateAllSourceContents]
//   )

//   const _updateSource = useCallback(
//     (index, source) => {
//       if (index != null && source) {
//         const newSourceContent = {
//           [SOURCE_FILENAME]: source[SOURCE_FILENAME],
//           [SOURCE_LAST_SAVED_VALUE]: source[SOURCE_LAST_SAVED_VALUE]
//         }

//         const newSourceState = {
//           [SOURCE_MODEL]: source[SOURCE_MODEL],
//           [SOURCE_VIEW_STATE]: source[SOURCE_VIEW_STATE]
//         }

//         updateSourceState(index, newSourceState)
//         updateSourceContent(index, newSourceContent)
//       }
//     },
//     [updateSourceState, updateSourceContent]
//   )

//   const _removeSource = useCallback(
//     (index) => {
//       if (index != null) {
//         removeSourceState(index)
//         removeSourceContent(index)
//       }
//     },
//     [removeSourceState, removeSourceContent]
//   )

//   const sources = sourceContent.map((s, index) => {
//     let currentSourceState

//     if (index >= sourceState.length) {
//       currentSourceState = {
//         [SOURCE_MODEL]: undefined,
//         [SOURCE_VIEW_STATE]: undefined
//       }
//     } else {
//       currentSourceState = sourceState[index]
//     }

//     return {
//       ...s,
//       ...currentSourceState
//     } as Source
//   })

//   return [
//     sources, {updateAllSources: _updateAllSources, updateSource: _updateSource, removeSource: _removeSource}, 
//   ] as [Source[], {
//     updateAllSources: ((sourceStates: Source[]) => void), 
//     updateSource: ((index: number, sourceState: Source) => void), 
//     removeSource: ((index: number) => void)
//   }]
// }
