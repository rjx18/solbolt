import React from 'react'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useExampleLoader } from '../../../hooks'
import { SOURCE_FILENAME, SOURCE_LAST_SAVED_VALUE } from '../../../types'
import { DEFAULT_COMPILER_SETTINGS, DEFAULT_SYMEXEC_SETTINGS } from '../../../constants'
import Button from '@mui/material/Button'
import Accordion from '@mui/material/Accordion';
import { styled } from '@mui/material/styles';
import MuiAccordionSummary, {
  AccordionSummaryProps,
} from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const AccordionSummary = styled((props: AccordionSummaryProps) => (
  <MuiAccordionSummary
      {...props}
    />
  ))(({ theme }) => ({
    '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
      transform: 'none',
    },
  }));

const ExampleOneSourceContent = {
  [SOURCE_FILENAME]: "Example1.sol",
  [SOURCE_LAST_SAVED_VALUE]: `  // SPDX-License-Identifier: GPL-3.0
  pragma solidity >=0.7.0 <0.9.0;
  contract ExampleOne {
      uint8 a = 1;
      uint256 b = 1000;
      uint8 c = 3;
  }
`
}

const ExampleTwoSourceContent = {
  [SOURCE_FILENAME]: "Example2.sol",
  [SOURCE_LAST_SAVED_VALUE]: `  // SPDX-License-Identifier: GPL-3.0
  pragma solidity >=0.7.0 <0.9.0;
  contract ExampleTwo {
      uint8 a = 1;
      uint8 c = 3;
      uint256 b = 1000;
  }
`
}

function OrderingStorageVariables() {

  const loadExample = useExampleLoader()

  const handleExampleOneClick = () => {
    loadExample({
      sourceContent: [ExampleOneSourceContent],
      compileSettings: DEFAULT_COMPILER_SETTINGS,
      symexecSettings: DEFAULT_SYMEXEC_SETTINGS
    })
  }

  const handleExampleTwoClick = () => {
    loadExample({
      sourceContent: [ExampleTwoSourceContent],
      compileSettings: DEFAULT_COMPILER_SETTINGS,
      symexecSettings: DEFAULT_SYMEXEC_SETTINGS
    })
  }

  return (
    <Box>
      <Box>
        <Typography variant="body1">
          Compare the following two code examples by clicking on the buttons below to load them into
          the editor. What is the difference between them?
        </Typography>
        <Grid container spacing={1} sx={{py: 2}}>
          <Grid item>
            <Button onClick={handleExampleOneClick} variant="outlined">
              Example 1
            </Button>
          </Grid>
          <Grid item>
            <Button onClick={handleExampleTwoClick} variant="outlined">
              Example 2
            </Button>
          </Grid>
        </Grid>
      </Box>

      <Box pb={2}>
        <Typography variant="body1">
          Now, for each code example, compile it by clicking on the green play button on the Solidity panel, and then run a
          symbolic execution instance by clicking on the red run button on the EVM Assembly panel.
        </Typography>
      </Box>
      <Box pb={2}>
        <Typography gutterBottom variant="body1">
          Take note of the gas usage for the lines that are different. What do you notice?
        </Typography>
      </Box>
      <Box>
        <Accordion variant='outlined'>
          <AccordionSummary
            aria-controls="example-0-answer"
            id="example-0-answer"
            expandIcon={<ExpandMoreIcon />}
          >
            <Typography sx={{fontWeight: 500}}>Answer</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography gutterBottom variant="body2">
              There are only 2 SSTORE opcodes in the EVM assembly compiled for Example 2, compared
              to 3 SSTORE opcodes in the one for Example 1. 
              <br/><br/>
              In addition, the assembly for Example 2
              uses less gas for storing variables <span style={{fontFamily: "DM Mono"}}>a</span> and <span style={{fontFamily: "DM Mono"}}>c</span>.
              <br/><br/>
              This is because each storage slot in EVM is 256 bits long, and the slots for each variable is assigned
              depending on the order they are initialised. As such, for consecutive variables that are shorter
              than 256 bits, they are automatically packed into one storage slot, and saved together using one <span style={{fontFamily: "DM Mono"}}>SSTORE</span> operation.
              Therefore, depending on the ordering of your variables, there is some scope for gas savings.
            
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Box>
  )
}

export default OrderingStorageVariables