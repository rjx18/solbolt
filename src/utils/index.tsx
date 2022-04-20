import { CompilerSettings, ContractJSON, ContractMappings, EVMMap, EVMSource, SymexecSettings, SYMEXEC_ENABLE_ONCHAIN, SYMEXEC_ONCHAIN_ADDRESS } from "../types"
import axios from 'axios'
import { ETHERSCAN_API_ENDPOINT, ETHERSCAN_API_KEY, OUTPUT_FILE_NAME } from "../constants"
import { keccak256 } from 'js-sha3'

export function safeAccess(object: any, path: any[]) {
  return object
    ? path.reduce(
        (accumulator, currentValue) => (accumulator != null && accumulator[currentValue] != null ? accumulator[currentValue] : {}),
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


export const isEmpty = (object: any) => {
  return object == null || (Object.keys(object).length === 0 && Object.getPrototypeOf(object) === Object.prototype)
}

export const prettifyGas = (gas: number) => {
  if (gas <= 1000) {
    return gas.toFixed(1)
  } else if (gas <= 1000000) {
    return `${(gas / 1000).toFixed(1)}k`
  } else {
    return `${(gas / 1000000).toFixed(1)}M`
  }
}

export const isAddress = (address: string | undefined) => {
  if (address === "" || address == null) {
    return false
  }

  if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
      // check if it has the basic requirements of an address
      return false;
  } else if (/^(0x)?[0-9a-f]{40}$/.test(address) || /^(0x)?[0-9A-F]{40}$/.test(address)) {
      // If it's all small caps or all all caps, return true
      return true;
  } else {
      // Otherwise check each case
      return isChecksumAddress(address);
  }
};

export const isChecksumAddress = (address: string) => {
  // Check each case
  address = address.replace('0x','');
  var addressHash = keccak256(address.toLowerCase());
  for (var i = 0; i < 40; i++ ) {
      // the nth letter should be uppercase if the nth digit of casemap is 1
      if ((parseInt(addressHash[i], 16) > 7 && address[i].toUpperCase() !== address[i]) || (parseInt(addressHash[i], 16) <= 7 && address[i].toLowerCase() !== address[i])) {
          return false;
      }
  }
  return true;
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

export const parseLegacyEVMMappings = (sources: {[index: number]: EVMSource}, compiledJSON: any) => {
  // outputs a mapping of classes to lines
  
  let parsedMappings = {} as {
    [contract: string]: ContractMappings;
  }

  let sourceNameToIndex = {} as {[name: string]: number}

  for (const index in sources) {
    if (sources.hasOwnProperty(index)) {
      sourceNameToIndex[sources[index].name] = parseInt(index)
    }
  }

  // get filenames with solidity tab index
  // find a mapping of solidity tab index to ast index
  // ast id: validkeys, solidity id
  // then, if no source present, find within the set of valid keys of all mappings to get a key with the source id
  // 

  const astKeyMap = getASTKeys(safeAccess(compiledJSON, [JSON_SOURCES]), sourceNameToIndex)

  console.log(astKeyMap)

  for (const index in sources) {
    const outputName = sources[index].name

    const contractNames = Object.keys(safeAccess(compiledJSON, [JSON_CONTRACTS, outputName]))

    for (const contractName of contractNames) {
      const compiledEVM = safeAccess(compiledJSON, [JSON_CONTRACTS, outputName, contractName, JSON_EVM, JSON_LEGACY])
  
      if (compiledEVM !== {} && compiledEVM[CODE] != null && compiledEVM[DATA] != null) {
        // const validKeys = findValidKeys(compiledAST)
  
        const filteredLinesArray = []
  
        // let currMap = undefined as undefined | {
        //   sourceMap: FragmentMap,
        //   compiledMaps: FragmentMap[]
        // }
  
        const mappings = {} as {[key: string]: EVMMap}
  
        filteredLinesArray.push("CONSTRUCTOR:")
  
        const hasCreationCode = parseLegacyEVMSection(sources, compiledEVM[CODE], filteredLinesArray, mappings, astKeyMap)
  
        console.log(`Num instructions in constructor: ${compiledEVM[CODE].length}`)
  
        filteredLinesArray.push("SUBROUTINES:")
  
        const hasRuntimeCode = parseLegacyEVMSection(sources, compiledEVM[DATA]["0"][CODE], filteredLinesArray, mappings, astKeyMap)
  
        console.log(`Num instructions in sub: ${compiledEVM[DATA]["0"][CODE].length}`)
  
        const filteredLines = filteredLinesArray.join('\n')
  
        // dont push if there is no code
        if (hasCreationCode || hasRuntimeCode) {
          parsedMappings[contractName] = {
            mappings,
            filteredLines,
            hasSymExec: false
          }
        }
      }
    }
  }

  return parsedMappings
}

const _getCurrKey = (key: string, nodeSource: number | undefined, astKeyMap: {[index: number]: ASTKey}) => {
  // if node source is given, use that
  if (nodeSource != null && astKeyMap[nodeSource] != null) {
    if (astKeyMap[nodeSource].validKeys.has(key)) {
      return [`${key}:${nodeSource}`, astKeyMap[nodeSource].solidityIndex]
    } else {
      return [undefined, undefined]
    }
  }

  for (const astKey in astKeyMap) {
    if (astKeyMap[astKey].validKeys.has(key)) {
      return [`${key}:${astKey}`, astKeyMap[astKey].solidityIndex]
    }
  }

  return [undefined, undefined]
}

const parseLegacyEVMSection = (sources: {[index: number]: EVMSource}, code: LegacyEVMNode[], filteredLinesArray: string[], codeMappings: {[key: string]: EVMMap}, astKeyMap: {[index: number]: ASTKey}) => {
  let num_tags = 0
  let hasCode = false
  
  for (const node of code) {

    // const node = code[i]

    if (node[NAME] === TAG) {
      num_tags++
    }

    const [currKey, soliditySource] = _getCurrKey(`${node[BEGIN]}:${node[END]}`, node[SOURCE], astKeyMap)

    // dont include generated stuff for the contract
    if (currKey == null) {
      continue
    }

    const sourceText = sources[soliditySource as number].sourceText

    const [startLine, startChar] = getLineCharFromOffset(sourceText, node[BEGIN])
    const [endLine, endChar] = getLineCharFromOffset(sourceText, node[END])

    // function for pushing a new compile map
    const pushNewCompiledMap = () => {
      hasCode = true

      const compiledMap = {
        startLine: filteredLinesArray.length,
        startChar: 1,
        endLine: filteredLinesArray.length,
        endChar: 1,
        length: node[END] - node[BEGIN], // when marking, start with greatest lengths first
        source: soliditySource as number
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
        source: soliditySource as number
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
      const lastCompileMapEndIndex = codeMappings[currKey].compiledMaps[compiledMapLen].endLine

      if (filteredLinesArray.length === lastCompileMapEndIndex + 1) {
        // the last added line was the one before this, so we can just extend the previous map by one\
        codeMappings[currKey].compiledMaps[compiledMapLen].endLine = filteredLinesArray.length
      } else {
        // the last added line was not consecutive anymore, so we need to add a new map
        pushNewCompiledMap()
      }
    }
    // }
  }

  return hasCode
}

export const parseCompiledJSON = (compiledJSON: any) => {
  const sourceFilenames = Object.keys(safeAccess(compiledJSON, [JSON_CONTRACTS]))

  let contractJSON = {} as {
    [name: string]: {
      [contract: string]: ContractJSON
    }
  }

  let contractAST = {} as {
    [name: string]: any
  }

  for (const sourceFile of sourceFilenames) {
    const contractNames = Object.keys(safeAccess(compiledJSON, [JSON_CONTRACTS, sourceFile]))
    contractJSON[sourceFile] = {} as {
        [contract: string]: ContractJSON
    }

    for (const contractName of contractNames) {
      contractJSON[sourceFile][contractName] = safeAccess(compiledJSON, [JSON_CONTRACTS, sourceFile, contractName]) as ContractJSON
    }

    contractAST[sourceFile] = safeAccess(compiledJSON, [JSON_SOURCES, sourceFile])
  }


  return {
    contracts: contractJSON,
    ast: contractAST
  }
}

export const addSymexecMetrics = (mappings: {[key: string]: EVMMap}, gasMap: any, compiledAST: any) => {
  _addGasMetrics(mappings, gasMap.creation)
  _addGasMetrics(mappings, gasMap.runtime)

  _addLoopGasMetrics(mappings, gasMap.loop_gas)

  _addFunctionGasMetrics(mappings, gasMap.function_gas, compiledAST)
}

const _addGasMetrics = (mappings: {[key: string]: EVMMap}, gasMapSection: any) => {
  for (const key of Object.keys(gasMapSection)) {
    if (key in mappings) {
      mappings[key].gasMap = {
        ...gasMapSection[key],
        class: getGasClass(gasMapSection[key].meanMaxTotalGas)
      }
    }
  }
}

const _addLoopGasMetrics = (mappings: {[key: string]: EVMMap}, loopGas: any) => {
  for (const key in loopGas) {
    console.log('updating loop gas for: ' + key)
    if (key in mappings) {
      console.log('key is in mappings: ' + key)
      mappings[key].loopGas = {
        ...loopGas[key]
      } as {[pc: number]: number}
    }
  }
}

const _addFunctionGasMetrics = (mappings: {[key: string]: EVMMap}, fnGas: any, ast: any) => {
  const mappingKeys = Object.keys(mappings)
  
  for (const selector in fnGas) {
    const splitSelector = selector.split(':')
    const truncSelector = splitSelector[0].substring(2)
    const functionName = splitSelector[1]

    console.log("Found key for fn")
    console.log(truncSelector)
    console.log(functionName)

    const key = findFunctionDefinitition(truncSelector, functionName, mappingKeys, ast)

    console.log(key)

    if (key != null) {
      mappings[key].functionGas = fnGas[selector]
      mappings[key].functionSelector = truncSelector
    }
  }
}

const FN_REGEX = /(\w+)\(.*\)/

const findFunctionDefinitition = (functionSelector: string, functionName: string, mappingKeys: string[], ast: any) => {
  const regexMatch = functionName.match(FN_REGEX);

  let fnName = ""

  if (regexMatch != null) {
    fnName = regexMatch[1]
  }

  for (const contractFile in ast) {
    const contractAST = safeAccess(ast, [contractFile, 'ast'])

    const visited = [contractAST] as any[]
    const queue = [contractAST] as any[]

    while (queue.length > 0) {
      const node = queue.splice(0, 1)[0]

      if (node != null) {
        if (node.nodeType === "FunctionDefinition" && (node.functionSelector === functionSelector || node.name === fnName)) {
          const src_items = (node.src as string).split(':')
          const src_start = parseInt(src_items[0])
          const src_end = src_start + parseInt(src_items[1])
          const src_file = parseInt(src_items[2])
          
          const mappingKey = `${src_start}:${src_end}:${src_file}`
          if (mappingKeys.includes(mappingKey)) {
            return mappingKey
          }
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
    }
  }

  return undefined
}

export const isTargetInLineRange = (targetLine: number, targetChar: number, sourceStartLine: number, sourceEndLine: number, sourceStartChar?: number, sourceEndChar?: number) => {
  const isSameLine = sourceStartLine === sourceEndLine

  if (!isSameLine && targetLine >= sourceStartLine && targetLine <= sourceEndLine) {
    return true
  }
  if (isSameLine && targetLine === sourceStartLine) {
    if ((sourceStartChar == null || sourceEndChar == null) || targetChar >= sourceStartChar && targetChar <= sourceEndChar) {
      return true
    }
  }
  return false
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

export const sortMappingsByLength = (mappings: {[key: string]: EVMMap}) => {
  const mappingKeysSorted = Object.keys(mappings).map((k) => {return {key: k, length: mappings[k].sourceMap.length}})
  mappingKeysSorted.sort((firstEl, secondEl) => { return secondEl.length - firstEl.length })

  return mappingKeysSorted
}

// statements, declarations, initialValue, expression, leftExpression, rightExpression, parameters, returnParameters, 

interface ASTKey {
  validKeys: Set<string>
  solidityIndex: number
}

const getASTKeys = (sources: any, sourceNameToIndex: {[name: string]: number}) => {

  let ASTKeyMap = {} as {[index: number]: ASTKey}

  for (const sourceName in sources) {
    const astID = sources[sourceName]['id']
    const ast = sources[sourceName]['ast']

    const validKeys = findValidKeys(ast)

    ASTKeyMap[astID] = {
      validKeys: validKeys,
      solidityIndex: sourceNameToIndex[sourceName]
    }
  }

  return ASTKeyMap
}

const findValidKeys = (ast: any) => {
  const visited = [ast] as any[]
  const queue = [ast] as any[]

  const validKeys = new Set() as Set<string>

  while (queue.length > 0) {
    const node = queue.splice(0, 1)[0]

    if (typeof node === 'object' && node != null) {
      // if the object is an array
      if (Array.isArray(node)) {
        for (const neighbour of node) {
          if (!visited.includes(neighbour)) {
            visited.push(neighbour)
            queue.push(neighbour)
          }
        }
      } else {
        const nodeKeys = Object.keys(node)

        if (nodeKeys.includes("nodeType") && nodeKeys.includes("src")) {
          if (node.nodeType !== "ContractDefinition") {
            const src_items = (node.src as string).split(':')
            const src_start = parseInt(src_items[0])
            const src_end = src_start + parseInt(src_items[1])
            validKeys.add(`${src_start}:${src_end}`)
          }

          for (const key in node) {
            if (key !== 'nodeType' && key !== "src" && !visited.includes(node[key])) {
              visited.push(node[key])
              queue.push(node[key])
            }
          }
        }
      }
    }
    
  }

  return validKeys
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

export const compileSourceRemote = (sources: {[index: number]: EVMSource}, settings: CompilerSettings) => {
  
  let requestFiles = [] as any[]

  for (const index in sources) {
    const currentFile = {
      name: sources[index].name,
      content: sources[index].sourceText
    }

    requestFiles.push(currentFile)
  }

  console.log(requestFiles)
  
  return axios.post('http://127.0.0.1:5000/compile/', {
    files: requestFiles,
    settings: {
     ...settings
    }
  })
}

export const symExecSourceRemote = (contract: string, sources: {[index: number]: EVMSource}, compiledJSON: any, settings: SymexecSettings) => {
  let requestFiles = [] as any[]

  if (settings[SYMEXEC_ENABLE_ONCHAIN] && !isAddress(settings[SYMEXEC_ONCHAIN_ADDRESS])) {
    throw new Error("Invalid onchain address for symbolic execution")
  }

  for (const index in sources) {
    const currentFile = {
      name: sources[index].name,
      content: sources[index].sourceText
    }

    requestFiles.push(currentFile)
  }
  
  return axios.post('http://127.0.0.1:5000/sym/', {
    files: requestFiles,
    json: JSON.stringify(compiledJSON),
    settings: {
      ...settings
    },
    contract: contract
  })
}

export const etherscanLoader = (address: string) => {
  return axios.get(ETHERSCAN_API_ENDPOINT, { 
    params: {
      module: 'contract',
      action: 'getsourcecode',
      address: address,
      apikey: ETHERSCAN_API_KEY
    }
  })
}