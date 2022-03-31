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
  meanGemGas: number;
  meanWcGas: number;
}

export interface HoverMessage {
  type: string // 'fn' or 'loop'
  value: string // to change later if need to
}

export interface EVMMap {
  sourceMap: FragmentMap,
  compiledMaps: FragmentMap[],
  filteredLines: string, // TODO: change to another data structure to handle expanding of filtered lines
  gasMap?: GasMapItem,
  hoverMessage?: HoverMessage[]
}