import React from 'react'
import { useSymexecSettingsManager } from '../../contexts/LocalStorage'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import FormGroup from '@mui/material/FormGroup';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { SYMEXEC_CALLDEPTH, SYMEXEC_LOOPBOUND, SYMEXEC_MAXDEPTH, SYMEXEC_STRATEGY, SYMEXEC_TX } from '../../types'
import TextField from '@mui/material/TextField';
import NumberFormat from 'react-number-format'
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';

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

function SymexecOptions() {
  const [symexecSettings, updateSymexecSettings] = useSymexecSettingsManager()

  const handleValueChange = (option: string) => {
    return (event: any) => {

      const newSymexecSettings = {
        ...symexecSettings,
        [option]: event.target.value
      }

      updateSymexecSettings(newSymexecSettings)
    }
  }

  return (
    <Box>
      <Typography variant="button" sx={{fontSize: "12pt"}}>Symexec Options</Typography>
      <Box py={3}>
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