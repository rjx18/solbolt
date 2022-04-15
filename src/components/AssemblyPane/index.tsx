import React, { useRef, useState } from 'react'
import { DEFAULT_SOLIDITY_VALUE } from '../../constants'
import { useHighlightedClass, useUpdateHiglightedClass } from '../../contexts/Decorations'
import { useMappings, useMappingsByIndex } from '../../contexts/Mappings'
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
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { solid } from '@fortawesome/fontawesome-svg-core/import.macro'
import Tooltip from '@mui/material/Tooltip';
import { useSettingsTabOpenManager, useToggleFreezeHoverManager, useToggleGasMetricsManager } from '../../contexts/Application'
import { isEmpty } from '../../utils'

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

    const [contractName, mappings] = useMappingsByIndex(0)

    console.log(mappings)

    const highlightedClass = useHighlightedClass()
    const updateHighlightedClass = useUpdateHiglightedClass()
  
    const remoteSymExec = useRemoteSymExec(contractName)

    const [showGasMetrics, toggleShowGasMetrics] = useToggleGasMetricsManager()
    const [, updateSettingsPaneOpen] = useSettingsTabOpenManager()

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

    const handleOpenSymexecSettings = () => {
        updateSettingsPaneOpen(1)
    }

    const hasNoGasMetrics = isEmpty(mappings) || Object.keys(mappings.mappings).length === 0 || mappings.mappings[Object.keys(mappings.mappings)[0]].gasMap == null

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
                        <Grid item sx={{alignItems: 'center', display: 'flex'}}>
                            <Tooltip title={hasNoGasMetrics ? "Symbolically execute first for gas metrics" : "Show or hide gas metrics"}>
                                <FormControlLabel control={<Switch checked={showGasMetrics} onChange={toggleShowGasMetrics} size='small' disabled={hasNoGasMetrics}/>} label={<Box pl={1}><FontAwesomeIcon icon={solid('gas-pump')} style={{color: grey[700]}} /></Box>} />
                            </Tooltip>
                        </Grid>
                        <Grid item>
                            <SquareIconButton onClick={handleOpenSymexecSettings}>
                                <SettingsIcon htmlColor={grey[600]} />
                            </SquareIconButton>
                        </Grid>
                        <Grid item>
                            <SquareIconButton disabled={isExecuting} onClick={handleSymExec} >
                                {!isExecuting ? <DirectionsRunIcon htmlColor={red[500]}/> :
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
                    hasSymExec={mappings.hasSymExec}
                />
            </BorderBox>
        </Box>
    )
}

export default AssemblyPane