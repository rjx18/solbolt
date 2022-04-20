import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { DEFAULT_SOLIDITY_VALUE } from '../../constants'
import { useHighlightedClass, useUpdateHiglightedClass } from '../../contexts/Decorations'
import { useMappings, useMappingsByIndex } from '../../contexts/Mappings'
import { useAddressLoader, useRemoteCompiler } from '../../hooks'
import { EVMJSON, EVMSource, HighlightedSource, SOURCE_FILENAME, SOURCE_LAST_SAVED_VALUE, SOURCE_MODEL, SOURCE_VIEW_STATE } from '../../types'
import CodePane from '../CodePane'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { solid } from '@fortawesome/fontawesome-svg-core/import.macro'

import { styled, createTheme, ThemeProvider } from '@mui/system';

import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Grid from '@mui/material/Grid'
import CodeIcon from '@mui/icons-material/Code';
import SettingsIcon from '@mui/icons-material/Settings';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { green, grey } from '@mui/material/colors'
import CircularProgress from '@mui/material/CircularProgress';
import { useAssemblyTabOpenManager, useSettingsTabOpenManager, useSolidityTabOpenManager, useToggleFreezeHoverManager } from '../../contexts/Application'
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import FormControlLabel from '@mui/material/FormControlLabel';

import Tabs from '@mui/material/Tabs';
import MuiTab from '@mui/material/Tab';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { useSourceManager } from '../../contexts/Sources'
import TabDialog from '../TabDialog'

import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import LoadAddressDialog from '../LoadAddressDialog'

interface StyledTabProps {
    label: any;
    style?: any;
}

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

interface SolidityPaneProps {
    setError: (_error: string) => void
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

const SquareButton = styled(Button)(({ theme }) => ({
    borderRadius: 10,
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "#dddddd",
    height: 40,
    }));

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

    const [sources, {updateSource, removeSource}] = useSourceManager()

    const sourceNames = sources.map((source) => (source[SOURCE_FILENAME]))

    const [solidityTab, updateSolidityTabOpen] = useSolidityTabOpenManager()
    const [assemblyTab, ] = useAssemblyTabOpenManager()

    const currentSource = sources[solidityTab]

    const [contractName, mappings] = useMappingsByIndex(assemblyTab)
    const [, updateSettingsPaneOpen] = useSettingsTabOpenManager()

    const highlightedClass = useHighlightedClass()
    const updateHighlightedClass = useUpdateHiglightedClass()
  
    const remoteCompile = useRemoteCompiler()
    const addressLoad = useAddressLoader()

    const sourceChildRef = useRef<any>();

    const [isCompiling, setIsCompiling] = useState(false)
    const [isLoadingFromAddress, setIsLoadingFromAddress] = useState(false)

    const [freezeHover, toggleFreezeHover] = useToggleFreezeHoverManager()

    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [loadFromAddressOpen, setLoadFromAddressOpen] = useState(false)

    const handleClick = () => {
        if (sourceChildRef.current && remoteCompile) {
          setIsCompiling(true)

          let compileSources = {} as {[index: number]: EVMSource}
        
          for (const index in sources) {
              compileSources[index] = {
                  name: sources[index][SOURCE_FILENAME],
                  sourceText: sources[index][SOURCE_LAST_SAVED_VALUE]
              }
          }

          compileSources[solidityTab].sourceText = sourceChildRef.current.getValue()

          remoteCompile(compileSources).catch((r: Error) => {
            console.log(r)
            setError(r.message)
          }).finally(() => {
            setIsCompiling(false)
          })
        }
    }

    const handleSourceMouseMove = (key: string, source: number) => {
        console.log(key)
        if (source === solidityTab) {
            updateHighlightedClass(key, HighlightedSource.SOURCE)
        }
    }

    const handleOpenCompilerSettings = () => {
        updateSettingsPaneOpen(0)
    }

    const handleSolidityTabChange = (event: React.SyntheticEvent, newValue: number) => {
        const viewState = sourceChildRef.current.getViewState()
        const updatedValue = sourceChildRef.current.getValue()

        const newSource = {
            ...currentSource,
            [SOURCE_VIEW_STATE]: viewState,
            [SOURCE_LAST_SAVED_VALUE]: updatedValue
        }

        updateSource(solidityTab, newSource)

        updateSolidityTabOpen(newValue);
      };

    const handleAddSource = () => {
        const sourceLength = sources.length
        const newFilename = `File${sourceLength + 1}.sol`

        const newSource = {
            [SOURCE_FILENAME]: newFilename,
            [SOURCE_MODEL]: sourceChildRef.current.createModel(DEFAULT_SOLIDITY_VALUE),
            [SOURCE_VIEW_STATE]: undefined,
            [SOURCE_LAST_SAVED_VALUE]: DEFAULT_SOLIDITY_VALUE
        }

        updateSource(sourceLength, newSource)
        updateSolidityTabOpen(sourceLength)
    }

    const handleCreateModel = (newContent: string) => {
        return sourceChildRef.current.createModel(newContent)
    }

    const onEditorMount = () => {
        console.log("Mounted!")
        handleAddSource()
    }

    const handleEditClick = (e: any) => {
        e.preventDefault()
        setEditDialogOpen(true)
    }

    const handleMouseDown = (e: any) => {
        e.stopPropagation();
    }

    const handleEditDialogClose = () => {
        setEditDialogOpen(false)
    }

    const handleEditDialogSave = (name: string) => {
        const newSource = {
            ...currentSource,
            [SOURCE_FILENAME]: name,
        }

        updateSource(solidityTab, newSource)
    }

