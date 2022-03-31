export interface FragmentMap {
  startLine: number;
  startChar: number;
  endLine: number;
  endChar: number;
  length: number;
}

export interface GasMapItem {
  numTx: number;
  totalMaxOpcodeGas: number;
  meanMaxOpcodeGas: number;
  totalMinOpcodeGas: number;
  meanMinOpcodeGas: number;
  totalMemGas: number;
  meanGemGas: number;
  meanWcGas: number;
}

export interface EVMMap {
  [key: string]: {
    sourceMap: FragmentMap,
    compiledMaps: FragmentMap[],
    gasMap?: GasMapItem
  }
}

export function safeAccess(object: any, path: any[]) {
  return object
    ? path.reduce(
        (accumulator, currentValue) => (accumulator && accumulator[currentValue] ? accumulator[currentValue] : null),
        object
      )
    : null
}


const EVM_REGEX = /\s+\/\*\s+\"(?<Filename>[\w|\#|\.]+)\":(?<StartOffset>\d+):(?<EndOffset>\d+)\s+(?<Identifier>[\w|{]+)?./

export const parseEVMMappings = (sourceText: string, compiledEVM: string) => {
  // outputs a mapping of classes to lines
  
  const splitEVM = compiledEVM.split('\n')

  // let unknownFunctionJumpType = false

  const filteredLinesArray = []

  let currLineNumber = 1

  let currMap = undefined as undefined | {
    sourceMap: FragmentMap,
    compiledMaps: FragmentMap[]
  }

  const mappings = {} as EVMMap

  for (const ins of splitEVM) {
    if (EVM_REGEX.test(ins)) {
      const match = EVM_REGEX.exec(ins)
      if (match && match.groups) {
        console.log(match.groups.Filename)
        if (match.groups.Filename.indexOf('#utility.yul') !== -1) {
          currMap = undefined
          continue
        }

        if (match.groups.Identifier && match.groups.Identifier === "contract") {
          currMap = undefined
          continue
        }

        const currKey = `${match.groups.StartOffset}:${match.groups.EndOffset}`
        const [startLine, startChar] = getLineCharFromOffset(sourceText, parseInt(match.groups.StartOffset))
        const [endLine, endChar] = getLineCharFromOffset(sourceText, parseInt(match.groups.EndOffset))
        
        if (!(currKey in mappings)) {
          const sourceMap = {
            startLine: startLine,
            startChar: startChar,
            endLine: endLine,
            endChar: endChar,
            length: parseInt(match.groups.EndOffset) - parseInt(match.groups.StartOffset), // when marking, start with greatest lengths first
          }

          mappings[currKey] = {
            sourceMap: sourceMap,
            compiledMaps: []
          }
        }

        const compiledMap = {
          startLine: currLineNumber,
          startChar: 1,
          endLine: currLineNumber,
          endChar: 1,
          length: parseInt(match.groups.EndOffset) - parseInt(match.groups.StartOffset), // when marking, start with greatest lengths first
        }
        
        mappings[currKey].compiledMaps.push(compiledMap)
        
        currMap = mappings[currKey]
      }
    } else {
      filteredLinesArray.push(ins)
      
      if (currMap != undefined) {
        currMap.compiledMaps[currMap.compiledMaps.length - 1].endLine = currLineNumber
      }

      currLineNumber++
    }
  }

  const filteredLines = filteredLinesArray.join('\n')

  return {
    mappings,
    filteredLines
  }
  
}

const BEGIN = "begin"
const END = "end"
const NAME = "name"
const SOURCE = "source"
const VALUE = "value"

const CODE = ".code"
const DATA = ".data"
const AUXDATA = ".auxdata"

interface LegacyEVMNode {
  [BEGIN]: number,
  [END]: number,
  [NAME]: string,
  [SOURCE]: number,
  [VALUE]: string
}

interface LegacyEVM {
  [CODE]: LegacyEVMNode[],
  [DATA]: {
    [key: string]: {
      [AUXDATA]: string,
      [CODE]: LegacyEVMNode[]
    }
  }
}

export const parseLegacyEVMMappings = (sourceText: string, compiledJson: any) => {
  // outputs a mapping of classes to lines
  
  const contractFile = Object.keys(compiledJson.contracts)[0]
  const contractSol = Object.keys(compiledJson.contracts[contractFile])[0]
  const compiledEVM = compiledJson.contracts[contractFile][contractSol].evm.legacyAssembly

  const compiledAST = compiledJson.sources[contractFile].ast

  const contractDefinitionSrc = findContractDefinition(compiledAST)

  const filteredLinesArray = []

  // let currMap = undefined as undefined | {
  //   sourceMap: FragmentMap,
  //   compiledMaps: FragmentMap[]
  // }

  const mappings = {} as EVMMap

  filteredLinesArray.push("CONSTRUCTOR:")

  parseLegacyEVMSection(sourceText, compiledEVM[CODE], filteredLinesArray, mappings, contractDefinitionSrc)

  console.log(`Num instructions in constructor: ${compiledEVM[CODE].length}`)

  filteredLinesArray.push("SUBROUTINES:")

  parseLegacyEVMSection(sourceText, compiledEVM[DATA]["0"][CODE], filteredLinesArray, mappings, contractDefinitionSrc)

  console.log(`Num instructions in sub: ${compiledEVM[DATA]["0"][CODE].length}`)

  const filteredLines = filteredLinesArray.join('\n')

  return {
    mappings,
    filteredLines
  }
}

