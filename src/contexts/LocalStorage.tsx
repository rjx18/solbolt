import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'
import { CompilerOptimizerDetails, CompilerSettings, COMPILER_CONSTANTOPTIMIZER, COMPILER_CSE, COMPILER_DEDUPLICATE, COMPILER_DETAILS, COMPILER_DETAILS_ENABLED, COMPILER_ENABLE, COMPILER_EVM, COMPILER_INLINER, COMPILER_JUMPDESTREMOVER, COMPILER_ORDERLITERALS, COMPILER_PEEPHOLE, COMPILER_RUNS, COMPILER_VERSION, COMPILER_VIAIR, COMPILER_YUL, Source, SourceContent, SymexecSettings, SYMEXEC_CALLDEPTH, SYMEXEC_ENABLE_ONCHAIN, SYMEXEC_LOOPBOUND, SYMEXEC_MAXDEPTH, SYMEXEC_ONCHAIN_ADDRESS, SYMEXEC_STRATEGY, SYMEXEC_TX } from '../types'

import { safeAccess } from '../utils'

const SOLBOLT = 'SOLBOLT'

const COMPILER_SETTINGS = 'COMPILER_SETTINGS'
const SYMEXEC_SETTINGS = 'SYMEXEC_SETTINGS'
const CURRENT_VERSION = 3
const VERSION = 'VERSION'
const LAST_SAVED = 'LAST_SAVED'
const SOURCES = 'sources'

export enum UpdateTypes {
  UPDATE_COMPILER_SETTINGS = 'UPDATE_COMPILER_SETTINGS',
  UPDATE_SYMEXEC_SETTINGS = 'UPDATE_SYMEXEC_SETTINGS',
  UPDATE_ALL_SOURCES = 'UPDATE_ALL_SOURCES',
  UPDATE_SOURCE = 'UPDATE_SOURCE',
  REMOVE_SOURCE = 'REMOVE_SOURCE'
}

export type LocalStorageUpdateAction = {type: UpdateTypes.UPDATE_COMPILER_SETTINGS} | {type: UpdateTypes.UPDATE_SYMEXEC_SETTINGS} | {type: UpdateTypes.UPDATE_ALL_SOURCES} | {type: UpdateTypes.UPDATE_SOURCE} | {type: UpdateTypes.REMOVE_SOURCE}

export interface LocalStorageState {
  [COMPILER_SETTINGS]: CompilerSettings;
  [SYMEXEC_SETTINGS]: SymexecSettings;
  [SOURCES]: SourceContent[]
  [VERSION]: number;
}

export interface Payload {
  settings: any;
}

export interface Payload {
  index: number;
  source?: SourceContent;
}

export interface Payload {
  sources: SourceContent[];
}

const LocalStorageContext = createContext<[LocalStorageState | undefined, 
                                              {
                                                updateCompilerSettings: ((settings: any) => void) | undefined, 
                                                updateSymexecSettings: ((settings: any) => void) | undefined, 
                                                updateAllSources: ((sources: SourceContent[]) => void) | undefined,
                                                updateSource: ((index: number, source: SourceContent) => void) | undefined, 
                                                removeSource: ((index: number) => void) | undefined
                                              }]>([undefined, 
                                                    {
                                                      updateCompilerSettings: undefined, 
                                                      updateSymexecSettings: undefined,
                                                      updateAllSources: undefined, 
                                                      updateSource: undefined, 
                                                      removeSource: undefined
                                                    }]);

export function useLocalStorageContext() {
  return useContext(LocalStorageContext)
}

function reducer(state: LocalStorageState, { type, payload }: { type: UpdateTypes, payload: Payload}) {
  switch (type) {
    case UpdateTypes.UPDATE_COMPILER_SETTINGS: {
      if (!payload) {
        throw Error(`Payload is undefined or null!`)
      }
      const { settings } = payload
      return {
        ...state,
        [COMPILER_SETTINGS]: {
          ...settings
        }
      }
    }

    case UpdateTypes.UPDATE_SYMEXEC_SETTINGS: {
      if (!payload) {
        throw Error(`Payload is undefined or null!`)
      }
      const { settings } = payload
      return {
        ...state,
        [SYMEXEC_SETTINGS]: {
          ...settings
        }
      }
    }

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
      throw Error(`Unexpected action type in LocalStorageContext reducer: '${type}'.`)
    }
  }
}

