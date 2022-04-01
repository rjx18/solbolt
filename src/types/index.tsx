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

export interface HoverMessage {
  type: string // 'fn' or 'loop'
  value: string // to change later if need to
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
  hoverMessage?: HoverMessage[]
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

// export interface ContractData {
//   json: ContractJson
// }