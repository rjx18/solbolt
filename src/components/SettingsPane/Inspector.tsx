import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Grid from '@mui/material/Grid'
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import { grey } from '@mui/material/colors';
import zIndex from '@mui/material/styles/zIndex'
import { useHighlightedClass } from '../../contexts/Decorations'
import { useMappedContractNames, useMappings, useMappingsByIndex } from '../../contexts/Mappings'
import { prettifyGas } from '../../utils'
import { useFunctionSummary, useGasSummary } from '../../hooks'
import { BarChart, Bar, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAssemblyTabOpenManager } from '../../contexts/Application'

const GAS_MAP_LABELS = {
  ['frag-heatmap-null']: 'NO COVERAGE',
  ['frag-heatmap-0']: '0 - 10 GAS',
  ['frag-heatmap-1']: '10 - 50 GAS',
  ['frag-heatmap-2']: '50 - 100 GAS',
  ['frag-heatmap-3']: '100 - 200 GAS',
  ['frag-heatmap-4']: '200 - 500 GAS',
  ['frag-heatmap-5']: '500 - 1000 GAS',
  ['frag-heatmap-6']: '1000 - 2000 GAS',
  ['frag-heatmap-7']: '2000 - 5000 GAS',
  ['frag-heatmap-8']: '5000 - 10000 GAS',
  ['frag-heatmap-9']: '> 10000 GAS',
} as {[key: string]: string}

const GAS_HISTOGRAM_COLORS = {
  ['frag-heatmap-null']: 'rgba(100, 100, 100, 1.0)',
  ['frag-heatmap-0']: 'rgba(231, 236, 215, 0.5)',
  ['frag-heatmap-1']: 'rgba(229, 230, 188, 0.5)',
  ['frag-heatmap-2']: 'rgba(228, 216, 158, 0.5)',
  ['frag-heatmap-3']: 'rgba(230, 189, 124, 0.5)',
  ['frag-heatmap-4']: 'rgba(235, 147, 86, 0.5)',
  ['frag-heatmap-5']: 'rgba(243, 85, 45, 0.5)',
  ['frag-heatmap-6']: 'rgba(255, 0, 2, 0.5)',
  ['frag-heatmap-7']: 'rgba(231, 0, 1, 0.55)',
  ['frag-heatmap-8']: 'rgba(207, 0, 0, 0.58)',
  ['frag-heatmap-9']: 'rgba(184, 0, 0, 0.64)',
} as {[key: string]: string}

