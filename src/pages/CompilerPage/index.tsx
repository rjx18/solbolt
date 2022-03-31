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
import { addGasMetrics, EVMMap, getRandomInt, parseEVMMappings, parseLegacyEVMMappings } from '../../utils';
import './Compiler.css';

import Editor from "@monaco-editor/react";
import Pane from '../../components/Pane';

const CenteredBox = styled(Box)(({ theme }) => ({
  margin: "auto",
  display: "flex",
  alignItems: "center",
}));

const NUM_LINE_CLASSES = 18

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

  // const [compiledEVM, setCompiledEVM] = useState('')
  const [filteredEVM, setFilteredEVM] = useState('')
  const [compiledJson, setCompiledJson] = useState(undefined as any)
  const [mappings, setMappings] = useState(undefined as undefined | EVMMap)
  const [highlightedClass, setHighlightedClass] = useState(undefined as any)

  const [isCompiled, setIsCompiled] = useState(true)

  // const [markers, setMarkers] = useState([] as any[])

  const [error, setError] = useState('')

  const sourceChildRef = useRef<any>();
  const compiledChildRef = useRef<any>();

  const handleClick = () => {
    if (sourceChildRef.current && compiledChildRef.current) {
      const sourceValue = sourceChildRef.current.getValue()

      axios.post('http://127.0.0.1:5000/compile/', {
        content: sourceValue,
      }).then((r) => {
        if (r.status === 200) {
          setCompiledJson(r.data.result)
          const {mappings, filteredLines} = parseLegacyEVMMappings(sourceValue, r.data.result)
          
          setHighlightedClass(undefined)
          setFilteredEVM(filteredLines)
          setMappings(mappings)
        }
      }).catch((r) => {
        console.log(r)
        const errorMessage = r.response.data.status.split("\n")[0]
        setError(errorMessage)
      })
    }
  }

  const handleSymExec = () => {
    if (isCompiled && sourceChildRef.current && compiledChildRef.current) {
      const sourceValue = sourceChildRef.current.getValue()

      axios.post('http://127.0.0.1:5000/sym/', {
        content: sourceValue,
        json: JSON.stringify(compiledJson)
      }).then((r) => {
        if (r.status === 200) {
          console.log(r.data)

          if (mappings) {
            const newMappings = {...mappings}

            addGasMetrics(newMappings, r.data)

            console.log('new mappings')

            console.log(newMappings)

            setMappings(newMappings)
          }
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

  const handleSourceMouseMove = (key: string) => {
    setHighlightedClass({
      class: key,
      triggeredFrom: "source"
    })
  }

  const handleCompiledMouseMove = (key: string) => {
    setHighlightedClass({
      class: key,
      triggeredFrom: "compile"
    })
  }

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
        <Pane
          ref={sourceChildRef}
          language="sol"
          content={defaultValue}
          height="80vh"
          handleMouseHover={handleSourceMouseMove}
          readOnly={false}
          isCompiled={false}
          mappings={mappings}
          highlightedClass={highlightedClass}
        />
      </Box>
      <Box p={3}>
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
      </Box>
      <Box width="700px">
      <Pane
          ref={compiledChildRef}
          language="plaintext"
          content={filteredEVM}
          height="80vh"
          handleMouseHover={handleCompiledMouseMove}
          readOnly={true}
          isCompiled={true}
          mappings={mappings}
          highlightedClass={highlightedClass}
        />
      </Box>
    </CenteredBox>
  </>;
}

export default CompilerPage;
