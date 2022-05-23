import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'
import { OUTPUT_FILE_NAME } from '../constants'
import { ContractJSON, EVMMap } from '../types'

import { safeAccess } from '../utils'

export enum UpdateTypes {
  UPDATE_CONTRACT = 'UPDATE_CONTRACT',
  UPDATE_ALL_CONTRACTS = 'UPDATE_ALL_CONTRACTS',
}

const SOLBOLT_CONTRACTS = "SOLBOLT_CONTRACTS"

const CONTRACTS = 'contracts'
const SOURCES = 'sources'
const AST = 'ast'
const HASH = 'hash'
const ERRORS = 'errors'
const ID = 'id'

export type ContractsUpdateAction = {type: UpdateTypes.UPDATE_CONTRACT} | {type: UpdateTypes.UPDATE_ALL_CONTRACTS}

export interface ContractsState {
  [CONTRACTS]: {
    [fileName: string]: {
      [contractName: string]: ContractJSON
    }
  },
  [AST]: {
    [name: string]: any
  },
}

export interface Payload {
  filename: string;
  name: string;
  contract: ContractJSON;
}

export interface Payload {
  contracts: {
    [fileName: string]: {
      [contractName: string]: ContractJSON
    }
  },
  ast: {
    [name: string]: any
  }
}

const ContractsContext = createContext<
  [ContractsState | undefined, {
    updateContract: ((filename: string, name: string, contract: ContractJSON) => void) | undefined, 
    updateAllContracts: ((contracts: {[fileName: string]: {[contractName: string]: ContractJSON}}, ast: {[name: string]: any}) => void) | undefined
  }]>([undefined, {updateContract: undefined, updateAllContracts: undefined}]);

export function useContractsContext() {
  return useContext(ContractsContext)
}

function reducer(state: ContractsState, { type, payload }: { type: UpdateTypes, payload: Payload | undefined}) {
  switch (type) {
    case UpdateTypes.UPDATE_CONTRACT: {
      if (!payload) {
        throw Error(`Payload is undefined or null!`)
      }
      const { filename, name, contract } = payload
      return {
        ...state,
        [CONTRACTS]: {
          ...(safeAccess(state, [CONTRACTS]) || {}),
          [filename]: {
            ...(safeAccess(state, [CONTRACTS, filename]) || {}),
            [name]: contract
          }
        }
      }
    }

    case UpdateTypes.UPDATE_ALL_CONTRACTS: {
      if (!payload) {
        throw Error(`Payload is undefined or null!`)
      }
      const { contracts, ast } = payload
      return {
        ...state,
        [CONTRACTS]: {
          ...contracts
        },
        [AST]: {
          ...ast
        },
      }
    }

    default: {
      throw Error(`Unexpected action type in ContractsContext reducer: '${type}'.`)
    }
  }
}

function init() {
  const defaultMappingState = {
    [CONTRACTS]: {},
    [AST]: {},
    [HASH]: {}
  } as ContractsState

  try {
    const windowItem = window.localStorage.getItem(SOLBOLT_CONTRACTS)
    if (windowItem) {
      const parsed = JSON.parse(windowItem)
      return { ...parsed }
    } 
    return defaultMappingState
  } catch {
    return defaultMappingState
  }
}

export default function Provider({ children }: {children: any}) {
  const [state, dispatch] = useReducer(reducer, undefined, init)

  const updateContract = useCallback((filename, name, contract) => {
    dispatch({ type: UpdateTypes.UPDATE_CONTRACT, payload: { filename, name, contract } as Payload })
  }, [])

  const updateAllContracts = useCallback((contracts, ast) => {
    dispatch({ type: UpdateTypes.UPDATE_ALL_CONTRACTS, payload: { contracts, ast } as Payload }  )
  }, [])

  return (
    <ContractsContext.Provider
      value={useMemo(() => [state, { updateContract, updateAllContracts }], [
        state,
        updateContract,
        updateAllContracts
      ])}
    >
      {children}
    </ContractsContext.Provider>
  )
}

export function Updater() {
  const [state, ] = useContractsContext()

  useEffect(() => {
    window.localStorage.setItem(SOLBOLT_CONTRACTS, JSON.stringify({ ...state }))
  })

  return null
}

export function useUpdateContract() {

  const [, { updateContract }] = useContractsContext()

  return useCallback(
      (filename: string, name: string, contract: ContractJSON) => {
        if (
          updateContract &&
          contract &&
          name
        ) {
          updateContract(filename, name, contract)
        }
      },
      [updateContract]
    )
}

export function useUpdateAllContracts() {

  const [, { updateAllContracts }] = useContractsContext()

  return useCallback(
      (contracts: {[fileName: string]: {[contractName: string]: ContractJSON}}, ast: {[name: string]: any}) => {
        console.log("updating all contracts")
        console.log(contracts)
        console.log(ast)
        console.log(updateAllContracts)

        if (
          updateAllContracts &&
          contracts &&
          ast
        ) {
          console.log("updated all contracts")
          updateAllContracts(contracts, ast)
        }
      },
      [updateAllContracts]
    )
}

export function useContractNames() {
  const [state] = useContractsContext();

  let contractNames = [] as string[]

  for (const filename in safeAccess(state, [CONTRACTS])) {
    contractNames.push(...Object.keys(safeAccess(state, [CONTRACTS, filename])))
  }

  return contractNames
}

export function useContract(contract: string | undefined) {
  const [state] = useContractsContext();

  if (contract == null) {
    return {} as ContractJSON
  }

  for (const filename in safeAccess(state, [CONTRACTS])) {
    if (Object.keys(safeAccess(state, [CONTRACTS, filename])).includes(contract)) {
      return safeAccess(state, [CONTRACTS, filename, contract]) as ContractJSON
    }
  }

  return {} as ContractJSON
}

export function useFilenameOfContract(contract: string) {
  const [state] = useContractsContext();

  for (const filename in safeAccess(state, [CONTRACTS])) {
    if (Object.keys(safeAccess(state, [CONTRACTS, filename])).includes(contract)) {
      return filename
    }
  }

  return undefined
}

export function useAST() {
  const [state] = useContractsContext();

  return safeAccess(state, [AST])
}

// recreates the compiled JSON object
export function useCompiledJSON() {
  const [state] = useContractsContext();

  return {
    [CONTRACTS]: {
      ...safeAccess(state, [CONTRACTS])
    },
    [ERRORS]: [],
    [SOURCES]: {
      ...safeAccess(state, [AST])
    }
  }
}