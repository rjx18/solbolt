import React, { useRef, useState } from 'react'
import { DEFAULT_SOLIDITY_VALUE } from '../../constants'
import { useHighlightedClass, useUpdateHiglightedClass } from '../../contexts/Decorations'
import { useMappedContractNames, useMappings, useMappingsByIndex } from '../../contexts/Mappings'
import { useRemoteCompiler, useRemoteSymExec } from '../../hooks'
import { EVMSource, HighlightedSource, SOURCE_FILENAME, SOURCE_LAST_SAVED_VALUE } from '../../types'
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
import { useAssemblyTabOpenManager, useSettingsTabOpenManager, useSolidityTabOpenManager, useToggleFreezeHoverManager, useToggleGasMetricsManager } from '../../contexts/Application'
import { isEmpty } from '../../utils'

import Tabs from '@mui/material/Tabs';
import MuiTab from '@mui/material/Tab';
import { useSourceContentManager } from '../../contexts/LocalStorage'

interface AssemblyPaneProps {
    setError: (_error: string) => void
    sourceRef: any
}

const BorderBox = styled(Box)(({ theme }) => ({
    borderStyle: "solid",
    borderWidth: "0px 1px 1px 0px",
    borderColor: "#dfdfdf"
  }));

interface StyledTabProps {
    label: string;
}

const ASSEMBLY_EMPTY_CONTENT = "Please compile the Solidity code first!"

const Tab = styled((props: StyledTabProps) => <MuiTab {...props} />)(
    ({ theme }) => ({
      textTransform: 'none',
      minWidth: 0,
      [theme.breakpoints.up('sm')]: {
        minWidth: 0,
      },
      fontWeight: 400,
    //   marginRight: theme.spacing(1),
      color: 'rgba(0, 0, 0, 0.85)',
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"',
      ].join(','),
      '&:hover': {
        opacity: 1,
      },
      '&.Mui-selected': {
        fontWeight: 600,
      },
    }),
  );

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

    const contractNames = useMappedContractNames()
    // const contractNames = ["ERC20", "IERC721", "EventFactory"]

    const [assemblyTab, updateAssemblyTabOpen] = useAssemblyTabOpenManager()

    const [contractName, mappings] = useMappingsByIndex(assemblyTab)

    const highlightedClass = useHighlightedClass()
    const updateHighlightedClass = useUpdateHiglightedClass()
  
    const remoteSymExec = useRemoteSymExec(contractName)

    const [showGasMetrics, toggleShowGasMetrics] = useToggleGasMetricsManager()
    const [, updateSettingsPaneOpen] = useSettingsTabOpenManager()

    const compiledChildRef = useRef<any>();

    const [isExecuting, setIsExecuting] = useState(false)

    const [sourceContents, ] = useSourceContentManager()

    const [solidityTab, updateSolidityTabOpen] = useSolidityTabOpenManager()

    const handleSymExec = () => {
        if (sourceRef.current && remoteSymExec) {
          setIsExecuting(true)

          let compileSources = {} as {[index: number]: EVMSource}
        
          for (const index in sourceContents) {
              compileSources[index] = {
                  name: sourceContents[index][SOURCE_FILENAME],
                  sourceText: sourceContents[index][SOURCE_LAST_SAVED_VALUE]
              }
          }

          compileSources[solidityTab].sourceText = sourceRef.current.getSourceValue()

          remoteSymExec(compileSources).catch((r: Error) => {
            console.log(r)
            setError(r.message)
          }).finally(() => {
            setIsExecuting(false)
          })
        }
    }

    const handleCompiledMouseMove = (key: string, source: number) => {
        if (source !== solidityTab) {
            updateSolidityTabOpen(source)
        }
        updateHighlightedClass(key, HighlightedSource.COMPILE)
    }

    const handleOpenSymexecSettings = () => {
        updateSettingsPaneOpen(1)
    }

    const handleAssemblyTabChange = (event: React.SyntheticEvent, newValue: number) => {
        updateAssemblyTabOpen(newValue);
      };

    const hasNoGasMetrics = isEmpty(mappings) || Object.keys(mappings.mappings).length === 0 || mappings.mappings[Object.keys(mappings.mappings)[0]].gasMap == null

    return (
        <Box display="flex" width="38%" flexDirection="column">
            <BorderBox>
                <Box p={1} display="flex" justifyContent="center" alignItems="center">
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
                </Box>
                <Box>
                    <Tabs
                        value={assemblyTab}
                        variant="scrollable"
                        scrollButtons="auto"
                        aria-label="scrollable auto tabs example"
                        onChange={handleAssemblyTabChange}
                    >
                        {
                            contractNames.length > 0 ? contractNames.map((name) => (<Tab label={name} />)) : <Tab label="Empty contract" />
                        }
                    </Tabs>
                </Box>
            </BorderBox>
            <BorderBox flexGrow={1}>
                <CodePane
                    ref={compiledChildRef}
                    language="plaintext"
                    defaultContent={mappings.filteredLines || ASSEMBLY_EMPTY_CONTENT}
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