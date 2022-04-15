import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'
import { ContractMappings, EVMMap } from '../types'

import { safeAccess } from '../utils'

export enum UpdateTypes {
  UPDATE_MAPPING = 'UPDATE_MAPPING',
  UPDATE_ALL_MAPPINGS = 'UPDATE_ALL_MAPPINGS',
}

export type MappingsUpdateAction = {type: UpdateTypes.UPDATE_MAPPING} | {type: UpdateTypes.UPDATE_ALL_MAPPINGS}

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
}

const MappingsContext = createContext<
  [MappingsState | undefined, {
    updateMapping: ((contract: string, key: string, evmMap: string) => void) | undefined, 
    updateAllMappings: ((contract: string, allMaps: {[key: string]: EVMMap}, filteredLines: string, hasSymExec: boolean) => void) | undefined
  }]>([undefined, {updateMapping: undefined, updateAllMappings: undefined}]);

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
      const { contract, allMaps, filteredLines, hasSymExec } = payload
      return {
        ...state,
        [contract]: {
          mappings: {
            ...allMaps
          },
          filteredLines: filteredLines,
          hasSymExec: hasSymExec
        }
      }
    }

    default: {
      throw Error(`Unexpected action type in MappingsContext reducer: '${type}'.`)
    }
  }
}

export default function Provider({ children }: {children: any}) {
  const [state, dispatch] = useReducer(reducer, {} as MappingsState)

  const updateMapping = useCallback((contract, key, evmMap) => {
    dispatch({ type: UpdateTypes.UPDATE_MAPPING, payload: { contract, key, evmMap } as Payload })
  }, [])

  const updateAllMappings = useCallback((contract, allMaps, filteredLines, hasSymExec) => {
    dispatch({ type: UpdateTypes.UPDATE_ALL_MAPPINGS, payload: { contract, allMaps, filteredLines, hasSymExec } as Payload }  )
  }, [])

  return (
    <MappingsContext.Provider
      value={useMemo(() => [state, { updateMapping, updateAllMappings }], [
        state,
        updateMapping,
        updateAllMappings
      ])}
    >
      {children}
    </MappingsContext.Provider>
  )
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
      (contract: string, allMaps: {[key: string]: EVMMap}, filteredLines: string, hasSymExec: boolean) => {
        if (
          updateAllMappings &&
          contract &&
          allMaps &&
          filteredLines
        ) {
          updateAllMappings(contract, allMaps, filteredLines, hasSymExec)
        }
      },
      [updateAllMappings]
    )
}


// export function Updater() {
//   const [, { updateBlockNumber }] = useApplicationContext()

//   // update block number
//   useEffect(() => {
//     if (library && updateBlockNumber) {
//       let stale = false

//       const update = () => {
//         library
//           .getBlockNumber()
//           .then((blockNumber: number) => {
//             if (!stale) {
//               updateBlockNumber(chainId, blockNumber)
//             }
//           })
//           .catch(() => {
//             if (!stale) {
//               updateBlockNumber(chainId, null)
//             }
//           })
//       }

//       update()
//       library.on('block', update)

//       return () => {
//         stale = true
//         library.removeListener('block', update)
//       }
//     }
//   }, [chainId, library, updateBlockNumber])

//   return null
// }

export function useMappings(contract: string) {
  const [state] = useMappingsContext();

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

  let contractName, contractMappings

  if (state == null) {
    contractName = "UNKNOWN"
    contractMappings = {}
  } else {
    contractName = Object.keys(state)[index]
    contractMappings = safeAccess(state, [contractName])
  }

  return [contractName, contractMappings] as [string, ContractMappings]
}
