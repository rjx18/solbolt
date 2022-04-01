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
import Pane from '../../components/Pane';
import { useMappings } from '../../contexts/Mappings';
import { useContract, useContractNames, useHash } from '../../contexts/Contracts';
import { useRemoteCompiler, useRemoteSymExec } from '../../hooks';
import { useHighlightedClass, useUpdateHiglightedClass } from '../../contexts/Decorations';
import { HighlightedSource } from '../../types';
import { DEFAULT_SOLIDITY_VALUE } from '../../constants';

const CenteredBox = styled(Box)(({ theme }) => ({
  margin: "auto",
  display: "flex",
  alignItems: "center",
}));


function CompilerPage() {

  // const [compiledEVM, setCompiledEVM] = useState('')
  // const [filteredEVM, setFilteredEVM] = useState('')
  // const [compiledJson, setCompiledJson] = useState(undefined as any)
  // const [mappings, setMappings] = useState(undefined as undefined | EVMMap)
  // const [highlightedClass, setHighlightedClass] = useState(undefined as any)

  const contractNames = useContractNames()

  const contractName = contractNames.length !== 0 ? contractNames[0] : 'UNKNOWN'

  const mappings = useMappings(contractName)

  const highlightedClass = useHighlightedClass()
  const updateHighlightedClass = useUpdateHiglightedClass()

  const remoteCompile = useRemoteCompiler()
  const remoteSymExec = useRemoteSymExec(contractName)

  // const [markers, setMarkers] = useState([] as any[])

  const [error, setError] = useState('')

  const sourceChildRef = useRef<any>();
  const compiledChildRef = useRef<any>();

  const handleClick = () => {
    if (sourceChildRef.current && remoteCompile) {
      const sourceValue = sourceChildRef.current.getValue()

      remoteCompile(sourceValue).catch((r: Error) => {
        console.log(r)
        setError(r.message)
      })
    }
  }

  const handleSymExec = () => {
    if (sourceChildRef.current && remoteSymExec) {
      const sourceValue = sourceChildRef.current.getValue()

      remoteSymExec(sourceValue).catch((r: Error) => {
        console.log(r)
        setError(r.message)
      })
    }
  }

  const handleErrorClose = () => {
    setError('')
  }

  const handleSourceMouseMove = (key: string) => {
    updateHighlightedClass(key, HighlightedSource.SOURCE)
  }

  const handleCompiledMouseMove = (key: string) => {
    updateHighlightedClass(key, HighlightedSource.COMPILE)
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
          content={DEFAULT_SOLIDITY_VALUE}
          height="80vh"
          handleMouseHover={handleSourceMouseMove}
          readOnly={false}
          source={HighlightedSource.SOURCE}
          mappings={mappings.mappings}
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
            content={mappings.filteredLines}
            height="80vh"
            handleMouseHover={handleCompiledMouseMove}
            readOnly={true}
            source={HighlightedSource.COMPILE}
            contract={contractName}
            mappings={mappings.mappings}
            highlightedClass={highlightedClass}
          />
      </Box>
    </CenteredBox>
  </>;
}

export default CompilerPage;
