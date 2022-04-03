import React, { useState, useRef, useEffect } from 'react';
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import CodeMirror from '@uiw/react-codemirror';
import 'codemirror/keymap/sublime';
import { styled, createTheme, ThemeProvider } from '@mui/system';
import 'codemirror/theme/neo.css';
import axios from 'axios';
import { addGasMetrics, compileSourceRemote, getRandomInt, hashString, parseLegacyEVMMappings } from '../../utils';
import './Compiler.css';

import Editor from "@monaco-editor/react";
import CodePane from '../../components/CodePane';
import { useMappings } from '../../contexts/Mappings';
import { useContract, useContractNames, useHash } from '../../contexts/Contracts';
import { useRemoteCompiler, useRemoteSymExec } from '../../hooks';
import { useHighlightedClass, useUpdateHiglightedClass } from '../../contexts/Decorations';
import { HighlightedSource } from '../../types';
import { DEFAULT_SOLIDITY_VALUE } from '../../constants';
import SolidityPane from '../../components/SolidityPane';
import AssemblyPane from '../../components/AssemblyPane';
import { isNullOrUndefined } from 'util';

const CenteredBox = styled(Box)(({ theme }) => ({
  margin: "auto",
  display: "flex",
  alignItems: "center",
}));

function CompilerPage() {

  const [error, setError] = useState('')

  const sourceChildRef = useRef<any>();

  const handleErrorClose = () => {
    setError('')
  }


  return <>
    <Snackbar open={error != null && error !== ''} autoHideDuration={10000} onClose={handleErrorClose}>
      <Alert onClose={handleErrorClose} severity={"error"}>
        {
          error
        }
      </Alert>
    </Snackbar>
    <Box display="flex" height="100%" width="100%">
      <SolidityPane ref={sourceChildRef} setError={setError} />
      {/* <Box p={3}>
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center">
          <Box>
            <Button variant="outlined" onClick={handleClick}>
              Compile
            </Button>
          </Box>
          <Box pt={2}>
            <Button variant="outlined" onClick={handleSymExec}>
              Symexec
            </Button>
          </Box>
        </Box>
      </Box> */}
      <AssemblyPane setError={setError} sourceRef={sourceChildRef}/>
      
    </Box>
  </>;
}

export default CompilerPage;