function Inspector() {
  const contractNames = useMappedContractNames()
  // const contractNames = ["ERC20", "IERC721", "EventFactory"]

  const [assemblyTab, ] = useAssemblyTabOpenManager()

  const [contractName, mappings] = useMappingsByIndex(assemblyTab)
  const highlightedClass = useHighlightedClass()
  const highlightedMappings = (mappings.mappings && highlightedClass.className) ? mappings.mappings[highlightedClass.className] : undefined

  const gasSummary = useGasSummary(contractName)
  const functionSummary = useFunctionSummary(contractName)

  console.log("FN Summary")
  console.log(functionSummary)

  console.log(highlightedClass.className)

  let parsedGasSummary = Object.keys(GAS_MAP_LABELS).slice(1).map((key) => {
    if (gasSummary == null) {
      return {
        ["name"]: GAS_MAP_LABELS[key],
        ["class"]: key,
        ["count"]: 0
      }
    }
    
    return {
      ["name"]: GAS_MAP_LABELS[key],
      ["class"]: key,
      ["count"]: gasSummary[key]
    }
  })

  let parsedFunctionSummary = functionSummary ? Object.keys(functionSummary).map((key) => {
    return {
      ["name"]: functionSummary[key].functionName,
      ["class"]: key,
      ["worst case gas"]: functionSummary[key].gas
    }
  }) : []

  // calculate highlighted gas statistics
  let meanMaxTotalGas = 0
  let meanMinTotalGas = 0
  let meanMaxOpcodeGas = 0
  let meanMinOpcodeGas = 0
  let meanMemGas = 0
  let meanMaxStorageGas = 0
  let meanMinStorageGas = 0

  let highlightedClassName = ""

  if (highlightedMappings != null) {
    if (highlightedMappings.gasMap != null) {
      meanMaxTotalGas = highlightedMappings.gasMap.meanMaxTotalGas
      meanMinTotalGas = (highlightedMappings.gasMap.minOpcodeGas + highlightedMappings.gasMap.minStorageGas + highlightedMappings.gasMap.memGas) / highlightedMappings.gasMap.numTx

      meanMaxOpcodeGas = highlightedMappings.gasMap.maxOpcodeGas / highlightedMappings.gasMap.numTx
      meanMinOpcodeGas = highlightedMappings.gasMap.minOpcodeGas / highlightedMappings.gasMap.numTx

      meanMaxStorageGas = highlightedMappings.gasMap.maxStorageGas / highlightedMappings.gasMap.numTx
      meanMinStorageGas = highlightedMappings.gasMap.minStorageGas / highlightedMappings.gasMap.numTx

      meanMemGas = highlightedMappings.gasMap.memGas / highlightedMappings.gasMap.numTx

      highlightedClassName = highlightedMappings.gasMap.class
    } else {
      highlightedClassName = "frag-heatmap-null"
    }
  }

  const generateGasSummary = () => {
    return <Box p={2}>
      <Box>
        <Typography variant="button" component="h6" sx={{fontSize: "10.5pt", color: grey[600]}}>TOTAL GAS USED</Typography>
        <Typography variant="h5" component="h5">{prettifyGas(meanMinTotalGas)} {meanMinTotalGas !== meanMaxTotalGas && ` - ${prettifyGas(meanMaxTotalGas)}`}</Typography>
      </Box>

      <Box pt={2}>
        <Grid container spacing={2}>
          <Grid item>
            <Box>
              <Typography variant="button" component="h6" sx={{fontSize: "9pt", color: grey[600]}}>OPCODE GAS</Typography>
              <Typography variant="h5" component="h5" sx={{fontSize: "12pt"}}>{prettifyGas(meanMinOpcodeGas)} {meanMinOpcodeGas !== meanMaxOpcodeGas && ` - ${prettifyGas(meanMaxOpcodeGas)}`}</Typography>
            </Box>
          </Grid>
          <Grid item>
            <Box>
              <Typography variant="button" component="h6" sx={{fontSize: "9pt", color: grey[600]}}>MEMORY GAS</Typography>
              <Typography variant="h5" component="h5" sx={{fontSize: "12pt"}}>{prettifyGas(meanMemGas)}</Typography>
            </Box>
          </Grid>
          <Grid item>
            <Box>
              <Typography variant="button" component="h6" sx={{fontSize: "9pt", color: grey[600]}}>STORAGE GAS</Typography>
              <Typography variant="h5" component="h5" sx={{fontSize: "12pt"}}>{prettifyGas(meanMinStorageGas)} {meanMinStorageGas !== meanMaxStorageGas && ` - ${prettifyGas(meanMaxStorageGas)}`}</Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>


    </Box>
  }

  const generateHeatMap = () => {
    return <Grid container>{Object.keys(GAS_MAP_LABELS).map((e) => {
      const isCurrentGasClass = e === highlightedClassName
      const isNoCoverageClass = highlightedClassName === 'frag-heatmap-null'

      return <Grid item xs={isCurrentGasClass ? 12 : 10} sx={{zIndex: isCurrentGasClass ? 1 : 0}}>
        <Paper elevation={isCurrentGasClass ? 4 : 0} >
          <Box p={1} className={e} >
            <Typography variant="button" sx={{fontSize: "10.5pt"}}>{GAS_MAP_LABELS[e]}</Typography>
          </Box>
          {
            isCurrentGasClass && (isNoCoverageClass ? <Box p={2}>
              <Typography variant="button" component="h6" sx={{fontSize: "10.5pt", color: grey[600]}}>This code path was not reached by the symbolic execution engine.</Typography>
            </Box> : generateGasSummary())
          }
        </Paper>
      </Grid>
    })}
    </Grid>
  }

  return (
    <Box>
      <Typography variant="button" sx={{fontSize: "12pt"}}>Inspector</Typography>
      <Box py={3}>
        <Typography variant="button" sx={{fontSize: "10.5pt", color: grey[600]}}>Gas Heatmap</Typography>
        <Box pt={1}>
          {(mappings.hasSymExec) && generateHeatMap()}
        </Box>

        <Box pt={5}>
          <Typography variant="button" sx={{fontSize: "10.5pt", color: grey[600]}}>Gas Histogram</Typography>
          <ResponsiveContainer width="95%" height={250}>
            <BarChart data={parsedGasSummary}>
              <XAxis dataKey="name" angle={75} height={120} textAnchor="start" interval={0} style={{fontSize: '9pt'}}/>
              <RechartsTooltip />
              <Bar dataKey="count" radius={[7, 7, 0, 0]}>
                {
                  parsedGasSummary.map((entry, index) => (
                    <Cell key={`gas-cell-${index}`} fill={entry.class === highlightedClassName ? GAS_HISTOGRAM_COLORS[highlightedClassName] : '#e6e6e6'} stroke={'#707070'}  strokeWidth={1}/>
                  ))
                }
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>

        <Box pt={5}>
          <Typography variant="button" sx={{fontSize: "10.5pt", color: grey[600]}}>Function Analysis</Typography>
          <ResponsiveContainer width="95%" height={250}>
            <BarChart data={parsedFunctionSummary}>
              <XAxis dataKey="name" angle={75} height={120} textAnchor="start" interval={0} style={{fontSize: '9pt'}}/>
              <RechartsTooltip />
              <Bar dataKey="worst case gas" radius={[7, 7, 0, 0]}>
                {
                  parsedFunctionSummary.map((entry, index) => (
                    <Cell key={`function-cell-${index}`} fill={entry.class === highlightedClass.className ? '#d44c4c' : '#e6e6e6'} stroke={'#707070'}  strokeWidth={1}/>
                  ))
                }
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </Box>
  )
}

export default Inspector