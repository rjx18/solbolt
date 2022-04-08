export interface FragmentMap {
  startLine: number;
  startChar: number;
  endLine: number;
  endChar: number;
  length: number;
}

export interface GasMapItem {
  numTx: number;
  class: number;
  totalMaxOpcodeGas: number;
  meanMaxOpcodeGas: number;
  totalMinOpcodeGas: number;
  meanMinOpcodeGas: number;
  totalMemGas: number;
  meanMemGas: number;
  meanWcGas: number;
}

export enum HighlightedSource { COMPILE, SOURCE }

export interface HighlightedClass {
  className: string,
  triggeredFrom: HighlightedSource
}

export interface EVMMap {
  sourceMap: FragmentMap
  compiledMaps: FragmentMap[]
  gasMap?: GasMapItem
  loopGas?: {
    [pc: number]: number
  }
}

export interface EVMJSON {
  ['bytecode']: any
  ['deployedBytecode']: any
  ['legacyAssembly']: any
  ['methodIdentifiers']: any
}

export interface ContractJSON {
  ['evm']: EVMJSON
  ['ir']: string
  ['metadata']: string
}

export interface ContractMappings {
  mappings: {
    [key: string]: EVMMap;
  }
  filteredLines: string
}

export const COMPILER_PEEPHOLE = 'peephole'
export const COMPILER_INLINER = 'inliner'
export const COMPILER_JUMPDESTREMOVER = 'jumpdestRemover'
export const COMPILER_ORDERLITERALS = 'orderLiterals'
export const COMPILER_DEDUPLICATE = 'deduplicate'
export const COMPILER_CSE = 'cse'
export const COMPILER_CONSTANTOPTIMIZER = 'constantOptimizer'
export const COMPILER_YUL = 'yul'

export const COMPILER_ENABLE = 'enable_optimizer'
export const COMPILER_RUNS = 'optimize_runs'
export const COMPILER_EVM = 'evmVersion'
export const COMPILER_VIAIR = 'viaIR'
export const COMPILER_DETAILS = 'details'

export interface CompilerOptimizerDetails {
  [COMPILER_PEEPHOLE]: boolean
  [COMPILER_INLINER]: boolean
  [COMPILER_JUMPDESTREMOVER]: boolean
  [COMPILER_ORDERLITERALS]: boolean
  [COMPILER_DEDUPLICATE]: boolean
  [COMPILER_CSE]: boolean
  [COMPILER_CONSTANTOPTIMIZER]: boolean
  [COMPILER_YUL]: boolean
}

export interface CompilerSettings {
  [COMPILER_ENABLE]: boolean
  [COMPILER_RUNS]: number
  [COMPILER_EVM]: string
  [COMPILER_VIAIR]: boolean
  [COMPILER_DETAILS]: CompilerOptimizerDetails
}

export const SYMEXEC_MAXDEPTH = 'max_depth'
export const SYMEXEC_CALLDEPTH = 'call_depth_limit'
export const SYMEXEC_STRATEGY = 'strategy'
export const SYMEXEC_LOOPBOUND = 'loop_bound'
export const SYMEXEC_TX = 'transaction_count'

export interface SymexecSettings {
  [SYMEXEC_MAXDEPTH]: number
  [SYMEXEC_CALLDEPTH]: number
  [SYMEXEC_STRATEGY]: string
  [SYMEXEC_LOOPBOUND]: number
  [SYMEXEC_TX]: number
}

// export interface ContractData {
//   json: ContractJson
// }