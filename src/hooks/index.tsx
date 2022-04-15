import { useEffect, useCallback, useMemo } from 'react';
import { useAST, useCompiledJSON, useContract, useHash, useUpdateAllContracts } from '../contexts/Contracts';
import { useRemoveHiglightedClass } from '../contexts/Decorations';
import { useCompilerSettingsManager, useSymexecSettingsManager } from '../contexts/LocalStorage';
import { useMappings, useUpdateAllMappings } from '../contexts/Mappings';
import { addSymexecMetrics, compileSourceRemote, hashString, parseCompiledJSON, parseLegacyEVMMappings, symExecSourceRemote } from '../utils';

export const useRemoteCompiler = () => {

  const updateAllMappings = useUpdateAllMappings()
  const updateAllContracts = useUpdateAllContracts()
  const removeHighlightedClass = useRemoveHiglightedClass()

  const [compilerSettings, ] = useCompilerSettingsManager()

  return useCallback(
    (sourceValue: string) => {
      if (sourceValue && updateAllContracts && updateAllMappings && compilerSettings) {
        return compileSourceRemote(sourceValue, compilerSettings).then((r) => {
          if (r.status === 200) {
            console.log("Compilation result!")
            console.log(r)

            const {contracts, ast} = parseCompiledJSON(r.data.result)
            const hash = hashString(sourceValue)
            updateAllContracts(contracts, ast, hash)

            const parsedMappings = parseLegacyEVMMappings(sourceValue, r.data.result)

            for (const contractName in parsedMappings) {
              const {mappings, filteredLines, hasSymExec} = parsedMappings[contractName]
              updateAllMappings(contractName, mappings, filteredLines, hasSymExec)
              console.log('updated mappings for ' + contractName)
              console.log(parsedMappings[contractName])
            }

            removeHighlightedClass()
          }
        }).catch((r) => {
          console.log(r)
          const errorMessage = r.response.data.status.split("\n")[0]
          throw new Error(errorMessage)
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
    async (source: string) => {
      if (source && compiledJSON && mappings && sourceHash != null && compiledAST) {
        const newHash = hashString(source)
        if (sourceHash === 0 || newHash !== sourceHash) {
          throw new Error("Source content has changed, please compile first!")
        }

        console.log("Reconstructed JSON")
        console.log(compiledJSON)

        return symExecSourceRemote(source, compiledJSON, symexecSettings).then((r) => {
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
        })
      }
    },
    [updateAllMappings, symexecSettings, sourceHash, compiledJSON, compiledAST, mappings]
  )
};

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

        if (functionGas != null) {
          const functionSelector = mappings.mappings[key].functionSelector

          const functionName = Object.keys(contractJSON.evm.methodIdentifiers).find((key) => {
            return contractJSON.evm.methodIdentifiers[key] === functionSelector
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