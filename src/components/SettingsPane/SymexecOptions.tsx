import React, { useState, useEffect } from 'react'
import { useSymexecContractManager, useSymexecSettingsManager, useSymexecTaskManager } from '../../contexts/LocalStorage'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import FormGroup from '@mui/material/FormGroup';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { SYMEXEC_CALLDEPTH, SYMEXEC_ENABLE_ONCHAIN, SYMEXEC_IGNORE_CONSTRAINTS, SYMEXEC_LOOPBOUND, SYMEXEC_MAXDEPTH, SYMEXEC_ONCHAIN_ADDRESS, SYMEXEC_STRATEGY, SYMEXEC_TX } from '../../types'
import TextField from '@mui/material/TextField';
import NumberFormat from 'react-number-format'
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Accordion from '@mui/material/Accordion';
import { styled } from '@mui/material/styles';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import MuiAccordionSummary, {
  AccordionSummaryProps,
} from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Switch from '@mui/material/Switch';
import CircularProgress from '@mui/material/CircularProgress'
import { useSymexecErrorManager } from '../../contexts/Application'
import FormControlLabel from '@mui/material/FormControlLabel';

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

function SymexecOptions() {
  const [symexecSettings, updateSymexecSettings] = useSymexecSettingsManager()
  const [symexecTask, ] = useSymexecTaskManager()
  const [symexecError, ] = useSymexecErrorManager()
  const [symexecContract, ] = useSymexecContractManager()
  const [hasTask, setHasTask] = useState(false)
  const [taskStartTime, setTaskStartTime] = useState(0)
  const [timerElapsed, setTimerElapsed] = useState(0)

  useEffect(() => {
    if (symexecTask != null) {
      setHasTask(true)
      setTaskStartTime(symexecTask.taskStartTime)
    }

  }, [symexecTask])

  useEffect(() => {
    if (symexecTask != null) {
      const timer = setTimeout(() => {
        setTimerElapsed((Date.now() - taskStartTime) / 1000);
      }, 100);
    
      return () => clearTimeout(timer);
    }
  });
  

  const handleValueChange = (option: string) => {
    return (event: any) => {

      const newSymexecSettings = {
        ...symexecSettings,
        [option]: event.target.value
      }

      updateSymexecSettings(newSymexecSettings)
    }
  }

  const handleEnableOnchain = (event: any, expanded: boolean) => {
    const newSymexecSettings = {
      ...symexecSettings,
      [SYMEXEC_ENABLE_ONCHAIN]: expanded
    }

    updateSymexecSettings(newSymexecSettings)
  }

  const handleCheckedChange = (option: string) => {
    return (event: any) => {
      const newSymexecSettings = {
        ...symexecSettings,
        [option]: event.target.checked
      }

      updateSymexecSettings(newSymexecSettings)
    }
  }

  const getSymexecAlert = () => {
    if (symexecTask != null) {
      return <Box pb={3}>
        <Alert key="compiler-task-status" severity={ "info"} icon={<Box display="flex" sx={{paddingTop: "3px", paddingX: "2px"}}><CircularProgress size={18} /></Box>}>
          <AlertTitle>Symbolically executing</AlertTitle>
          Executing your <b>{symexecContract}</b> contract. This may take a while depending on
          how busy the server is, please be patient...

          <Typography variant="body2" sx={{pt: 2}}>
            Time elapsed: {timerElapsed.toFixed(1)}s
          </Typography>
        </Alert>
      </Box>
    } else if (symexecError != null) {
      return <Box pb={3}>
        <Alert key="compiler-task-status" severity={"error"}>
          <AlertTitle>Symbolic execution error</AlertTitle>
          The following error occured while trying to symbolically execute:
          <Typography variant="body2" sx={{pt: 2, fontWeight: 500}}>
            {symexecError}
          </Typography>
        </Alert>
      </Box>
    } else if (hasTask) {
      return <Box pb={3}>
        <Alert key="compiler-task-status" severity={"success"}>
          <AlertTitle>Symbolic execution succeeded!</AlertTitle>
          Time taken: {timerElapsed.toFixed(1)}s
        </Alert>
      </Box>
    } else {
      return null
    }
  }

  return (
    <Box>
      <Typography variant="button" sx={{fontSize: "12pt"}}>Symexec Options</Typography>
      <Box py={3}>
        {getSymexecAlert()}
        <FormGroup>
          <FormControl fullWidth>
            <InputLabel id="symexec-settings-strategy">Strategy</InputLabel>
            <Select
              labelId="symexec-settings-strategy-select-label"
              id="symexec-settings-strategy-select"
              value={symexecSettings[SYMEXEC_STRATEGY]}
              label="Strategy"
              onChange={handleValueChange(SYMEXEC_STRATEGY)}
            >
              <MenuItem value={'bfs'}>Breadth first search</MenuItem>
              <MenuItem value={'dfs'}>Depth first search</MenuItem>
              <MenuItem value={'naive-random'}>Naive random search</MenuItem>
              <MenuItem value={'weighted-random'}>Weighted random search</MenuItem>
            </Select>
          </FormControl>
          <Box pt={2}>
            <TextField
              id="symexec-settings-max-depth"
              label="Max depth"
              InputLabelProps={{
                shrink: true,
              }}
              variant="outlined"
              value={symexecSettings[SYMEXEC_MAXDEPTH]}
              onChange={handleValueChange(SYMEXEC_MAXDEPTH)}
              fullWidth={true}
              onFocus={event => {
                event.target.select();
              }}
              InputProps={{
                inputComponent: NumberFormatCustom,
              }}
            />
          </Box>
          <Box pt={2}>
            <TextField
              id="symexec-settings-call-depth"
              label="Call depth limit"
              InputLabelProps={{
                shrink: true,
              }}
              variant="outlined"
              value={symexecSettings[SYMEXEC_CALLDEPTH]}
              onChange={handleValueChange(SYMEXEC_CALLDEPTH)}
              fullWidth={true}
              onFocus={event => {
                event.target.select();
              }}
              InputProps={{
                inputComponent: NumberFormatCustom,
              }}
            />
          </Box>
          <Box pt={2}>
            <TextField
              id="symexec-settings-loop-bounds"
              label="Loop bounds limit"
              InputLabelProps={{
                shrink: true,
              }}
              variant="outlined"
              value={symexecSettings[SYMEXEC_LOOPBOUND]}
              onChange={handleValueChange(SYMEXEC_LOOPBOUND)}
              fullWidth={true}
              onFocus={event => {
                event.target.select();
              }}
              InputProps={{
                inputComponent: NumberFormatCustom,
              }}
            />
          </Box>
          <Tooltip title="Number of transactions to run with the final returned states returned by the previous symbolically executed transaction.">
            <Box pt={2}>
              <TextField
                id="symexec-settings-tx"
                label="Transaction states limit"
                InputLabelProps={{
                  shrink: true,
                }}
                variant="outlined"
                value={symexecSettings[SYMEXEC_TX]}
                onChange={handleValueChange(SYMEXEC_TX)}
                fullWidth={true}
                onFocus={event => {
                  event.target.select();
                }}
                InputProps={{
                  inputComponent: NumberFormatCustom,
                }}
              />
            </Box>
          </Tooltip>
          <Tooltip title="When enabled, the symbolic engine will ignore any satisfiability constraints, and instead execute every possible path regardless of whether they are reachable or not.">
            <FormControlLabel 
              sx={{pt: 2}} 
              control={<Switch />} 
              checked={symexecSettings[SYMEXEC_IGNORE_CONSTRAINTS]} 
              onChange={handleCheckedChange(SYMEXEC_IGNORE_CONSTRAINTS)} 
              label="Ignore constraints" labelPlacement='end' />
          </Tooltip>
          <Box pt={2}>
            <Tooltip title="Uses the concrete onchain storage state instead of a symbolic storage state while executing">
              <Accordion variant='outlined' expanded={symexecSettings[SYMEXEC_ENABLE_ONCHAIN]} onChange={handleEnableOnchain}>
                  <AccordionSummary
                    expandIcon={<Switch checked={symexecSettings[SYMEXEC_ENABLE_ONCHAIN]}/>}
                    aria-controls="panel1a-content"
                    id="symexec-onchain-header"
                  >
                    <Typography>Enable onchain lookup</Typography>
                  </AccordionSummary>
                <AccordionDetails>
                  <FormGroup>
                    <TextField
                      id="symexec-onchain-address"
                      label="Onchain address"
                      InputLabelProps={{
                        shrink: true,
                      }}
                      variant="outlined"
                      value={symexecSettings[SYMEXEC_ONCHAIN_ADDRESS]}
                      onChange={handleValueChange(SYMEXEC_ONCHAIN_ADDRESS)}
                      fullWidth={true}
                      onFocus={event => {
                        event.target.select();
                      }}
                    />
                  </FormGroup>
                </AccordionDetails>
              </Accordion>
            </Tooltip>
          </Box>
        </FormGroup>
        <Box pt={2}>
          <Alert severity="info">
            <AlertTitle>Note</AlertTitle>
              All symbolic execution instances are run with a timeout of 120 seconds. This means 
              setting the transaction states or loop bounds limit too high will result in 
              premature termination of the execution once this timeout is reached.
          </Alert>
        </Box>
        
      </Box>
    </Box>
  )
}

export default SymexecOptions