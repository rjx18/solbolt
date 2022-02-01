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

const CenteredBox = styled(Box)(({ theme }) => ({
  margin: "auto",
  display: "flex",
  alignItems: "center",
}));

const defaultValue = `// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;
contract TestLoop {
    // mapping(uint256 => uint256) public mappingArray;
    string private storedString;

    constructor() {
        
    }

    function hiddenLoop(string calldata newString) external {
        storedString = newString;
    }
}
  `

function CompilerPage() {

  const [compiledEVM, setCompiledEVM] = useState('')
  const [error, setError] = useState('')

  const cmRef = useRef<any>();

  const handleClick = () => {
    if (cmRef.current && cmRef.current.editor) {
      axios.post('http://127.0.0.1:5000/compile/', {
        content: cmRef.current.editor.getValue(),
      }).then((r) => {
        if (r.status === 200) {
          const contractFile = Object.keys(r.data.result.contracts)[0]
          const contractSol = Object.keys(r.data.result.contracts[contractFile])[0]
          setCompiledEVM(r.data.result.contracts[contractFile][contractSol].evm.assembly)
        }
      }).catch((r) => {
        const errorMessage = r.response.data.status.split("\n")[0]
        setError(errorMessage)
      })
    }
  }

  const handleErrorClose = () => {
    setError('')
  }

  useEffect(() => {
    console.log('useRef changed')
    console.log(cmRef.current)
    if (cmRef.current && cmRef.current.editor) {
      cmRef.current.editor.markText(
        { line: 0, ch: 0 },
        { line: 2, ch: 5 },
        {
          css: "background-color:lightgrey",
          className: "styled-background"
        }
      );
    }
  }, [cmRef.current]);

  return <>
    <Snackbar open={error != undefined && error !== ''} autoHideDuration={10000} onClose={handleErrorClose}>
      <Alert onClose={handleErrorClose} severity={"error"}>
        {
          error
        }
      </Alert>
    </Snackbar>
    <CenteredBox>
      <Box width="700px">
        <CodeMirror
          ref={cmRef}
          value={defaultValue}
          height="80vh"
          placeholder='Please enter your Solidity code here'
          options={{
            theme: "neo",
            matchBrackets: true,
            indentUnit: 2,
            lineNumbers: true,
            tabSize: 4,
            indentWithTabs: false,
            mode: "cpp"
          }}
          // onChange={(instance) => {
          //   setSolidityText(instance.getValue())
          // }}
          
        />
      </Box>
      <Box p={3}>
        <Button variant="outlined" onClick={handleClick}>
          Compile
        </Button>
      </Box>
      <Box width="700px">
        <CodeMirror
          value={compiledEVM}
          height="80vh"
          placeholder='Compiled EVM will be shown here.'
          options={{
            theme: "neo",
            matchBrackets: true,
            indentUnit: 2,
            lineNumbers: true,
            tabSize: 4,
            indentWithTabs: true,
            mode: "text/x-solidity",
            readOnly: true
          }}
        />
      </Box>
    </CenteredBox>
  </>;
}

export default CompilerPage;