    const handleEditDialogDelete = () => {
        removeSource(solidityTab)
        if (solidityTab != 0) {
            updateSolidityTabOpen(solidityTab - 1)
        }
    }

    const handleLoadFromAddress = (address: string) => {
        if (sourceChildRef.current && addressLoad) {
            setIsLoadingFromAddress(true)
  
            addressLoad(address, handleCreateModel).catch((r: Error) => {
                console.log(r)
                setError(r.message)
            }).finally(() => {
                setIsLoadingFromAddress(false)
            })
        }
    }

    const handleLoadFromAddressOpen = () => {
        setLoadFromAddressOpen(true)
    }

    const handleLoadFromAddressClose = () => {
        setLoadFromAddressOpen(false)
    }
    

    return (
        <Box display="flex" width="38%" flexDirection="column">
            <BorderBox>
                <Box p={1} display="flex" justifyContent="center" alignItems="center">
                    <Box flexGrow={1} ml={2} display="flex" alignItems="center">
                        <CodeIcon/>
                        <Typography variant="button" textAlign="center" alignItems="center" justifyContent="center" m={1} fontSize="12pt">
                            Solidity
                        </Typography>
                    </Box>
                    <Box>
                        <Grid container spacing={1}>
                            <Grid item sx={{alignItems: 'center', display: 'flex'}}>
                                <Tooltip title={"Freeze mouse hover (Ctrl + Q)"}>
                                    <FormControlLabel 
                                        control={<Switch checked={freezeHover} onChange={toggleFreezeHover} size='small'/>} 
                                        label={
                                            <Box pl={1} display="flex" alignItems="center">
                                                <FontAwesomeIcon icon={solid('snowflake')} style={{color: grey[700]}} />
                                                <Paper variant='outlined' sx={{display:"flex", height: "100%", alignItems: "center", justifyContent: "center", marginLeft: "5px", paddingX: "4px"}}>
                                                    <Typography variant="subtitle2" style={{color: grey[600]}}>
                                                        Ctrl+Q
                                                    </Typography>
                                                </Paper>
                                            </Box>
                                        } />
                                </Tooltip>
                            </Grid>
                            <Grid item>
                                <Tooltip title="Load from address">
                                    <SquareIconButton onClick={handleLoadFromAddressOpen}>
                                        {!isLoadingFromAddress ? <CloudDownloadIcon htmlColor={grey[600]} /> :
                                        <Box display="flex" alignItems="center" justifyContent="center">
                                            <CircularProgress size={15} style={{color: grey[600]}} />
                                        </Box>}
                                    </SquareIconButton>
                                </Tooltip>
                            </Grid>
                            <Grid item>
                                <Tooltip title="Compiler settings">
                                    <SquareIconButton onClick={handleOpenCompilerSettings}>
                                        <SettingsIcon htmlColor={grey[600]} />
                                    </SquareIconButton>
                                </Tooltip>
                            </Grid>
                            <Grid item>
                                <Tooltip title="Compile sources">
                                    <SquareIconButton disabled={isCompiling} onClick={handleClick}>
                                        {!isCompiling ? <PlayArrowIcon htmlColor={green[500]} /> :
                                        <Box display="flex" alignItems="center" justifyContent="center">
                                            <CircularProgress size={15} style={{color: green[500]}} />
                                        </Box>}
                                    </SquareIconButton>
                                </Tooltip>
                            </Grid>
                        </Grid>
                    </Box>
                </Box>
                    <Box display="flex" width="100%" alignItems="center">
                        <Tabs
                            value={solidityTab}
                            variant="scrollable"
                            scrollButtons="auto"
                            aria-label="scrollable auto tabs example"
                            onChange={handleSolidityTabChange}
                            sx={{flexGrow: 1}}
                        >
                            {
                                sourceNames.map((name, index) => (<Tab {...props} label={<Box alignItems="center" display="flex">
                                    {name} 
                                    {index === solidityTab && <IconButton aria-label="delete" size="small" sx={{ml: 1, mr: 0}} onClick={handleEditClick} onMouseDown={handleMouseDown}>
                                        <EditIcon fontSize="inherit" />
                                    </IconButton>}
                                </Box>}
                                {...(index === solidityTab && {style: {padding: "0px 0px 0px 12px"}})} />))
                            }
                        </Tabs>
                        <Box pr={1}>
                            <IconButton aria-label="add" onClick={handleAddSource}>
                                <AddIcon />
                            </IconButton>
                        </Box>
                    </Box>
                {/* </Box> */}
            </BorderBox>
            {<BorderBox flexGrow={1}>
                <CodePane
                    ref={sourceChildRef}
                    language="sol"
                    contract={currentSource && currentSource[SOURCE_FILENAME]}
                    model={currentSource && currentSource[SOURCE_MODEL]}
                    viewState={currentSource && currentSource[SOURCE_VIEW_STATE]}
                    height="100%"
                    handleMouseHover={handleSourceMouseMove}
                    onMounted={onEditorMount}
                    readOnly={false}
                    source={HighlightedSource.SOURCE}
                    mappings={mappings.mappings}
                    highlightedClass={highlightedClass}
                    hasSymExec={mappings.hasSymExec}
                    solidityTab={solidityTab}
                />
            </BorderBox>}
            <TabDialog 
                open={editDialogOpen}
                name={currentSource && currentSource[SOURCE_FILENAME]}
                onClose={handleEditDialogClose}
                onSave={handleEditDialogSave}
                onDelete={sources.length > 1 ? handleEditDialogDelete : undefined}/>
            <LoadAddressDialog 
                open={loadFromAddressOpen}
                onClose={handleLoadFromAddressClose}
                onLoad={handleLoadFromAddress}/>
        </Box>
    )
})

export default SolidityPane