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
import { EVMMap, getRandomInt, parseEVMMappings } from '../../utils';
import './Compiler.css';

import Editor from "@monaco-editor/react";

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

const COLOR_CLASSES = [
    "background-color:hsla(300, 70%, 90%, 1);",
    "background-color:hsla(0, 70%, 90%, 1);",
    "background-color:hsla(80, 70%, 90%, 1);",
    "background-color:hsla(160, 70%, 90%, 1);",
    "background-color:hsla(240, 70%, 90%, 1);",
    "background-color:hsla(320, 70%, 90%, 1);",
    "background-color:hsla(40, 70%, 90%, 1);",
    "background-color:hsla(120, 70%, 90%, 1);",
    "background-color:hsla(200, 70%, 90%, 1);",
    "background-color:hsla(280, 70%, 90%, 1);",
    "background-color:hsla(20, 70%, 90%, 1);",
    "background-color:hsla(100, 70%, 90%, 1);",
    "background-color:hsla(180, 70%, 90%, 1);",
    "background-color:hsla(260, 70%, 90%, 1);",
    "background-color:hsla(340, 70%, 90%, 1);",
    "background-color:hsla(60, 70%, 90%, 1);",
    "background-color:hsla(140, 70%, 90%, 1);",
    "background-color:hsla(220, 70%, 90%, 1);"
]

function CompilerPage() {

  // const [compiledEVM, setCompiledEVM] = useState('')
  const [filteredEVM, setFilteredEVM] = useState('')
  const [mappings, setMappings] = useState(undefined as undefined | EVMMap)

  // const [markers, setMarkers] = useState([] as any[])

  const [error, setError] = useState('')

  const cmSourceRef = useRef<any>();
  const cmCompiledRef = useRef<any>();

  const handleClick = () => {
    if (cmSourceRef.current && cmSourceRef.current.editor) {
      axios.post('http://127.0.0.1:5000/compile/', {
        content: cmSourceRef.current.editor.getValue(),
      }).then((r) => {
        if (r.status === 200) {
          const contractFile = Object.keys(r.data.result.contracts)[0]
          const contractSol = Object.keys(r.data.result.contracts[contractFile])[0]
          const compiledEVM = r.data.result.contracts[contractFile][contractSol].evm.assembly

          const {mappings, filteredLines} = parseEVMMappings(cmSourceRef.current.editor.getValue(), compiledEVM)
          
          setFilteredEVM(filteredLines)
          setMappings(mappings)
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

  function handleSourceEditorDidMount(editor: any, monaco: any) {
    cmSourceRef.current = editor; 
  }

  useEffect(() => {
    if (cmSourceRef.current && cmSourceRef.current.editor && cmCompiledRef.current && cmCompiledRef.current.editor && mappings) {

      cmSourceRef.current.editor.doc.getAllMarks().forEach((marker: any) => marker.clear());
      var sourceLines = cmSourceRef.current.editor.lineCount();
      for (let i = 0; i < sourceLines; i++) {
        cmSourceRef.current.editor.removeLineClass(i, "wrap");
      }
      cmCompiledRef.current.editor.doc.getAllMarks().forEach((marker: any) => marker.clear());
      var compiledLines = cmSourceRef.current.editor.lineCount();
      for (let i = 0; i < compiledLines; i++) {
        cmCompiledRef.current.editor.removeLineClass(i, "wrap");
      }

      const mappingKeysSorted = Object.keys(mappings).map((k) => {return {key: k, length: mappings[k].length}})

      mappingKeysSorted.sort((firstEl, secondEl) => { return secondEl.length - firstEl.length }) // sort by length descending, so we can mark the largest regions first

      let currClassCount = 0

      for (const mappingKey of mappingKeysSorted) {
        const mappingItem = mappings[mappingKey.key]

        if (mappingItem.isLine) {
          for (let i = mappingItem.startLine; i <= mappingItem.endLine; i++) {
            cmSourceRef.current.editor.addLineClass(i, "wrap", `frag-color-${currClassCount % NUM_LINE_CLASSES}`);
          }
          
        } else {
          // console.log(mappingItem.startLine)
          // console.log(mappingItem.startChar!)
          cmSourceRef.current.editor.markText(
            { line: mappingItem.startLine, ch: mappingItem.startChar! },
            { line: mappingItem.endLine, ch: mappingItem.endChar! },
            {
              css: COLOR_CLASSES[currClassCount % NUM_LINE_CLASSES],
            }
          );
        }
        for (const compiledLine of mappingItem.sourceLines) {
          cmCompiledRef.current.editor.addLineClass(compiledLine, "wrap", `frag-color-${currClassCount % NUM_LINE_CLASSES}`);
        }          

        currClassCount++;
      }
    }
  }, [cmSourceRef.current, cmCompiledRef.current, mappings]);

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
        <Editor
          defaultLanguage="sol"
          defaultValue={defaultValue}
          height="80vh"
          onMount={handleSourceEditorDidMount}
          // options={{
          //   theme: "neo",
          //   matchBrackets: true,
          //   indentUnit: 2,
          //   lineNumbers: true,
          //   tabSize: 4,
          //   indentWithTabs: false,
          //   mode: "cpp"
          // }}
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
          ref={cmCompiledRef}
          value={filteredEVM}
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
