import { CompilerOptimizerDetails, CompilerSettings, COMPILER_CONSTANTOPTIMIZER, COMPILER_CSE, COMPILER_DEDUPLICATE, COMPILER_DETAILS, COMPILER_DETAILS_ENABLED, COMPILER_ENABLE, COMPILER_EVM, COMPILER_INLINER, COMPILER_JUMPDESTREMOVER, COMPILER_ORDERLITERALS, COMPILER_PEEPHOLE, COMPILER_RUNS, COMPILER_VERSION, COMPILER_VIAIR, COMPILER_YUL, EVMSource, Source, SourceContent, SOURCE_FILENAME, SOURCE_LAST_SAVED_VALUE, SymexecSettings, SYMEXEC_CALLDEPTH, SYMEXEC_ENABLE_ONCHAIN, SYMEXEC_IGNORE_CONSTRAINTS, SYMEXEC_LOOPBOUND, SYMEXEC_MAXDEPTH, SYMEXEC_ONCHAIN_ADDRESS, SYMEXEC_STRATEGY, SYMEXEC_TX, TaskStatus } from '../types'

export const DEFAULT_SOLIDITY_VALUE = `// SPDX-License-Identifier: GPL-3.0
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
  ` // change this to use stored Source file later with a context

export const NUM_FRAGMENT_CLASSES = 12
export const OUTPUT_FILE_NAME = 'output.sol'

export const ETHERSCAN_API_KEY = process.env.REACT_APP_SOLBOLT_ETHERSCAN_KEY
export const ETHERSCAN_API_ENDPOINT = 'https://api.etherscan.io/api'

export const BACKEND_URL = process.env.NODE_ENV === "development" ? 'http://127.0.0.1:5000' : 'https://api.solbolt.com'

export const SOLC_BINARIES = [
  'v0.8.13+commit.abaa5c0e',
  'v0.8.12+commit.f00d7308',
  'v0.8.11+commit.d7f03943',
  'v0.8.10+commit.fc410830',
  'v0.8.9+commit.e5eed63a',
  'v0.8.8+commit.dddeac2f',
  'v0.8.7+commit.e28d00a7',
  'v0.8.6+commit.11564f7e',
  'v0.8.5+commit.a4f2e591',
  'v0.8.4+commit.c7e474f2',
  'v0.8.3+commit.8d00100c',
  'v0.8.2+commit.661d1103',
  'v0.8.1+commit.df193b15',
  'v0.8.0+commit.c7dfd78e',
  'v0.7.6+commit.7338295f',
  'v0.7.5+commit.eb77ed08',
  'v0.7.4+commit.3f05b770',
  'v0.7.3+commit.9bfce1f6',
  'v0.7.2+commit.51b20bc0',
  'v0.7.1+commit.f4a555be',
  'v0.7.0+commit.9e61f92b',
  'v0.6.12+commit.27d51765',
  'v0.6.11+commit.5ef660b1',
  'v0.6.10+commit.00c0fcaf',
  'v0.6.9+commit.3e3065ac',
  'v0.6.8+commit.0bbfe453',
  'v0.6.7+commit.b8d736ae',
  'v0.6.6+commit.6c089d02',
  'v0.6.5+commit.f956cc89',
  'v0.6.4+commit.1dca32f3',
  'v0.6.3+commit.8dda9521',
  'v0.6.2+commit.bacdbe57',
  'v0.6.1+commit.e6f7d5a4',
  'v0.6.0+commit.26b70077',
  'v0.5.17+commit.d19bba13',
  'v0.5.16+commit.9c3226ce',
  'v0.5.15+commit.6a57276f',
  'v0.5.14+commit.01f1aaa4',
  'v0.5.13+commit.5b0b510c',
  'v0.5.12+commit.7709ece9',
  'v0.5.11+commit.22be8592',
  'v0.5.10+commit.5a6ea5b1',
  'v0.5.9+commit.c68bc34e',
  'v0.5.8+commit.23d335f2',
  'v0.5.7+commit.6da8b019',
  'v0.5.6+commit.b259423e',
  'v0.5.5+commit.47a71e8f',
  'v0.5.4+commit.9549d8ff',
  'v0.5.3+commit.10d17f24',
  'v0.5.2+commit.1df8f40c',
  'v0.5.1+commit.c8a2cb62',
  'v0.5.0+commit.1d4f565a',
  'v0.4.26+commit.4563c3fc',
  'v0.4.25+commit.59dbf8f1',
  'v0.4.24+commit.e67f0147',
  'v0.4.23+commit.124ca40d',
  'v0.4.22+commit.4cb486ee',
  'v0.4.21+commit.dfe3193c',
  'v0.4.20+commit.3155dd80',
  'v0.4.19+commit.c4cbbb05',
  'v0.4.18+commit.9cf6e910',
  'v0.4.17+commit.bdeb9e52',
  'v0.4.16+commit.d7661dd9',
  'v0.4.15+commit.8b45bddb',
  'v0.4.14+commit.c2215d46',
  'v0.4.13+commit.0fb4cb1a',
  'v0.4.12+commit.194ff033',
  'v0.4.11+commit.68ef5810',
  'v0.4.10+commit.9e8cc01b'
]

export const DEFAULT_COMPILER_SETTINGS = {
  [COMPILER_VERSION]: 'v0.8.13+commit.abaa5c0e',
  [COMPILER_EVM]: 'Default',
  [COMPILER_RUNS]: 200,
  [COMPILER_ENABLE]: true,
  [COMPILER_VIAIR]: false,
  [COMPILER_DETAILS_ENABLED]: false,
  [COMPILER_DETAILS]: {
    [COMPILER_PEEPHOLE]: true,
    [COMPILER_INLINER]: true,
    [COMPILER_JUMPDESTREMOVER]: true,
    [COMPILER_ORDERLITERALS]: false,
    [COMPILER_DEDUPLICATE]: false,
    [COMPILER_CSE]: false,
    [COMPILER_CONSTANTOPTIMIZER]: false,
    [COMPILER_YUL]: false
  } as CompilerOptimizerDetails
} as CompilerSettings

export const DEFAULT_SYMEXEC_SETTINGS = {
  [SYMEXEC_MAXDEPTH]: 64,
  [SYMEXEC_CALLDEPTH]: 16,
  [SYMEXEC_STRATEGY]: 'bfs',
  [SYMEXEC_LOOPBOUND]: 10,
  [SYMEXEC_TX]: 2,
  [SYMEXEC_ENABLE_ONCHAIN]: false,
  [SYMEXEC_ONCHAIN_ADDRESS]: "",
  [SYMEXEC_IGNORE_CONSTRAINTS]: true
} as SymexecSettings