function init() {
  const defaultLocalStorage = {
    [COMPILER_SETTINGS]: {
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
    } as CompilerSettings,
    [SYMEXEC_SETTINGS]: {
      [SYMEXEC_MAXDEPTH]: 128,
      [SYMEXEC_CALLDEPTH]: 10,
      [SYMEXEC_STRATEGY]: 'bfs',
      [SYMEXEC_LOOPBOUND]: 10,
      [SYMEXEC_TX]: 2,
      [SYMEXEC_ENABLE_ONCHAIN]: false,
      [SYMEXEC_ONCHAIN_ADDRESS]: ""
    } as SymexecSettings,
    [SOURCES]: [] as SourceContent[],
    [VERSION]: CURRENT_VERSION
  }

  try {
    const windowItem = window.localStorage.getItem(SOLBOLT)
    if (windowItem) {
      const parsed = JSON.parse(windowItem)
      if (parsed[VERSION] !== CURRENT_VERSION) {
        // this is where we could run migration logic
        return { ...defaultLocalStorage}
      } else {
        return { ...defaultLocalStorage, ...parsed }
      }
    } 
    return defaultLocalStorage
  } catch {
    return defaultLocalStorage
  }
}


export default function Provider({ children }: {children: any}) {
  const [state, dispatch] = useReducer(reducer, undefined, init)

  const updateCompilerSettings = useCallback((settings) => {
    dispatch({ type: UpdateTypes.UPDATE_COMPILER_SETTINGS, payload: { settings } as Payload })
  }, [])

  const updateSymexecSettings = useCallback((settings) => {
    dispatch({ type: UpdateTypes.UPDATE_SYMEXEC_SETTINGS, payload: { settings } as Payload })
  }, [])

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
    <LocalStorageContext.Provider
      value={useMemo(() => [state, { updateCompilerSettings, updateSymexecSettings, updateAllSources, updateSource, removeSource }], [
        state,
        updateCompilerSettings,
        updateSymexecSettings,
        updateSource,
        removeSource
      ])}
    >
      {children}
    </LocalStorageContext.Provider>
  )
}

export function Updater() {
  const [state] = useLocalStorageContext()

  useEffect(() => {
    window.localStorage.setItem(SOLBOLT, JSON.stringify({ ...state, [LAST_SAVED]: Math.floor(Date.now() / 1000) }))
  })

  return null
}

export function useCompilerSettingsManager() {
  const [state, { updateCompilerSettings }] = useLocalStorageContext()

  const compilerSettings = safeAccess(state, [COMPILER_SETTINGS]) as CompilerSettings

  const _updateCompilerSettings = useCallback(
    settings => {
      if (settings && updateCompilerSettings) {
        updateCompilerSettings(settings)
      }
    },
    [updateCompilerSettings]
  )

  return [
    compilerSettings,_updateCompilerSettings, 
  ] as [CompilerSettings, (settings: any) => void ]
}

export function useSymexecSettingsManager() {
  const [state, { updateSymexecSettings }] = useLocalStorageContext()

  const symexecSettings = safeAccess(state, [SYMEXEC_SETTINGS]) as SymexecSettings

  const _updateSymexecSettings = useCallback(
    settings => {
      if (settings && updateSymexecSettings) {
        updateSymexecSettings(settings)
      }
    },
    [updateSymexecSettings]
  )

  return [
    symexecSettings, _updateSymexecSettings
  ] as [SymexecSettings, (settings: any) => void]
}

export function useSourceContentManager() {

  const [state, { updateAllSources, updateSource, removeSource }] = useLocalStorageContext()

  const sources = safeAccess(state, [SOURCES]) as SourceContent[]

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
    sources, {updateAllSourceContents: _updateAllSources, updateSourceContent: _updateSource, removeSourceContent: _removeSource}, 
  ] as [SourceContent[], {
    updateAllSourceContents: ((sources: SourceContent[]) => void), 
    updateSourceContent: ((index: number, source: SourceContent) => void), 
    removeSourceContent: ((index: number) => void)
  }]
}
