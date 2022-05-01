import React, { useEffect, useState } from 'react'
import { EVMSource, SOURCE_FILENAME, SOURCE_LAST_SAVED_VALUE } from '../types'

import { symExecSourceRemoteStatus, parseCompiledJSON, parseLegacyEVMMappings, safeAccess, addSymexecMetrics } from '../utils'
import { useSymexecErrorManager } from '../contexts/Application'
import { useAST, useUpdateAllContracts } from '../contexts/Contracts'
import { useRemoveHiglightedClass } from '../contexts/Decorations'
import { useMappings, useRemoveAllMappings, useUpdateAllMappings } from '../contexts/Mappings'
import { useSymexecTaskManager, useSourceContentManager, useSymexecContractManager } from '../contexts/LocalStorage'

const SYMEXEC_POLL_INTERVAL = 5000
const MAX_POLL_INTERVAL = 60000

interface SymexecUpdaterForContractInterface {
  contract: string
}

function SymexecUpdaterForContract({contract}: SymexecUpdaterForContractInterface) {
  const [, updateSymexecError] = useSymexecErrorManager()
  const updateAllMappings = useUpdateAllMappings()
  const [symexecTask, updateSymexecTask] = useSymexecTaskManager()
  const [currentPollInterval, setCurrentPollInterval] = useState(SYMEXEC_POLL_INTERVAL)
  const compiledAST = useAST()
  const mappings = useMappings(contract)

  useEffect(() => {
    if (symexecTask != null && updateSymexecTask) {
      let stale = false
      const interval = setInterval(() => {
        symExecSourceRemoteStatus(symexecTask.taskId).then((r) => {
          if (!stale) {
            if (r.status === 404) {
              updateSymexecError(null)
              updateSymexecTask(null)
            } else if (r.data.task_status === "FAILURE") {
              updateSymexecError("Compile task failed for unknown reasons, please try again later.")
              updateSymexecTask(null)
            } else if (r.data.task_status === "SUCCESS") {
              setCurrentPollInterval(SYMEXEC_POLL_INTERVAL)

              const symexecResponse = r.data.task_result
              console.log(symexecResponse)
              if (!symexecResponse.success) {
                updateSymexecError(symexecResponse.result)
                updateSymexecTask(null)
              } else {
                const newMappings = {...mappings.mappings}

                addSymexecMetrics(newMappings, symexecResponse.result, compiledAST)

                updateAllMappings(contract, newMappings, mappings.filteredLines, true)

                updateSymexecError(null)
                updateSymexecTask(null)
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
  }, [symexecTask, updateSymexecTask, updateAllMappings, addSymexecMetrics, currentPollInterval])

  return null
}

function SymexecUpdater() {
  const [symexecContract, ] = useSymexecContractManager()

  return symexecContract != null ? <SymexecUpdaterForContract contract={symexecContract} /> : null
}

export default SymexecUpdater