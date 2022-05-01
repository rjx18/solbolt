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
import './Compiler.css';

import Editor from "@monaco-editor/react";
import CodePane from '../../components/CodePane';
import { useMappings } from '../../contexts/Mappings';
import { useRemoteCompiler, useRemoteSymExec } from '../../hooks';
import { useHighlightedClass, useUpdateHiglightedClass } from '../../contexts/Decorations';
import { HighlightedSource } from '../../types';
import { DEFAULT_SOLIDITY_VALUE } from '../../constants';
import SolidityPane from '../../components/SolidityPane';
import AssemblyPane from '../../components/AssemblyPane';
import { isNullOrUndefined } from 'util';
import SettingsPane from '../../components/SettingsPane';
import { useCompilerErrorManager, useSymexecErrorManager, useToggleFreezeHoverManager } from '../../contexts/Application';

const CenteredBox = styled(Box)(({ theme }) => ({
  margin: "auto",
  display: "flex",
  alignItems: "center",
}));

function CompilerPage() {

  const [error, setError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const [compilerError, ] = useCompilerErrorManager()
  const [symexecError, ] = useSymexecErrorManager()

  const sourceChildRef = useRef<any>();

  const handleErrorClose = () => {
    setError(false)
  }

  const handleError = (_error: string) => {
    setErrorMessage(_error)
    setError(true)
  }

  const [, toggleFreezeHover] = useToggleFreezeHoverManager()

  useEffect(() => {
    const handleFreeze = (e: any) => {
      if ((e.metaKey || e.ctrlKey) && e.code === 'KeyQ') {
        toggleFreezeHover()
      }
    };
    window.addEventListener('keydown', handleFreeze);

    return () => {
      window.removeEventListener('keydown', handleFreeze);
    };
  }, []);

  useEffect(() => {
    if (compilerError != null) {
      setErrorMessage(compilerError)
      setError(true)
    } else if (symexecError != null) {
      setErrorMessage(symexecError)
      setError(true)
    }
  }, [compilerError, symexecError])
  


  return <>
    <Snackbar open={error} autoHideDuration={10000} onClose={handleErrorClose}>
      <Alert onClose={handleErrorClose} severity={"error"}>
        {
          errorMessage
        }
      </Alert>
    </Snackbar>
    <Box display="flex" height="100%" width="100%">
      <SolidityPane ref={sourceChildRef} setError={handleError} />
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
      <AssemblyPane setError={handleError} sourceRef={sourceChildRef}/>
      <SettingsPane />
    </Box>
  </>;
}

export default CompilerPage;
