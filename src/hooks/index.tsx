import { useEffect, useCallback, useMemo } from 'react';
import { SOLC_BINARIES } from '../constants';
import { useCompilerErrorManager, useSolidityTabOpenManager, useSymexecErrorManager } from '../contexts/Application';
import { useAST, useCompiledJSON, useContract, useFilenameOfContract, useUpdateAllContracts } from '../contexts/Contracts';
import { useRemoveHiglightedClass } from '../contexts/Decorations';
import { useCompiledSourceHashManager, useCompilerSettingsManager, useCompilerTaskManager, useSymexecContractManager, useSymexecSettingsManager, useSymexecTaskManager } from '../contexts/LocalStorage';
import { useMappings, useRemoveAllMappings, useUpdateAllMappings } from '../contexts/Mappings';
import { useSourceContentManager } from '../contexts/LocalStorage';
import { CompilerOptimizerDetails, CompilerSettings, COMPILER_CONSTANTOPTIMIZER, COMPILER_CSE, COMPILER_DEDUPLICATE, COMPILER_DETAILS, COMPILER_DETAILS_ENABLED, COMPILER_ENABLE, COMPILER_EVM, COMPILER_INLINER, COMPILER_JUMPDESTREMOVER, COMPILER_ORDERLITERALS, COMPILER_PEEPHOLE, COMPILER_RUNS, COMPILER_VERSION, COMPILER_VIAIR, COMPILER_YUL, EVMSource, Source, SourceContent, SourceState, SOURCE_FILENAME, SOURCE_LAST_SAVED_VALUE, SOURCE_MODEL, SOURCE_VIEW_STATE, SymexecSettings, SYMEXEC_ENABLE_ONCHAIN, SYMEXEC_ONCHAIN_ADDRESS } from '../types';
import { addSymexecMetrics, compileSourceRemote, etherscanLoader, hashString, isEmpty, parseCompiledJSON, parseLegacyEVMMappings, safeAccess, symExecSourceRemote } from '../utils';
import { useSourceStateManager } from '../contexts/Sources';

export const useRemoteCompiler = () => {

  const [, updateCompilerTask] = useCompilerTaskManager()
  const [, updateCompiledSourceHash] = useCompiledSourceHashManager()
  const [, updateCompilerError] = useCompilerErrorManager()

  const [compilerSettings, ] = useCompilerSettingsManager()

  return useCallback(
    (sourceContents: SourceContent[]) => {
      if (sourceContents.length !== 0 && compilerSettings) {
        return compileSourceRemote(sourceContents, compilerSettings).then((r) => {
          if (r.status === 200) {

            updateCompilerTask({
              taskId: r.data.task_id,
              taskStartTime: Date.now()
            })

            let hashMap = {} as {[name: string]: number}

            for (const sourceContent of sourceContents) {
              const hash = hashString(sourceContent[SOURCE_LAST_SAVED_VALUE])

              hashMap[sourceContent[SOURCE_FILENAME]] = hash
            }

            updateCompiledSourceHash(hashMap)
            updateCompilerError(null)
          }
        }).catch((r) => {
          if (r.response != null) {
            updateCompilerError("Error when publishing compilation task to server")
          }
          else {
            updateCompilerError(r.message)
          }
        })
      }
      updateCompilerError("Hooks are undefined!");
    },
    [compilerSettings, updateCompiledSourceHash, updateCompilerError, updateCompilerTask, hashString]
  )
};

