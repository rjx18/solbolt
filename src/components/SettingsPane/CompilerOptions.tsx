import React, { useState, useEffect } from 'react'
import { useCompilerSettingsManager, useCompilerTaskManager } from '../../contexts/LocalStorage'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { COMPILER_CONSTANTOPTIMIZER, COMPILER_CSE, COMPILER_DEDUPLICATE, COMPILER_DETAILS, COMPILER_DETAILS_ENABLED, COMPILER_ENABLE, COMPILER_EVM, COMPILER_INLINER, COMPILER_JUMPDESTREMOVER, COMPILER_ORDERLITERALS, COMPILER_PEEPHOLE, COMPILER_RUNS, COMPILER_VERSION, COMPILER_VIAIR, COMPILER_YUL } from '../../types'
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import NumberFormat from 'react-number-format'
import Accordion from '@mui/material/Accordion';
import { styled } from '@mui/material/styles';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import MuiAccordionSummary, {
  AccordionSummaryProps,
} from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { minWidth } from '@mui/system'
import Tooltip from '@mui/material/Tooltip';
import { SOLC_BINARIES } from '../../constants'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import CircularProgress from '@mui/material/CircularProgress'
import { useCompilerErrorManager } from '../../contexts/Application'
import { isVersionGTE } from '../../utils'

function NumberFormatCustom(props: any) {
  const { inputRef, onChange, ...other } = props;

  const MAX_VAL = 2000

  return (
    <NumberFormat
      {...other}
      getInputRef={inputRef}
      onValueChange={values => {
        const valueInt = parseInt(values.value)
        let updatedValue

        if (valueInt >= 0 && valueInt <= MAX_VAL) {
          updatedValue = valueInt
        } else if (valueInt > MAX_VAL) {
          updatedValue = MAX_VAL
        } else {
          updatedValue = 0
        }

        onChange({
          target: {
            name: props.name,
            value: updatedValue
          }
        });
      }}
      allowNegative={false}
      allowLeadingZeros={false}
    />
  );
}

const AccordionSummary = styled((props: AccordionSummaryProps) => (
  <MuiAccordionSummary
      {...props}
    />
  ))(({ theme }) => ({
    '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
      transform: 'none',
    },
  }));

