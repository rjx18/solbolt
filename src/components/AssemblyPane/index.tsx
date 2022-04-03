import React, {useRef} from 'react'
import { DEFAULT_SOLIDITY_VALUE } from '../../constants'
import { useContractNames } from '../../contexts/Contracts'
import { useHighlightedClass, useUpdateHiglightedClass } from '../../contexts/Decorations'
import { useMappings } from '../../contexts/Mappings'
import { useRemoteCompiler, useRemoteSymExec } from '../../hooks'
import { HighlightedSource } from '../../types'
import CodePane from '../CodePane'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

interface AssemblyPaneProps {
    setError: React.Dispatch<React.SetStateAction<string>>
    sourceRef: any
}

function AssemblyPane(props: AssemblyPaneProps) {
    const { setError, sourceRef } = props

    const contractNames = useContractNames()

    const contractName = contractNames.length !== 0 ? contractNames[0] : 'UNKNOWN'

    const mappings = useMappings(contractName)

    const highlightedClass = useHighlightedClass()
    const updateHighlightedClass = useUpdateHiglightedClass()
  
    const remoteSymExec = useRemoteSymExec(contractName)

    const compiledChildRef = useRef<any>();

    const handleSymExec = () => {
        if (sourceRef.current && remoteSymExec) {
          const sourceValue = sourceRef.current.getValue()
    
          remoteSymExec(sourceValue).catch((r: Error) => {
            console.log(r)
            setError(r.message)
          })
        }
      }

      const handleCompiledMouseMove = (key: string) => {
        updateHighlightedClass(key, HighlightedSource.COMPILE)
      }

    return (
        <Box display="flex" width="40%" flexDirection="column">
            <Box>
                <Typography>
                    Assembly
                </Typography>
            </Box>
            <Box flexGrow={1}>
                <CodePane
                    ref={compiledChildRef}
                    language="plaintext"
                    content={mappings.filteredLines}
                    height="100%"
                    handleMouseHover={handleCompiledMouseMove}
                    readOnly={true}
                    source={HighlightedSource.COMPILE}
                    contract={contractName}
                    mappings={mappings.mappings}
                    highlightedClass={highlightedClass}
                />
            </Box>
        </Box>
    )
}

export default AssemblyPane