import React from 'react'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useExampleLoader } from '../../../hooks'
import { SOURCE_FILENAME, SOURCE_LAST_SAVED_VALUE, SYMEXEC_LOOPBOUND, SYMEXEC_TX } from '../../../types'
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
  [SOURCE_FILENAME]: "GasInefficient.sol",
  [SOURCE_LAST_SAVED_VALUE]: `  // SPDX-License-Identifier: GPL-3.0
  pragma solidity >=0.7.0 <0.9.0;
  contract InefficientLoop {
      mapping (uint256 => address) private tokenToOwner;
      uint256 indexToMint;

      function mint(uint256 numberToMint) external {
        for (uint256 i = 0; i < numberToMint; i++) {
          tokenToOwner[indexToMint++] = msg.sender;
        }
      }
  }
`
}

const AnswerSourceContent = {
  [SOURCE_FILENAME]: "OptimisedLoops.sol",
  [SOURCE_LAST_SAVED_VALUE]: `  // SPDX-License-Identifier: GPL-3.0
  pragma solidity >=0.7.0 <0.9.0;
  contract InefficientLoop {
      mapping (uint256 => address) private tokenToOwner;
      uint256 indexToMint;

      function mint(uint256 numberToMint) external {
        for (uint256 i = 0; i < numberToMint; i++) {
          tokenToOwner[indexToMint + i] = msg.sender;
        }
        indexToMint += numberToMint;
      }
  }
`
}

const AnswerSourceContentTwo = {
  [SOURCE_FILENAME]: "VeryOptimisedLoops.sol",
  [SOURCE_LAST_SAVED_VALUE]: `  // SPDX-License-Identifier: GPL-3.0
  pragma solidity >=0.7.0 <0.9.0;
  contract InefficientLoop {
      mapping (uint256 => address) private tokenToOwner;
      uint256 indexToMint;

      function mint(uint256 numberToMint) external {
        uint256 i = indexToMint;
        uint256 limit = i + numberToMint;
        for (; i < limit; i++) {
          tokenToOwner[i] = msg.sender;
        }
        indexToMint += numberToMint;
      }
  }
`
}

function StorageLoopMutations() {

  const loadExample = useExampleLoader()

  const handleExampleOneClick = () => {
    loadExample({
      sourceContent: [ExampleOneSourceContent],
      compileSettings: DEFAULT_COMPILER_SETTINGS,
      symexecSettings: {
        ...DEFAULT_SYMEXEC_SETTINGS,
        [SYMEXEC_LOOPBOUND]: 5,
        [SYMEXEC_TX]: 1
      }
    })
  }

  const handleAnswerClick = () => {
    loadExample({
      sourceContent: [AnswerSourceContent],
      compileSettings: DEFAULT_COMPILER_SETTINGS,
      symexecSettings: {
        ...DEFAULT_SYMEXEC_SETTINGS,
        [SYMEXEC_LOOPBOUND]: 5,
        [SYMEXEC_TX]: 1
      }
    })
  }

  const handleAnswerTwoClick = () => {
    loadExample({
      sourceContent: [AnswerSourceContentTwo],
      compileSettings: DEFAULT_COMPILER_SETTINGS,
      symexecSettings: {
        ...DEFAULT_SYMEXEC_SETTINGS,
        [SYMEXEC_LOOPBOUND]: 5,
        [SYMEXEC_TX]: 1
      }
    })
  }

  return (
    <Box>
      <Box>
        <Typography variant="body1">
          Load the following code example, and study the loop within the <span style={{fontFamily: "DM Mono"}}>mint</span> function
          closely. Can you try to optimise the loop, such that it uses as little gas as possible? 
        </Typography>
        <Typography variant="body1" sx={{pt: 2}}>
          You can try running the symbolic execution engine
          too to see which parts of code are using the most gas.
        </Typography>
        <Grid container spacing={1} sx={{py: 2}}>
          <Grid item>
            <Button onClick={handleExampleOneClick} variant="outlined">
              Gas hungry loop
            </Button>
          </Grid>
        </Grid>
      </Box>

      
      <Box>
        <Accordion variant='outlined'>
          <AccordionSummary
            aria-controls="example-0-answer"
            id="example-0-answer"
            expandIcon={<ExpandMoreIcon />}
          >
            <Typography sx={{fontWeight: 500}}>Semi-optimised Answer</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Button onClick={handleAnswerClick} variant="outlined">
              View answer
            </Button>
            <Typography gutterBottom variant="body2" sx={{pt: 2}}>
              In the original gas inefficient loop, we are incrementing the storage
              variable <span style={{fontFamily: "DM Mono"}}>indexToMint</span> in each
              loop iteration, which is extremely gas costly.
            </Typography>
            <Typography gutterBottom variant="body2" sx={{pt: 2}}>
              Instead, we can use the local variable <span style={{fontFamily: "DM Mono"}}>i</span>
              and add it to <span style={{fontFamily: "DM Mono"}}>indexToMint</span> in each iteration, 
              and then update <span style={{fontFamily: "DM Mono"}}>indexToMint</span> once after the loop ends.
            </Typography>
            <Typography gutterBottom variant="body2" sx={{pt: 2}}>
              However, we are still reading from the storage variable <span style={{fontFamily: "DM Mono"}}>indexToMint</span>
              in each loop iteration, which is still more expensive than reading from a local variable stored in memory.
              Can you think of ways to optimise this even further?
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion variant='outlined'>
          <AccordionSummary
            aria-controls="example-0-answer"
            id="example-0-answer"
            expandIcon={<ExpandMoreIcon />}
          >
            <Typography sx={{fontWeight: 500}}>Most-optimised Answer</Typography>
          </AccordionSummary>
          <AccordionDetails>
          <Button onClick={handleAnswerTwoClick} variant="outlined">
              View answer
            </Button>
            <Typography gutterBottom variant="body2" sx={{pt: 2}}>
              Here, instead of reading from the storage variable <span style={{fontFamily: "DM Mono"}}>indexToMint</span> in each iteration,
              we store a copy of it in the local variable <span style={{fontFamily: "DM Mono"}}>i</span>. We also use 
              another local variable <span style={{fontFamily: "DM Mono"}}>limit</span> to store the loop termination condition.
            </Typography>
            <Typography gutterBottom variant="body2" sx={{pt: 2}}>
              Then, we simply use <span style={{fontFamily: "DM Mono"}}>i</span>, that is stored in memory, 
              to index the mapping in each iteration, which is much cheaper than reading from a storage variable. Finally,
              we also update <span style={{fontFamily: "DM Mono"}}>indexToMint</span> at the end of the loop.
              Notice how indexToMint is now only read once at the start of the function, and written to once at the end of the loop.
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Box>
  )
}

export default StorageLoopMutations