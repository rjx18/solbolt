import { useEffect, useCallback } from 'react';
import { useCompiledJSON, useHash, useUpdateAllContracts } from '../contexts/Contracts';
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
            const {contracts, ast} = parseCompiledJSON(r.data.result)
            const hash = hashString(sourceValue)
            updateAllContracts(contracts, ast, hash)

            const parsedMappings = parseLegacyEVMMappings(sourceValue, r.data.result)

            for (const contractName in parsedMappings) {
              const {mappings, filteredLines} = parsedMappings[contractName]
              updateAllMappings(contractName, mappings, filteredLines)
              console.log('updated mappings for ' + contractName)
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
  const sourceHash = useHash()
  const updateAllMappings = useUpdateAllMappings()
  const mappings = useMappings(contract)

  const [symexecSettings, ] = useSymexecSettingsManager()

  return useCallback(
    async (source: string) => {
      if (source && compiledJSON && mappings && sourceHash != null) {
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

            addSymexecMetrics(newMappings, r.data)

            updateAllMappings(contract, newMappings, mappings.filteredLines)
          }
        }).catch((r) => {
          const errorMessage = r.response.data.status.split("\n")[0]
          throw new Error(errorMessage)
        })
      }
    },
    [updateAllMappings, symexecSettings, sourceHash, compiledJSON, mappings]
  )
};