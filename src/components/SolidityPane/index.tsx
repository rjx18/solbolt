import React, { useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { DEFAULT_SOLIDITY_VALUE } from '../../constants'
import { useContractNames } from '../../contexts/Contracts'
import { useHighlightedClass, useUpdateHiglightedClass } from '../../contexts/Decorations'
import { useMappings } from '../../contexts/Mappings'
import { useRemoteCompiler } from '../../hooks'
import { HighlightedSource } from '../../types'
import CodePane from '../CodePane'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { solid } from '@fortawesome/fontawesome-svg-core/import.macro'

import { styled, createTheme, ThemeProvider } from '@mui/system';

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Grid from '@mui/material/Grid'
import CodeIcon from '@mui/icons-material/Code';
import SettingsIcon from '@mui/icons-material/Settings';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { green, grey } from '@mui/material/colors'
import CircularProgress from '@mui/material/CircularProgress';

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

    const contractNames = useContractNames()

    const contractName = contractNames.length !== 0 ? contractNames[0] : 'UNKNOWN'

    const mappings = useMappings(contractName)

    const highlightedClass = useHighlightedClass()
    const updateHighlightedClass = useUpdateHiglightedClass()
  
    const remoteCompile = useRemoteCompiler()

    const sourceChildRef = useRef<any>();

    const [isCompiling, setIsCompiling] = useState(false)

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
                        <Grid item>
                            <SquareIconButton>
                                <SettingsIcon htmlColor={grey[600]}  />
                            </SquareIconButton>
                        </Grid>
                        <Grid item>
                            <SquareIconButton disabled={isCompiling}>
                                {!isCompiling ? <PlayArrowIcon htmlColor={green[500]} onClick={handleClick} /> :
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
                />
            </BorderBox>
            
        </Box>
    )
})

export default SolidityPane