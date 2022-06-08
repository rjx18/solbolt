import React, { useEffect, useState } from 'react'
import { EVMSource, SOURCE_FILENAME, SOURCE_LAST_SAVED_VALUE } from '../types'

import { compileSourceRemoteStatus, parseCompiledJSON, parseLegacyEVMMappings, safeAccess } from '../utils'
import { useCompilerErrorManager } from '../contexts/Application'
import { useUpdateAllContracts } from '../contexts/Contracts'
import { useRemoveHiglightedClass } from '../contexts/Decorations'
import { useRemoveAllMappings, useUpdateAllMappings } from '../contexts/Mappings'
import { useCompilerTaskManager, useSourceContentManager } from '../contexts/LocalStorage'

const COMPILATION_POLL_INTERVAL = 500
const MAX_POLL_INTERVAL = 1000

function CompilationUpdater() {
  const [, updateCompilerError] = useCompilerErrorManager()
  const updateAllMappings = useUpdateAllMappings()
  const updateAllContracts = useUpdateAllContracts()
  const removeHighlightedClass = useRemoveHiglightedClass()
  const removeAllMappings = useRemoveAllMappings()
  const [compilerTask, updateCompilerTask] = useCompilerTaskManager()
  const [sourceContent, ] = useSourceContentManager()
  const [currentPollInterval, setCurrentPollInterval] = useState(COMPILATION_POLL_INTERVAL)

  useEffect(() => {
    if (compilerTask != null && updateCompilerTask) {
      let stale = false
      const interval = setInterval(() => {
        compileSourceRemoteStatus(compilerTask.taskId).then((r) => {
          if (!stale) {
            if (r.status === 404) {
              updateCompilerTask(null)
            } else if (r.data.task_status === "FAILURE") {
              updateCompilerError("Compile task failed for unknown reasons, please try again later.")
              updateCompilerTask(null)
            } else if (r.data.task_status === "SUCCESS") {
              setCurrentPollInterval(COMPILATION_POLL_INTERVAL)

              const compilerResponse = r.data.task_result
              if (!compilerResponse.success) {
                updateCompilerError(compilerResponse.result)
                updateCompilerTask(null)
              } else {
                const {contracts, ast} = parseCompiledJSON(compilerResponse.result)
                
                updateAllContracts(contracts, ast)

                const parsedMappings = parseLegacyEVMMappings(sourceContent, compilerResponse.result)

                removeAllMappings()

                for (const contractName in parsedMappings) {
                  const {mappings, filteredLines, hasSymExec} = parsedMappings[contractName]
                  updateAllMappings(contractName, mappings, filteredLines, hasSymExec)
                }

                removeHighlightedClass()

                updateCompilerError(null)
                updateCompilerTask(null)
              }
            } else {
              setCurrentPollInterval(Math.min(currentPollInterval * 2, MAX_POLL_INTERVAL))
            }
          }
        })
      }, currentPollInterval);
    
      return () => {
        stale = true
        clearInterval(interval); // This represents the unmount function, in which you need to clear your interval to prevent memory leaks.
      }
    }
  }, [compilerTask, updateCompilerTask, removeHighlightedClass, removeAllMappings, updateAllContracts, updateCompilerError, currentPollInterval])

  return null
}

export default CompilationUpdater