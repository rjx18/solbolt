import React, { useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { DEFAULT_SOLIDITY_VALUE } from '../../constants'
import { useHighlightedClass, useUpdateHiglightedClass } from '../../contexts/Decorations'
import { useMappings, useMappingsByIndex } from '../../contexts/Mappings'
import { useRemoteCompiler } from '../../hooks'
import { HighlightedSource } from '../../types'
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
import { useSettingsTabOpenManager, useToggleFreezeHoverManager } from '../../contexts/Application'
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import FormControlLabel from '@mui/material/FormControlLabel';

interface SolidityPaneProps {
    setError: React.Dispatch<React.SetStateAction<string>>
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

    const [contractName, mappings] = useMappingsByIndex(0)
    const [, updateSettingsPaneOpen] = useSettingsTabOpenManager()

    const highlightedClass = useHighlightedClass()
    const updateHighlightedClass = useUpdateHiglightedClass()
  
    const remoteCompile = useRemoteCompiler()

    const sourceChildRef = useRef<any>();

    const [isCompiling, setIsCompiling] = useState(false)

    const [freezeHover, toggleFreezeHover] = useToggleFreezeHoverManager()

    const handleClick = () => {
        if (sourceChildRef.current && remoteCompile) {
          setIsCompiling(true)
        
          const sourceValue = sourceChildRef.current.getValue()
    
          remoteCompile(sourceValue).catch((r: Error) => {
            console.log(r)
            setError(r.message)
          }).finally(() => {
            setIsCompiling(false)
          })
        }
    }

    const handleSourceMouseMove = (key: string) => {
        updateHighlightedClass(key, HighlightedSource.SOURCE)
    }

    const handleOpenCompilerSettings = () => {
        updateSettingsPaneOpen(0)
    }

    return (
        <Box display="flex" width="38%" flexDirection="column">
            <BorderBox p={1} display="flex" justifyContent="center" alignItems="center">
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
                            <SquareIconButton>
                                <SettingsIcon htmlColor={grey[600]} onClick={handleOpenCompilerSettings} />
                            </SquareIconButton>
                        </Grid>
                        <Grid item>
                            <SquareIconButton disabled={isCompiling} onClick={handleClick}>
                                {!isCompiling ? <PlayArrowIcon htmlColor={green[500]} /> :
                                <Box display="flex" alignItems="center" justifyContent="center">
                                    <CircularProgress size={15} style={{color: green[500]}} />
                                </Box>}
                            </SquareIconButton>
                        </Grid>
                    </Grid>
                </Box>
            </BorderBox>
            <BorderBox flexGrow={1}>
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
                    hasSymExec={mappings.hasSymExec}
                />
            </BorderBox>
            
        </Box>
    )
})

export default SolidityPane