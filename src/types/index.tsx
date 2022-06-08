export interface FragmentMap {
  startLine: number;
  startChar: number;
  endLine: number;
  endChar: number;
  length: number;
  source: number;
}

export interface GasMapItem {
  numTx: number;
  numInvocations: number;
  class: string;
  maxOpcodeGas: number;
  minOpcodeGas: number;
  memGas: number;
  maxStorageGas: number;
  minStorageGas: number;
  meanMaxTotalGas: number;
}

export enum HighlightedSource { COMPILE, SOURCE }

export interface HighlightedClass {
  className: string,
  triggeredFrom: HighlightedSource
}

export interface LoopGasEstimate {
  gas: number;
  isHidden: boolean;
}

export interface EVMMap {
  sourceMap: FragmentMap
  compiledMaps: FragmentMap[]
  gasMap?: GasMapItem
  loopGas?: {
    [pc: number]: LoopGasEstimate
  }
  functionGas?: number
  functionSelector?: string
  detectedIssues?: string[]
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
  ['sourceIndex']: number
}

export interface ContractMappings {
  mappings: {
    [key: string]: EVMMap;
  }
  covPercentage?: number;
  filteredLines: string;
  hasSymExec: boolean;
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
export const COMPILER_VERSION = 'version'
export const COMPILER_DETAILS_ENABLED = 'details_enabled'

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
  [COMPILER_VERSION]: string
  [COMPILER_ENABLE]: boolean
  [COMPILER_RUNS]: number
  [COMPILER_EVM]: string
  [COMPILER_VIAIR]: boolean
  [COMPILER_DETAILS]: CompilerOptimizerDetails
  [COMPILER_DETAILS_ENABLED]: boolean
}

export const SYMEXEC_MAXDEPTH = 'max_depth'
export const SYMEXEC_CALLDEPTH = 'call_depth_limit'
export const SYMEXEC_STRATEGY = 'strategy'
export const SYMEXEC_LOOPBOUND = 'loop_bound'
export const SYMEXEC_TX = 'transaction_count'
export const SYMEXEC_ENABLE_ONCHAIN = 'enable_onchain'
export const SYMEXEC_ONCHAIN_ADDRESS = 'onchain_address'
export const SYMEXEC_IGNORE_CONSTRAINTS = 'ignore_constraints'

export interface SymexecSettings {
  [SYMEXEC_MAXDEPTH]: number
  [SYMEXEC_CALLDEPTH]: number
  [SYMEXEC_STRATEGY]: string
  [SYMEXEC_LOOPBOUND]: number
  [SYMEXEC_TX]: number
  [SYMEXEC_ENABLE_ONCHAIN]: boolean
  [SYMEXEC_ONCHAIN_ADDRESS]: string
  [SYMEXEC_IGNORE_CONSTRAINTS]: boolean
}

export const SOURCE_MODEL = "SOURCE_MODEL"
export const SOURCE_VIEW_STATE = "SOURCE_VIEW_STATE"
export const SOURCE_FILENAME = "SOURCE_FILENAME"
export const SOURCE_LAST_SAVED_VALUE = "SOURCE_LAST_SAVED_VALUE"

export interface Source {
  [SOURCE_FILENAME]: string
  [SOURCE_LAST_SAVED_VALUE]: string,
  [SOURCE_MODEL]: any
  [SOURCE_VIEW_STATE]: any
}

export interface SourceContent {
  [SOURCE_FILENAME]: string
  [SOURCE_LAST_SAVED_VALUE]: string,
}

export interface SourceState {
  [SOURCE_MODEL]: any
  [SOURCE_VIEW_STATE]: any
}

export interface EVMSource {
  name: string;
  sourceText: string;
}

export interface TaskStatus {
  taskId: string
  taskStartTime: number
}