const parseLegacyEVMSection = (sourceText: string, code: LegacyEVMNode[], filteredLinesArray: string[], codeMappings: EVMMap, contractDefinitionSrc: string) => {
  let num_tags = 0
  
  for (let i = 0; i < code.length; i++) {

    const node = code[i]

    if (node[NAME] === TAG) {
      num_tags++
    }

    if (node[SOURCE] === 0) {
      const currKey = `${node[BEGIN]}:${node[END]}`

      // dont include generated stuff for the contract
      if (currKey === contractDefinitionSrc) {
        continue
      }

      const [startLine, startChar] = getLineCharFromOffset(sourceText, node[BEGIN])
      const [endLine, endChar] = getLineCharFromOffset(sourceText, node[END])

      // function for pushing a new compile map
      const pushNewCompiledMap = () => {
        const compiledMap = {
          startLine: filteredLinesArray.length,
          startChar: 1,
          endLine: filteredLinesArray.length,
          endChar: 1,
          length: node[END] - node[BEGIN], // when marking, start with greatest lengths first
        }

        codeMappings[currKey].compiledMaps.push(compiledMap)
      }

      // if there was no such key before, push a new one including the source map
      if (!(currKey in codeMappings)) {
        const sourceMap = {
          startLine: startLine,
          startChar: startChar,
          endLine: endLine,
          endChar: endChar,
          length: node[END] - node[BEGIN], // when marking, start with greatest lengths first
        }

        codeMappings[currKey] = {
          sourceMap: sourceMap,
          compiledMaps: []
        }
      }

      // add line to filteredLinesArray
      const parsedLine = prettifyLine(node)
      filteredLinesArray.push(parsedLine)

      if (codeMappings[currKey].compiledMaps.length === 0) {
        // first compiledMap, just add a new map sequence
        pushNewCompiledMap()
      } else {
        const compiledMapLen = codeMappings[currKey].compiledMaps.length - 1
        const lastCompileMapEndIndex = codeMappings[currKey].compiledMaps[compiledMapLen].startLine

        if (i == lastCompileMapEndIndex) {
          // the last added line was the one before this, so we can just extend the previous map by one
          codeMappings[currKey].compiledMaps[compiledMapLen].endLine = filteredLinesArray.length
        } else {
          // the last added line was not consecutive anymore, so we need to add a new map
          pushNewCompiledMap()
        }
      }
    }
  }

  console.log(`Num tags: ${num_tags}`)
}

export const addGasMetrics = (mappings: EVMMap, gasMap: any) => {
  _addGasMetrics(mappings, gasMap.creation)
  _addGasMetrics(mappings, gasMap.runtime)
}

const _addGasMetrics = (mappings: EVMMap, gasMapSection: any) => {
  for (const key of Object.keys(gasMapSection)) {
    if (key in mappings) {
      mappings[key].gasMap = gasMapSection[key]
    }
  }
}

export const getGasClass = (gasAmount: number) => {
  if (gasAmount <= 10) {
    return 'frag-heatmap-0'
  } else if (gasAmount <= 50) {
    return 'frag-heatmap-1'
  } else if (gasAmount <= 100) {
    return 'frag-heatmap-2'
  } else if (gasAmount <= 200) {
    return 'frag-heatmap-3'
  } else if (gasAmount <= 500) {
    return 'frag-heatmap-4'
  } else if (gasAmount <= 1000) {
    return 'frag-heatmap-5'
  } else if (gasAmount <= 2000) {
    return 'frag-heatmap-6'
  } else if (gasAmount <= 5000) {
    return 'frag-heatmap-7'
  } else if (gasAmount <= 10000) {
    return 'frag-heatmap-8'
  } else {
    return 'frag-heatmap-9'
  }
}

const findContractDefinition = (ast: any) => {
  const visited = [ast] as any[]
  const queue = [ast] as any[]

  while (queue) {
    const node = queue.splice(0, 1)[0]

    if (node.nodeType === "ContractDefinition") {
      const src_items = (node.src as string).split(':')
      const src_start = parseInt(src_items[0])
      const src_end = src_start + parseInt(src_items[1])
      return `${src_start}:${src_end}`
    }

    if (node.nodes) {
      for (const neighbour of node.nodes) {
        if (!visited.includes(neighbour)) {
          visited.push(neighbour)
          queue.push(neighbour)
        }
      }
    }
    
  }

  return ""
}

const TAG = "tag"

const prettifyLine = (node: LegacyEVMNode) => {
  if (node[NAME] === TAG) {
    return `\t\tTAG ${node[VALUE]}:`
  }
  return `\t\t\t\t${node[NAME]} ${node[VALUE] ? node[VALUE] : ""}`
}

export const getLineCharFromOffset = (sourceText: string, offset: number) => {
  const newlineRegex = RegExp('\n', 'g');

  let numLines = 0;

  const sourceTextSliced = sourceText.slice(0, offset)

  let finalLineOffset = 0;

  while ((newlineRegex.exec(sourceTextSliced)) !== null) {
    numLines++
    finalLineOffset = newlineRegex.lastIndex
  }
  
  const numChars = offset - finalLineOffset
  return [numLines + 1, numChars + 1]
}

export function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

