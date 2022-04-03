import React, { useRef, forwardRef, useImperativeHandle } from 'react'
import { DEFAULT_SOLIDITY_VALUE } from '../../constants'
import { useContractNames } from '../../contexts/Contracts'
import { useHighlightedClass, useUpdateHiglightedClass } from '../../contexts/Decorations'
import { useMappings } from '../../contexts/Mappings'
import { useRemoteCompiler } from '../../hooks'
import { HighlightedSource } from '../../types'
import CodePane from '../CodePane'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

interface SolidityPaneProps {
    setError: React.Dispatch<React.SetStateAction<string>>
}

const SolidityPane = forwardRef((props: SolidityPaneProps, ref: any) => {
    const { setError } = props

    useImperativeHandle(ref, () => ({
        getSourceValue() {
          if (sourceChildRef.current) {
            return sourceChildRef.current.getValue()
          }
          return ''
        }
      })); 

    const contractNames = useContractNames()

    const contractName = contractNames.length !== 0 ? contractNames[0] : 'UNKNOWN'

    const mappings = useMappings(contractName)

    const highlightedClass = useHighlightedClass()
    const updateHighlightedClass = useUpdateHiglightedClass()
  
    const remoteCompile = useRemoteCompiler()

    const sourceChildRef = useRef<any>();

    const handleClick = () => {
        if (sourceChildRef.current && remoteCompile) {
          const sourceValue = sourceChildRef.current.getValue()
    
          remoteCompile(sourceValue).catch((r: Error) => {
            console.log(r)
            setError(r.message)
          })
        }
    }

    const handleSourceMouseMove = (key: string) => {
        updateHighlightedClass(key, HighlightedSource.SOURCE)
    }

    return (
        <Box display="flex" width="40%" flexDirection="column">
            <Box>
                <Typography>
                    Solidity
                </Typography>
            </Box>
            <Box flexGrow={1}>
                <CodePane
                    ref={sourceChildRef}
                    language="sol"
                    content={DEFAULT_SOLIDITY_VALUE}
                    height="100%"
                    handleMouseHover={handleSourceMouseMove}
                    readOnly={false}
                    source={HighlightedSource.SOURCE}
                    mappings={mappings.mappings}
                    highlightedClass={highlightedClass}
                />
            </Box>
            
        </Box>
    )
})

export default SolidityPane