export const useRemoteSymExec = (contract: string | undefined) => {

  const compiledJSON = useCompiledJSON()
  const compiledAST = useAST()
  const [compiledSourceHash, ] = useCompiledSourceHashManager()
  const updateAllMappings = useUpdateAllMappings()
  const [sourceContents, ] = useSourceContentManager()

  const [, updateSymexecTask] = useSymexecTaskManager()
  const [symexecSettings, ] = useSymexecSettingsManager()
  const [, updateSymexecError] = useSymexecErrorManager()
  const [, updateSymexecContract] = useSymexecContractManager()

  return useCallback(
    async () => {
      if (contract && compiledJSON && compiledSourceHash != null && compiledAST) {
        for (const sourceContent of sourceContents) {
          const newHash = hashString(sourceContent[SOURCE_LAST_SAVED_VALUE])
          const filename = sourceContent[SOURCE_FILENAME]

          if (compiledSourceHash[filename] === 0 || newHash !== compiledSourceHash[filename]) {
            updateSymexecError("Source content has changed, please compile first!")
          }
        }

        return symExecSourceRemote(contract, sourceContents, compiledJSON, symexecSettings).then((r) => {
          if (r.status === 200) {
            updateSymexecTask({
              taskId: r.data.task_id,
              taskStartTime: Date.now()
            })
            updateSymexecContract(contract)
            updateSymexecError(null)
          }
        }).catch((r) => {
          if (r.response != null) {
            updateSymexecError("Error when publishing symbolic execution task to server")
          }
          else {
            updateSymexecError(r.message)
          }
        })
      }
    },
    [updateAllMappings, symexecSettings, compiledSourceHash, compiledJSON, compiledAST, contract, sourceContents]
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
  const [symexecSettings, updateSymexecSettings] = useSymexecSettingsManager()
  const removeAllMappings = useRemoveAllMappings()
  const [, updateSolidityTabOpen ] = useSolidityTabOpenManager()

  return useCallback(
    async (address: string) => {
      
      if (address) {
        return etherscanLoader(address).then((r) => {
          if (r.status === 200) {
            const response = r.data

            updateSolidityTabOpen(0)

            if (response[ETHERSCAN_RESULT] == null || response[ETHERSCAN_RESULT].length === 0) {
              throw new Error("Failed to load address, empty response")
            }

            const result = response[ETHERSCAN_RESULT][0]

            if (result[ETHERSCAN_SOURCE] !== "") {
              // remove outermost curly braces

              let newSourceContents = [] as SourceContent[]
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

                  newSourceContents.push(newSource)
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

                newSourceContents.push(newSource)
              }

              updateAllSourceStates([])
              updateAllSourceContents(newSourceContents)
              removeAllMappings()

              // parse settings
              if (!SOLC_BINARIES.includes(result[ETHERSCAN_COMPILER_VERSION])) {
                throw new Error("Error importing settings: Compiler version not supported!")
              }

              const newCompilerSettings = {
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

              updateCompilerSettings(newCompilerSettings)

              const newSymexecSettings = {
                ...symexecSettings,
                [SYMEXEC_ENABLE_ONCHAIN]: true,
                [SYMEXEC_ONCHAIN_ADDRESS]: address
              } as SymexecSettings

              updateSymexecSettings(newSymexecSettings)
            } else {
              throw new Error("Address does not have verified source code")
            }
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
    },
    [updateAllSourceContents, updateAllSourceStates, updateCompilerSettings]
  )
}

export const useGasSummary = (contract: string | undefined) => {
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

export const useFunctionSummary = (contract: string | undefined) => {
  const mappings = useMappings(contract)
  const contractJSON = useContract(contract)

  return useMemo(() => {
    if (mappings && contractJSON && mappings.hasSymExec) {
      let functionSummary = {} as {[key: string]: {gas: number, functionName: string}}

      for (const key in mappings.mappings) {
        const functionGas = mappings.mappings[key].functionGas

        if (functionGas != null) {
          const functionSelector = mappings.mappings[key].functionSelector

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

interface ExampleContent {
  sourceContent: SourceContent[]
  compileSettings: CompilerSettings
  symexecSettings: SymexecSettings
}

export const useExampleLoader = () => {
  const [, { updateAllSourceContents }] = useSourceContentManager()
  const [, { updateAllSourceStates }] = useSourceStateManager()
  const [, updateCompilerSettings] = useCompilerSettingsManager()
  const [, updateSymexecSettings] = useSymexecSettingsManager()
  const removeAllMappings = useRemoveAllMappings()
  const [, updateSolidityTabOpen ] = useSolidityTabOpenManager()

  return useCallback(
    ({sourceContent, compileSettings, symexecSettings}: ExampleContent) => {
      
      updateSolidityTabOpen(0)

      updateAllSourceStates([])
      updateAllSourceContents(sourceContent)
      removeAllMappings()

      // parse settings
      updateCompilerSettings(compileSettings)

      updateSymexecSettings(symexecSettings)
    },
    [updateAllSourceContents, updateAllSourceStates, updateCompilerSettings]
  )
}
