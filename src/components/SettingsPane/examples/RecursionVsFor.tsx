import React from 'react'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useExampleLoader } from '../../../hooks'
import { SOURCE_FILENAME, SOURCE_LAST_SAVED_VALUE, SYMEXEC_CALLDEPTH, SYMEXEC_LOOPBOUND, SYMEXEC_MAXDEPTH, SYMEXEC_TX } from '../../../types'
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

  const ForLoop = {
    [SOURCE_FILENAME]: "ForLoop.sol",
    [SOURCE_LAST_SAVED_VALUE]: `  // SPDX-License-Identifier: GPL-3.0
    pragma solidity >=0.7.0 <0.9.0;
    contract ForLoop {
        function getFactorial(uint256 number) public pure returns(uint256) {
          require(number >= 0);
          uint256 factorial = 1;
          while (number > 0) {
            factorial *= number;
            number--;
          }
          return factorial;
        }
    }
  `
  }

const RecursiveLoop = {
  [SOURCE_FILENAME]: "RecursiveLoop.sol",
  [SOURCE_LAST_SAVED_VALUE]: `  // SPDX-License-Identifier: GPL-3.0
  pragma solidity >=0.7.0 <0.9.0;
  contract RecursiveLoop {
      function getFactorial(uint256 number) public pure returns(uint256) {
        require(number >= 0);
        if (number == 0) {
          return 1;
        } else {
          return number * getFactorial(number - 1);
        }
      }
  }
`
}

const TailRecursiveLoop = {
  [SOURCE_FILENAME]: "TailRecursiveLoop.sol",
  [SOURCE_LAST_SAVED_VALUE]: `  // SPDX-License-Identifier: GPL-3.0
  pragma solidity >=0.7.0 <0.9.0;
  contract TailRecursiveLoop {
      function getFactorial(uint256 number) public pure returns(uint256) {
        return tailFactorial(1, number);
      }

      function tailFactorial(uint256 acc, uint256 number) internal pure returns(uint256) {
        require(number >= 0);
        if (number == 0) {
          return acc;
        } else {
          return tailFactorial(number * acc, number - 1);
        }
      }
  }
`
}

function RecursionVsFor() {

  const loadExample = useExampleLoader()

  const handleForLoopClick = () => {
    loadExample({
      sourceContent: [ForLoop],
      compileSettings: DEFAULT_COMPILER_SETTINGS,
      symexecSettings: DEFAULT_SYMEXEC_SETTINGS,
    })
  }

  const handleRecursiveLoopClick = () => {
    loadExample({
      sourceContent: [RecursiveLoop],
      compileSettings: DEFAULT_COMPILER_SETTINGS,
      symexecSettings: DEFAULT_SYMEXEC_SETTINGS,
    })
  }

  const handleTailRecursiveLoopClick = () => {
    loadExample({
      sourceContent: [TailRecursiveLoop],
      compileSettings: DEFAULT_COMPILER_SETTINGS,
      symexecSettings: DEFAULT_SYMEXEC_SETTINGS,
    })
  }

  return (
    <Box>
      <Box>
        <Typography variant="body1">
          There are three types of loops below: a simple for loop, a recursive loop, and a tail recursive loop. Compare
          them and run a symbolic execution instance for each of them to understand how function calls affect gas 
          consumption.
        </Typography>
        <Grid container spacing={1} sx={{py: 2}}>
          <Grid item>
            <Button onClick={handleForLoopClick} variant="outlined">
              For loop
            </Button>
          </Grid>
          <Grid item>
            <Button onClick={handleRecursiveLoopClick} variant="outlined">
              Recursive loop
            </Button>
          </Grid>
          <Grid item>
            <Button onClick={handleTailRecursiveLoopClick} variant="outlined">
              Tail recursive loop
            </Button>
          </Grid>
        </Grid>
      </Box>
    
    </Box>
  )
}

export default RecursionVsFor