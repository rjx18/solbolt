import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'
import { OUTPUT_FILE_NAME } from '../constants'
import { ContractJSON, EVMMap, Source, SOURCE_FILENAME, SOURCE_MODEL, SOURCE_VIEW_STATE } from '../types'

import { safeAccess } from '../utils'

export enum UpdateTypes {
  UPDATE_ALL_SOURCES = 'UPDATE_ALL_SOURCES',
  UPDATE_SOURCE = 'UPDATE_SOURCE',
  REMOVE_SOURCE = 'REMOVE_SOURCE'
}

const SOURCES = 'sources'
const AST = 'ast'
const HASH = 'hash'
const ERRORS = 'errors'
const ID = 'id'

export type SourcesUpdateAction = {type: UpdateTypes.UPDATE_ALL_SOURCES} | {type: UpdateTypes.UPDATE_SOURCE} | {type: UpdateTypes.REMOVE_SOURCE}

export interface SourcesState {
  [SOURCES]: Source[]
}

export interface Payload {
  index: number;
  source?: Source;
}

export interface Payload {
  sources: Source[];
}

const SourcesContext = createContext<
  [SourcesState | undefined, {
    updateAllSources: ((sources: Source[]) => void) | undefined,
    updateSource: ((index: number, source: Source) => void) | undefined, 
    removeSource: ((index: number) => void) | undefined
  }]>([undefined, {updateAllSources: undefined, updateSource: undefined, removeSource: undefined}]);

export function useSourcesContext() {
  return useContext(SourcesContext)
}

function reducer(state: SourcesState, { type, payload }: { type: UpdateTypes, payload: Payload | undefined}) {
  switch (type) {
    case UpdateTypes.UPDATE_ALL_SOURCES: {
      if (!payload) {
        throw Error(`Payload is undefined or null!`)
      }
      const { sources } = payload

      if (!sources || sources.length === 0) {
        throw Error(`Source is undefined or empty!`)
      }

      return {
        ...state,
        [SOURCES]: [
          ...sources
        ]
      }
    }

    case UpdateTypes.UPDATE_SOURCE: {
      if (!payload) {
        throw Error(`Payload is undefined or null!`)
      }
      const { index, source } = payload

      if (!source) {
        throw Error(`Source is undefined or null!`)
      }

      let newSources = [...state[SOURCES]]

      newSources[index] = source

      return {
        ...state,
        [SOURCES]: [
          ...newSources
        ]
      }
    }

    case UpdateTypes.REMOVE_SOURCE: {
      if (!payload) {
        throw Error(`Payload is undefined or null!`)
      }

      const { index } = payload

      let newSources = [...state[SOURCES]]

      newSources.splice(index, 1)

      return {
        ...state,
        [SOURCES]: [
          ...newSources
        ]
      }
    }

    default: {
      throw Error(`Unexpected action type in ContractsContext reducer: '${type}'.`)
    }
  }
}

export default function Provider({ children }: {children: any}) {
  const [state, dispatch] = useReducer(reducer, {
    [SOURCES]: [],
  } as SourcesState)

  const updateAllSources = useCallback((sources) => {
    dispatch({ type: UpdateTypes.UPDATE_ALL_SOURCES, payload: { sources } as Payload })
  }, [])

  const updateSource = useCallback((index, source) => {
    dispatch({ type: UpdateTypes.UPDATE_SOURCE, payload: { index, source } as Payload })
  }, [])

  const removeSource = useCallback((index) => {
    dispatch({ type: UpdateTypes.REMOVE_SOURCE, payload: { index } as Payload }  )
  }, [])

  return (
    <SourcesContext.Provider
      value={useMemo(() => [state, { updateAllSources, updateSource, removeSource }], [
        state,
        updateSource,
        removeSource
      ])}
    >
      {children}
    </SourcesContext.Provider>
  )
}

export function useSourceManager() {

  const [state, { updateAllSources, updateSource, removeSource }] = useSourcesContext()

  const sources = safeAccess(state, [SOURCES]) as Source[]

  const _updateAllSources = useCallback(
    (newSources) => {
      if (updateAllSources && newSources) {
        updateAllSources(newSources)
      }
    },
    [updateAllSources]
  )

  const _updateSource = useCallback(
    (index, source) => {
      if (updateSource && index != null && source) {
        updateSource(index, source)
      }
    },
    [updateSource]
  )

  const _removeSource = useCallback(
    (index) => {
      if (removeSource && index != null) {
        removeSource(index)
      }
    },
    [removeSource]
  )

  return [
    sources, {updateAllSources: _updateAllSources, updateSource: _updateSource, removeSource: _removeSource}, 
  ] as [Source[], {
    updateAllSources: ((sources: Source[]) => void), 
    updateSource: ((index: number, source: Source) => void), 
    removeSource: ((index: number) => void)
  }]
}
