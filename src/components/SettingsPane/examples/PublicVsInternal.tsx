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

  const ManyPublicFunctions = {
    [SOURCE_FILENAME]: "ManyPublicFunctions.sol",
    [SOURCE_LAST_SAVED_VALUE]: `  // SPDX-License-Identifier: GPL-3.0
    pragma solidity >=0.7.0 <0.9.0;
    contract ManyPublicFunctions {
        uint256 a;
        uint256 b;
        uint256 c;
        uint256 d;
        uint256 e;
        uint256 f;
        uint256 g;
        uint256 h;
        uint256 i;
        uint256 j;


        function setA(uint256 _a) public {
          a = _a;
        }

        function setB(uint256 _b) public {
          b = _b;
        }

        function setC(uint256 _c) public {
          c = _c;
        }

        function setD(uint256 _d) public {
          d = _d;
        }

        function setE(uint256 _e) public {
          e = _e;
        }

        function setF(uint256 _f) public {
          f = _f;
        }

        function setG(uint256 _g) public {
          g = _g;
        }

        function setH(uint256 _h) public {
          h = _h;
        }

        function setI(uint256 _i) public {
          i = _i;
        }

        function setJ(uint256 _j) public {
          j = _j;
        }
    }
  `
  }

const ManyInternalFunctions = {
  [SOURCE_FILENAME]: "ManyInternalFunctions.sol",
  [SOURCE_LAST_SAVED_VALUE]: `  // SPDX-License-Identifier: GPL-3.0
  pragma solidity >=0.7.0 <0.9.0;
  contract ManyInternalFunctions {
      uint256 a;
      uint256 b;
      uint256 c;
      uint256 d;
      uint256 e;
      uint256 f;
      uint256 g;
      uint256 h;
      uint256 i;
      uint256 j;


      function setA(uint256 _a) public {
        a = _a;
      }

      function setB(uint256 _b) internal {
        b = _b;
      }

      function setC(uint256 _c) internal {
        c = _c;
      }

      function setD(uint256 _d) internal {
        d = _d;
      }

      function setE(uint256 _e) internal {
        e = _e;
      }

      function setF(uint256 _f) internal {
        f = _f;
      }

      function setG(uint256 _g) internal {
        g = _g;
      }

      function setH(uint256 _h) internal {
        h = _h;
      }

      function setI(uint256 _i) internal {
        i = _i;
      }

      function setJ(uint256 _j) internal {
        j = _j;
      }
  }

`
}

function PublicVsInternal() {

  const loadExample = useExampleLoader()

  const handlePublicClick = () => {
    loadExample({
      sourceContent: [ManyPublicFunctions],
      compileSettings: DEFAULT_COMPILER_SETTINGS,
      symexecSettings: DEFAULT_SYMEXEC_SETTINGS,
    })
  }

  const handleInternalClick = () => {
    loadExample({
      sourceContent: [ManyInternalFunctions],
      compileSettings: DEFAULT_COMPILER_SETTINGS,
      symexecSettings: DEFAULT_SYMEXEC_SETTINGS,
    })
  }

  return (
    <Box>
      <Box>
        <Typography variant="body1">
          Is it possible for a function to affect the gas cost of another, 
          completely unrelated function in the same smart contract?
        </Typography>
        <Typography variant="body1" sx={{pt: 2}}>
          Read and compare the two smart contracts below, and predict if and how the
          gas consumption of function <span style={{fontFamily: "DM Mono"}}>setA</span>
          differs between the two contracts:
        </Typography>
        <Grid container spacing={1} sx={{py: 2}}>
          <Grid item>
            <Button onClick={handlePublicClick} variant="outlined">
              Example 1
            </Button>
          </Grid>
          <Grid item>
            <Button onClick={handleInternalClick} variant="outlined">
              Example 2
            </Button>
          </Grid>
        </Grid>
        <Typography variant="body1" >
          Now, for each code example, run the symbolic execution and check the gas cost results of
          the function <span style={{fontFamily: "DM Mono"}}>setA</span>. Can you explain why it is different?
        </Typography>
      </Box>
      <Box pt={2}>
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
              The main different between examples 1 and 2 is that altough the <span style={{fontFamily: "DM Mono"}}>setA</span>
              function is exactly the same, the other functions have different visibilities.
            </Typography>
            <Typography gutterBottom variant="body2" sx={{pt: 2}}>
              It is important to note that only public or external functions are callable from
              external accounts. Each smart contract also has a dispatcher, which is the main
              entry point of the smart contract. This decides which part of the code to jump to
              based on the value of the signature of the function being called.
            </Typography>
            <Typography gutterBottom variant="body2" sx={{pt: 2}}>
              Therefore, if there are many public functions, the dispatcher will have to check 
              through a lot more signatures before finding the correct one matching the 
              function signature sent by the user. As such, removing unnecessary public functions
              will allow for a slight but simple-to-implement gas reduction of the smart contract.
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Box>
    
    </Box>
  )
}

export default PublicVsInternal