function CompilerOptions() {
  const [compilerSettings, updateCompilerSettings] = useCompilerSettingsManager()
  const [compilerTask, ] = useCompilerTaskManager()
  const [compilerError, ] = useCompilerErrorManager()
  const [hasTask, setHasTask] = useState(false)
  const [taskStartTime, setTaskStartTime] = useState(0)
  const [timerElapsed, setTimerElapsed] = useState(0)

  useEffect(() => {
    if (compilerTask != null) {
      setHasTask(true)
      setTaskStartTime(compilerTask.taskStartTime)
    }

  }, [compilerTask])
  
  useEffect(() => {
    if (compilerTask != null) {
      const timer = setTimeout(() => {
        setTimerElapsed((Date.now() - taskStartTime) / 1000);
      }, 100);
    
      return () => clearTimeout(timer);
    }
  });

  const enabledForVersion = (version: string) => {
    return isVersionGTE(version, compilerSettings[COMPILER_VERSION])
  }

  const handleValueChange = (option: string) => {
    return (event: any) => {

      const newCompilerSettings = {
        ...compilerSettings,
        [option]: event.target.value
      }

      updateCompilerSettings(newCompilerSettings)
    }
  }

  const handleCheckedChange = (option: string) => {
    return (event: any) => {
      const newCompilerSettings = {
        ...compilerSettings,
        [option]: event.target.checked
      }

      updateCompilerSettings(newCompilerSettings)
    }
  }

  const handleDetailsChange = (option: string) => {
    return (event: any) => {

      const newCompilerSettings = {
        ...compilerSettings,
        [COMPILER_DETAILS]: {
          ...compilerSettings[COMPILER_DETAILS],
          [option]: event.target.checked
        }
      }

      updateCompilerSettings(newCompilerSettings)
    }
  }

  const handleEnableDetails = (event: any, expanded: boolean) => {
    const newCompilerSettings = {
      ...compilerSettings,
      [COMPILER_DETAILS_ENABLED]: expanded
    }

    updateCompilerSettings(newCompilerSettings)
  }

  const getCompilerAlert = () => {
    if (compilerTask != null) {
      return <Box pb={3}>
        <Alert key="compiler-task-status" severity={ "info"} icon={<Box display="flex" sx={{paddingTop: "3px", paddingX: "2px"}}><CircularProgress size={18} /></Box>}>
          <AlertTitle>Compiling</AlertTitle>
          Compiling your Solidity contracts, please be patient...

          <Typography variant="body2" sx={{pt: 2}}>
            Time elapsed: {timerElapsed.toFixed(1)}s
          </Typography>
        </Alert>
      </Box>
    } else if (compilerError != null) {
      return <Box pb={3}>
        <Alert key="compiler-task-status" severity={"error"}>
          <AlertTitle>Compilation error</AlertTitle>
          The following error occured while compiling your contracts:
          <Typography variant="body2" sx={{pt: 2, fontWeight: 500}}>
            {compilerError}
          </Typography>
        </Alert>
      </Box>
    } else if (hasTask) {
      return <Box pb={3}>
        <Alert key="compiler-task-status" severity={"success"}>
          <AlertTitle>Compilation succeeded!</AlertTitle>
          Time taken: {timerElapsed.toFixed(1)}s
        </Alert>
      </Box>
    } else {
      return null
    }
  }

  return (
    <Box>
      <Typography variant="button" sx={{fontSize: "12pt"}}>Compiler Options</Typography>
      <Box py={3}>
        {getCompilerAlert()}
        <FormGroup>
          <FormControl fullWidth>
            <InputLabel id="compiler-settings-evm-version">Compiler Version</InputLabel>
            <Select
              labelId="compiler-settings-compiler-version-select-label"
              id="compiler-settings-compiler-version-select"
              value={compilerSettings[COMPILER_VERSION]}
              label="Compiler Version"
              onChange={handleValueChange(COMPILER_VERSION)}
            >
              {SOLC_BINARIES.map((version) => (<MenuItem value={version}>{version}</MenuItem>))}
            </Select>
          </FormControl>
          <FormControl sx={{mt: 3}} fullWidth>
            <InputLabel id="compiler-settings-evm-version">EVM Version</InputLabel>
            <Select
              labelId="compiler-settings-evm-version-select-label"
              id="compiler-settings-evm-version-select"
              value={compilerSettings[COMPILER_EVM]}
              label="EVM Version"
              onChange={handleValueChange(COMPILER_EVM)}
            >
              <MenuItem value={'Default'}>Default</MenuItem>
              <MenuItem value={'homestead'}>homestead</MenuItem>
              <MenuItem value={'tangerineWhistle'}>tangerineWhistle</MenuItem>
              <MenuItem value={'spuriousDragon'}>spuriousDragon</MenuItem>
              <MenuItem value={'byzantium'}>byzantium</MenuItem>
              <MenuItem value={'constantinople'}>constantinople</MenuItem>
              <MenuItem value={'petersburg'}>petersburg</MenuItem>
              <MenuItem value={'istanbul'}>istanbul</MenuItem>
              <MenuItem value={'berlin'}>berlin</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel sx={{pt: 2}} control={<Switch />} checked={compilerSettings[COMPILER_ENABLE]} onChange={handleCheckedChange(COMPILER_ENABLE)} label="Enable optimization" labelPlacement='end' />
          <Box pt={2}>
            <TextField
              id="compiler-settings-runs"
              label="Optimizer runs"
              InputLabelProps={{
                shrink: true,
              }}
              variant="outlined"
              value={compilerSettings[COMPILER_RUNS]}
              onChange={handleValueChange(COMPILER_RUNS)}
              fullWidth={true}
              onFocus={event => {
                event.target.select();
              }}
              InputProps={{
                inputComponent: NumberFormatCustom,
              }}
            />
          </Box>
          <Tooltip title="Only available for Solidity v0.7.5 and above">
            <FormControlLabel sx={{pt: 2}} control={<Switch />} checked={compilerSettings[COMPILER_VIAIR]} onChange={handleCheckedChange(COMPILER_VIAIR)} disabled={!enabledForVersion("v0.7.5")} label="Enable experimental Yul IR pipeline" labelPlacement='end' />
          </Tooltip>
          <Box pt={2}>
            <Accordion variant='outlined' expanded={compilerSettings[COMPILER_DETAILS_ENABLED]} onChange={handleEnableDetails} disabled={!enabledForVersion("v0.5.5")}>
              <AccordionSummary
                expandIcon={<Switch checked={compilerSettings[COMPILER_DETAILS_ENABLED]}/>}
                aria-controls="panel1a-content"
                id="panel1a-header"
              >
                <Typography>Advanced Optimizer Settings</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormGroup>
                  <Tooltip title="Enables the peephole optimizer">
                    <FormControlLabel control={<Switch />} checked={compilerSettings[COMPILER_DETAILS][COMPILER_PEEPHOLE]} onChange={handleDetailsChange(COMPILER_PEEPHOLE)} label="Peephole" labelPlacement='end' />
                  </Tooltip>
                  <Tooltip title="Enables the inliner optimizer, which inlines function bodies rather than using jumps. Only available for v0.8.2+">
                    <FormControlLabel control={<Switch />} checked={compilerSettings[COMPILER_DETAILS][COMPILER_INLINER]} disabled={!enabledForVersion("v0.8.2")} onChange={handleDetailsChange(COMPILER_INLINER)} label="Inliner" labelPlacement='end' />
                  </Tooltip>
                  <Tooltip title="Removes unused JUMPDESTs">
                    <FormControlLabel control={<Switch />} checked={compilerSettings[COMPILER_DETAILS][COMPILER_JUMPDESTREMOVER]} onChange={handleDetailsChange(COMPILER_JUMPDESTREMOVER)} label="JUMPDEST remover" labelPlacement='end' />
                  </Tooltip>
                  <Tooltip title="Sometimes re-orders literals in commutative operations to improve performance">
                    <FormControlLabel control={<Switch />} checked={compilerSettings[COMPILER_DETAILS][COMPILER_ORDERLITERALS]} onChange={handleDetailsChange(COMPILER_ORDERLITERALS)} label="Order literals" labelPlacement='end' />
                  </Tooltip>
                  <Tooltip title="Removes duplicate code blocks">
                    <FormControlLabel control={<Switch />} checked={compilerSettings[COMPILER_DETAILS][COMPILER_DEDUPLICATE]} onChange={handleDetailsChange(COMPILER_DEDUPLICATE)} label="Deduplicate" labelPlacement='end' />
                  </Tooltip>
                  <Tooltip title="Common subexpression elimination, this is the most complicated step but can also provide the largest gain">
                    <FormControlLabel control={<Switch />} checked={compilerSettings[COMPILER_DETAILS][COMPILER_CSE]} onChange={handleDetailsChange(COMPILER_CSE)} label="CSE" labelPlacement='end' />
                  </Tooltip>
                  <Tooltip title="Optimize representation of literal numbers and strings in code">
                    <FormControlLabel control={<Switch />} checked={compilerSettings[COMPILER_DETAILS][COMPILER_CONSTANTOPTIMIZER]} onChange={handleDetailsChange(COMPILER_CONSTANTOPTIMIZER)} label="Constant Optimizer" labelPlacement='end' />
                  </Tooltip>
                  <Tooltip title="The new Yul optimizer, mostly operates on the code of ABI coder v2 and inline assembly (Must be enabled together with the Yul pipeline)">
                    <FormControlLabel control={<Switch />} checked={compilerSettings[COMPILER_DETAILS][COMPILER_YUL]} onChange={handleDetailsChange(COMPILER_YUL)} label="Yul Optimizer" labelPlacement='end' />
                  </Tooltip>
                </FormGroup>
              </AccordionDetails>
            </Accordion>
          </Box>
        </FormGroup>
      </Box>
    </Box>
  )
}

export default CompilerOptions