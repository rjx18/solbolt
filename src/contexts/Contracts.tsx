import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'
import { OUTPUT_FILE_NAME } from '../constants'
import { ContractJSON, EVMMap } from '../types'

import { safeAccess } from '../utils'

export enum UpdateTypes {
  UPDATE_CONTRACT = 'UPDATE_CONTRACT',
  UPDATE_ALL_CONTRACTS = 'UPDATE_ALL_CONTRACTS',
}

const CONTRACTS = 'contracts'
const SOURCES = 'sources'
const AST = 'ast'
const HASH = 'hash'
const ERRORS = 'errors'
const ID = 'id'

export type ContractsUpdateAction = {type: UpdateTypes.UPDATE_CONTRACT} | {type: UpdateTypes.UPDATE_ALL_CONTRACTS}

export interface ContractsState {
  [CONTRACTS]: {
    [name: string]: ContractJSON
  }
  [AST]: any,
  [HASH]: number
}

export interface Payload {
  name: string;
  contract: ContractJSON
}

export interface Payload {
  contracts: {
    [name: string]: ContractJSON
  };
  ast: any,
  hash: number
}

const ContractsContext = createContext<
  [ContractsState | undefined, {
    updateContract: ((name: string, contract: ContractJSON) => void) | undefined, 
    updateAllContracts: ((contracts: {[name: string]: ContractJSON}, ast: any, hash: number) => void) | undefined
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
      const { name, contract } = payload
      return {
        ...state,
        [CONTRACTS]: {
          ...(safeAccess(state, [CONTRACTS]) || {}),
          [name]: contract
        }
      }
    }

    case UpdateTypes.UPDATE_ALL_CONTRACTS: {
      if (!payload) {
        throw Error(`Payload is undefined or null!`)
      }
      const { contracts, ast, hash } = payload
      return {
        ...state,
        [CONTRACTS]: {
          ...contracts
        },
        [AST]: {
          ...ast
        },
        [HASH]: hash
      }
    }

    default: {
      throw Error(`Unexpected action type in ContractsContext reducer: '${type}'.`)
    }
  }
}

export default function Provider({ children }: {children: any}) {
  const [state, dispatch] = useReducer(reducer, {
    [CONTRACTS]: {},
    [AST]: undefined,
    [HASH]: 0
  } as ContractsState)

  const updateContract = useCallback((name, contract,) => {
    dispatch({ type: UpdateTypes.UPDATE_CONTRACT, payload: { name, contract } as Payload })
  }, [])

  const updateAllContracts = useCallback((contracts, ast, hash) => {
    dispatch({ type: UpdateTypes.UPDATE_ALL_CONTRACTS, payload: { contracts, ast, hash } as Payload }  )
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

export function useUpdateContract() {

  const [, { updateContract }] = useContractsContext()

  return useCallback(
      (name: string, contract: ContractJSON) => {
        if (
          updateContract &&
          contract &&
          name
        ) {
          updateContract(name, contract)
        }
      },
      [updateContract]
    )
}

export function useUpdateAllContracts() {

  const [, { updateAllContracts }] = useContractsContext()

  return useCallback(
      (contracts: {[name: string]: ContractJSON}, ast: any, hash: number) => {
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
          updateAllContracts(contracts, ast, hash)
        }
      },
      [updateAllContracts]
    )
}

export function useContractNames() {
  const [state] = useContractsContext();

  return Object.keys(safeAccess(state, [CONTRACTS]))
}

export function useContract(contract: string) {
  const [state] = useContractsContext();

  return safeAccess(state, [CONTRACTS, contract]) as ContractJSON
}

export function useAST() {
  const [state] = useContractsContext();

  return safeAccess(state, [AST])
}

export function useHash() {
  const [state] = useContractsContext();

  return safeAccess(state, [HASH])
}

// recreates the compiled JSON object
export function useCompiledJSON() {
  const [state] = useContractsContext();

  return {
    [CONTRACTS]: {
      [OUTPUT_FILE_NAME]: {
        ...safeAccess(state, [CONTRACTS])
      }
    },
    [ERRORS]: [],
    [SOURCES]: {
      [OUTPUT_FILE_NAME]: {
        [AST]: {
          ...safeAccess(state, [AST])
        },
        [ID]: 0
      }
    }
  }
}