import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'
import { ContractMappings, EVMMap } from '../types'

import { safeAccess } from '../utils'

const SOLBOLT_MAPPINGS = "SOLBOLT_MAPPINGS"

export enum UpdateTypes {
  UPDATE_MAPPING = 'UPDATE_MAPPING',
  UPDATE_ALL_MAPPINGS = 'UPDATE_ALL_MAPPINGS',
  REMOVE_ALL_MAPPINGS = 'REMOVE_ALL_MAPPINGS'
}

export type MappingsUpdateAction = {type: UpdateTypes.UPDATE_MAPPING} | {type: UpdateTypes.UPDATE_ALL_MAPPINGS} | {type: UpdateTypes.REMOVE_ALL_MAPPINGS}

export interface MappingsState {
  [contract: string]: ContractMappings;
} // compiled mapping have hoverMessage, with type 'fn' and 'loop'

export interface Payload {
  contract: string
  key: string
  evmMap: EVMMap
}

export interface Payload {
  contract: string
  allMaps: {
    [key: string]: EVMMap
  }
  filteredLines: string
  hasSymExec: boolean
  covPercentage?: number
}

const MappingsContext = createContext<
  [MappingsState | undefined, {
    updateMapping: ((contract: string, key: string, evmMap: string) => void) | undefined, 
    updateAllMappings: ((contract: string, allMaps: {[key: string]: EVMMap}, filteredLines: string, hasSymExec: boolean, covPercentage?: number) => void) | undefined,
    removeAllMappings: (() => void) | undefined
  }]>([undefined, {updateMapping: undefined, updateAllMappings: undefined, removeAllMappings: undefined}]);

export function useMappingsContext() {
  return useContext(MappingsContext)
}

function reducer(state: MappingsState, { type, payload }: { type: UpdateTypes, payload: Payload | undefined}) {
  switch (type) {
    case UpdateTypes.UPDATE_MAPPING: {
      if (!payload) {
        throw Error(`Payload is undefined or null!`)
      }
      const { contract, key, evmMap } = payload
      return {
        ...state,
        [contract]: {
          ...((safeAccess(state, [contract]) || {}) as ContractMappings),
          mappings: {
            ...((safeAccess(state, [contract]) || {}) as ContractMappings).mappings,
            [key]: evmMap
          }
        }
      }
    }

    case UpdateTypes.UPDATE_ALL_MAPPINGS: {
      if (!payload) {
        throw Error(`Payload is undefined or null!`)
      }
      const { contract, allMaps, filteredLines, hasSymExec, covPercentage } = payload
      return {
        ...state,
        [contract]: {
          mappings: {
            ...allMaps
          },
          filteredLines: filteredLines,
          hasSymExec: hasSymExec,
          covPercentage: covPercentage
        }
      }
    }

    case UpdateTypes.REMOVE_ALL_MAPPINGS: {
      return {}
    }

    default: {
      throw Error(`Unexpected action type in MappingsContext reducer: '${type}'.`)
    }
  }
}

function init() {
  const defaultMappingState = {} as MappingsState

  try {
    const windowItem = window.localStorage.getItem(SOLBOLT_MAPPINGS)
    if (windowItem) {
      const parsed = JSON.parse(windowItem)
      return { ...defaultMappingState, ...parsed }
    } 
    return defaultMappingState
  } catch {
    return defaultMappingState
  }
}

export default function Provider({ children }: {children: any}) {
  const [state, dispatch] = useReducer(reducer, undefined, init)

  const updateMapping = useCallback((contract, key, evmMap) => {
    dispatch({ type: UpdateTypes.UPDATE_MAPPING, payload: { contract, key, evmMap } as Payload })
  }, [])

  const updateAllMappings = useCallback((contract, allMaps, filteredLines, hasSymExec, covPercentage) => {
    dispatch({ type: UpdateTypes.UPDATE_ALL_MAPPINGS, payload: { contract, allMaps, filteredLines, hasSymExec, covPercentage } as Payload }  )
  }, [])

  const removeAllMappings = useCallback(() => {
    dispatch({ type: UpdateTypes.REMOVE_ALL_MAPPINGS, payload: undefined }  )
  }, [])

  return (
    <MappingsContext.Provider
      value={useMemo(() => [state, { updateMapping, updateAllMappings, removeAllMappings }], [
        state,
        updateMapping,
        updateAllMappings,
        removeAllMappings
      ])}
    >
      {children}
    </MappingsContext.Provider>
  )
}

export function Updater() {
  const [state, ] = useMappingsContext()

  useEffect(() => {
    window.localStorage.setItem(SOLBOLT_MAPPINGS, JSON.stringify({ ...state }))
  })

  return null
}

export function useUpdateMappings() {

  const [, { updateMapping }] = useMappingsContext()

  return useCallback(
      (contract: string, key: string, evmMap: string) => {
        if (
          updateMapping &&
          contract &&
          key &&
          evmMap
        ) {
          updateMapping(contract, key, evmMap)
        }
      },
      [updateMapping]
    )
}

export function useUpdateAllMappings() {

  const [, { updateAllMappings }] = useMappingsContext()

  return useCallback(
      (contract: string, allMaps: {[key: string]: EVMMap}, filteredLines: string, hasSymExec: boolean, covPercentage?: number) => {
        if (
          updateAllMappings &&
          contract &&
          allMaps &&
          filteredLines
        ) {
          updateAllMappings(contract, allMaps, filteredLines, hasSymExec, covPercentage)
        }
      },
      [updateAllMappings]
    )
}

export function useRemoveAllMappings() {

  const [, { removeAllMappings }] = useMappingsContext()

  return useCallback(
      () => {
        if (removeAllMappings) {
          removeAllMappings()
        }
      },
      [removeAllMappings]
    )
}


export function useMappings(contract: string | undefined) {
  const [state] = useMappingsContext();

  if (contract == null) {
    return undefined
  }

  return safeAccess(state, [contract]) as ContractMappings
}

export function useMappedContractNames() {
  const [state] = useMappingsContext();

  if (state == null) {
    return []
  }

  return Object.keys(state)
}

export function useMappingsByIndex(index: number) {
  const [state] = useMappingsContext();

  let contractName = undefined
  let contractMappings = {}

  if (state != null) {
    if (index < Object.keys(state).length) {
      contractName = Object.keys(state)[index]
      contractMappings = safeAccess(state, [contractName])
    }
  }

  return [contractName, contractMappings] as [string | undefined, ContractMappings]
}
