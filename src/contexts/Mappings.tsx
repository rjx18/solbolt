import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'
import { EVMMap } from '../types'

import { safeAccess } from '../utils'

export enum UpdateTypes {
  UPDATE_MAPPING = 'UPDATE_MAPPING',
  UPDATE_ALL_MAPPINGS = 'UPDATE_ALL_MAPPINGS',
}

export type MappingsUpdateAction = {type: UpdateTypes.UPDATE_MAPPING} | {type: UpdateTypes.UPDATE_ALL_MAPPINGS}

export interface MappingsState {
  [contract: number]: {
    [key: string]: EVMMap
  };
} // compiled mapping have hoverMessage, with type 'fn' and 'loop'

export interface Payload {
  contract: number;
  key: string;
  evmMap: EVMMap
}

export interface Payload {
  contract: number;
  allMaps: {
    [key: string]: EVMMap
  };
}

const MappingsContext = createContext<
  [MappingsState | undefined, {
    updateMapping: ((contract: number, key: string, evmMap: string ) => void) | undefined, 
    updateAllMappings: ((contract: number, allMaps: {[key: string]: EVMMap}) => void) | undefined
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
          ...(safeAccess(state, [contract]) || {}),
          [key]: evmMap
        }
      }
    }

    case UpdateTypes.UPDATE_ALL_MAPPINGS: {
      if (!payload) {
        throw Error(`Payload is undefined or null!`)
      }
      const { contract, allMaps } = payload
      return {
        ...state,
        [contract]: {
          ...allMaps
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

  const updateAllMappings = useCallback((contract, allMaps) => {
    dispatch({ type: UpdateTypes.UPDATE_ALL_MAPPINGS, payload: { contract, allMaps } as Payload }  )
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

export function useEVMMaps(contract: number) {
  const [state] = useMappingsContext();

  return safeAccess(state, [contract])
}
