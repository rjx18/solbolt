import { ContractJSON, ContractMappings, EVMMap } from "../types"
import axios from 'axios'
import { OUTPUT_FILE_NAME } from "../constants"


export function safeAccess(object: any, path: any[]) {
  return object
    ? path.reduce(
        (accumulator, currentValue) => (accumulator && accumulator[currentValue] ? accumulator[currentValue] : {}),
        object
      )
    : {}
}

export const hashString = function(str: string, seed = 0) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909);
  h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1>>>0);
};


// const EVM_REGEX = /\s+\/\*\s+\"(?<Filename>[\w|\#|\.]+)\":(?<StartOffset>\d+):(?<EndOffset>\d+)\s+(?<Identifier>[\w|{]+)?./

const BEGIN = "begin"
const END = "end"
const NAME = "name"
const SOURCE = "source"
const VALUE = "value"

const CODE = ".code"
const DATA = ".data"
const AUXDATA = ".auxdata"

const JSON_CONTRACTS = "contracts"
const JSON_SOURCES = "sources"
const JSON_AST = "ast"
const JSON_EVM = "evm"
const JSON_LEGACY = "legacyAssembly"

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

export const parseLegacyEVMMappings = (sourceText: string, compiledJSON: any) => {
  // outputs a mapping of classes to lines
  
  const contractNames = Object.keys(safeAccess(compiledJSON, [JSON_CONTRACTS, OUTPUT_FILE_NAME]))

  let parsedMappings = {} as {
    [contract: string]: ContractMappings;
  }

  for (const contractName of contractNames) {
    const compiledEVM = safeAccess(compiledJSON, [JSON_CONTRACTS, OUTPUT_FILE_NAME, contractName, JSON_EVM, JSON_LEGACY])

    const compiledAST = safeAccess(compiledJSON, [JSON_SOURCES, OUTPUT_FILE_NAME, JSON_AST])

    if (compiledEVM !== {} && compiledAST !== {}) {
      const contractDefinitionSrc = findContractDefinition(compiledAST)

      const filteredLinesArray = []

      // let currMap = undefined as undefined | {
      //   sourceMap: FragmentMap,
      //   compiledMaps: FragmentMap[]
      // }

      const mappings = {} as {[key: string]: EVMMap}

      filteredLinesArray.push("CONSTRUCTOR:")

      parseLegacyEVMSection(sourceText, compiledEVM[CODE], filteredLinesArray, mappings, contractDefinitionSrc)

      console.log(`Num instructions in constructor: ${compiledEVM[CODE].length}`)

      filteredLinesArray.push("SUBROUTINES:")

      parseLegacyEVMSection(sourceText, compiledEVM[DATA]["0"][CODE], filteredLinesArray, mappings, contractDefinitionSrc)

      console.log(`Num instructions in sub: ${compiledEVM[DATA]["0"][CODE].length}`)

      const filteredLines = filteredLinesArray.join('\n')

      parsedMappings[contractName] = {
        mappings,
        filteredLines
      }
    }
  }

  return parsedMappings
}

const parseLegacyEVMSection = (sourceText: string, code: LegacyEVMNode[], filteredLinesArray: string[], codeMappings: {[key: string]: EVMMap}, contractDefinitionSrc: string) => {
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

export const parseCompiledJSON = (compiledJSON: any) => {
  const contractNames = Object.keys(safeAccess(compiledJSON, [JSON_CONTRACTS, OUTPUT_FILE_NAME]))

  let contractJSON = {} as {
    [contract: string]: ContractJSON
  }

  for (const contractName of contractNames) {
    contractJSON[contractName] = safeAccess(compiledJSON, [JSON_CONTRACTS, OUTPUT_FILE_NAME, contractName]) as ContractJSON
  }

  let contractAST = safeAccess(compiledJSON, [JSON_SOURCES, OUTPUT_FILE_NAME, JSON_AST]) as any

  return {
    contracts: contractJSON,
    ast: contractAST
  }
}

export const addGasMetrics = (mappings: {[key: string]: EVMMap}, gasMap: any) => {
  _addGasMetrics(mappings, gasMap.creation)
  _addGasMetrics(mappings, gasMap.runtime)
}

const _addGasMetrics = (mappings: {[key: string]: EVMMap}, gasMapSection: any) => {
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


// REMOTE NETWORK REQUESTS

export const compileSourceRemote = (sourceValue: any) => {
  return axios.post('http://127.0.0.1:5000/compile/', {
    content: sourceValue,
  })
}

export const symExecSourceRemote = (sourceValue: any, compiledJSON: any) => {
  return axios.post('http://127.0.0.1:5000/sym/', {
    content: sourceValue,
    json: JSON.stringify(compiledJSON)
  })
}