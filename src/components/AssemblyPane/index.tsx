import React, { useRef, useState } from 'react'
import { DEFAULT_SOLIDITY_VALUE } from '../../constants'
import { useContractNames } from '../../contexts/Contracts'
import { useHighlightedClass, useUpdateHiglightedClass } from '../../contexts/Decorations'
import { useMappings } from '../../contexts/Mappings'
import { useRemoteCompiler, useRemoteSymExec } from '../../hooks'
import { HighlightedSource } from '../../types'
import CodePane from '../CodePane'

import { styled, createTheme, ThemeProvider } from '@mui/system';

import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import MemoryIcon from '@mui/icons-material/Memory';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import { grey, red } from '@mui/material/colors'
import SettingsIcon from '@mui/icons-material/Settings';
import CircularProgress from '@mui/material/CircularProgress';

interface AssemblyPaneProps {
    setError: React.Dispatch<React.SetStateAction<string>>
    sourceRef: any
}

const BorderBox = styled(Box)(({ theme }) => ({
    borderStyle: "solid",
    borderWidth: "0px 1px 1px 0px",
    borderColor: "#dfdfdf"
  }));

  const SquareIconButton = styled(IconButton)(({ theme }) => ({
    borderRadius: 10,
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "#dddddd",
    height: 40,
    width: 40
  }));

function AssemblyPane(props: AssemblyPaneProps) {
    const { setError, sourceRef } = props

    const contractNames = useContractNames()

    const contractName = contractNames.length !== 0 ? contractNames[0] : 'UNKNOWN'

    const mappings = useMappings(contractName)

    const highlightedClass = useHighlightedClass()
    const updateHighlightedClass = useUpdateHiglightedClass()
  
    const remoteSymExec = useRemoteSymExec(contractName)

    const compiledChildRef = useRef<any>();

    const [isExecuting, setIsExecuting] = useState(false)

    const handleSymExec = () => {
        if (sourceRef.current && remoteSymExec) {
          setIsExecuting(true)

          const sourceValue = sourceRef.current.getSourceValue()
    
          remoteSymExec(sourceValue).catch((r: Error) => {
            console.log(r)
            setError(r.message)
          }).finally(() => {
            setIsExecuting(false)
          })
        }
      }

      const handleCompiledMouseMove = (key: string) => {
        updateHighlightedClass(key, HighlightedSource.COMPILE)
      }

    return (
        <Box display="flex" width="38%" flexDirection="column">
            <BorderBox p={1} display="flex" justifyContent="center" alignItems="center">
                <Box flexGrow={1} ml={2} display="flex" alignItems="center">
                    <MemoryIcon/>
                    <Typography variant="button" textAlign="center" alignItems="center" justifyContent="center" m={1} fontSize="12pt">
                        EVM Assembly
                    </Typography>
                </Box>
                <Box>
                    <Grid container spacing={1}>
                        <Grid item>
                            <SquareIconButton>
                                <SettingsIcon htmlColor={grey[600]}  />
                            </SquareIconButton>
                        </Grid>
                        <Grid item>
                            <SquareIconButton disabled={isExecuting}>
                                {!isExecuting ? <DirectionsRunIcon htmlColor={red[500]} onClick={handleSymExec} /> :
                                <Box display="flex" alignItems="center" justifyContent="center">
                                    <CircularProgress size={15} style={{color: red[500]}} />
                                </Box>}
                            </SquareIconButton>
                        </Grid>
                    </Grid>
                </Box>
                
            </BorderBox>
            <BorderBox flexGrow={1}>
                <CodePane
                    ref={compiledChildRef}
                    language="plaintext"
                    content={mappings.filteredLines || ""}
                    height="100%"
                    handleMouseHover={handleCompiledMouseMove}
                    readOnly={true}
                    source={HighlightedSource.COMPILE}
                    contract={contractName}
                    mappings={mappings.mappings}
                    highlightedClass={highlightedClass}
                />
            </BorderBox>
        </Box>
    )
}

export default AssemblyPane