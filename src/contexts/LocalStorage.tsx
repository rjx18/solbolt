import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'
import { CompilerOptimizerDetails, CompilerSettings, COMPILER_CONSTANTOPTIMIZER, COMPILER_CSE, COMPILER_DEDUPLICATE, COMPILER_DETAILS, COMPILER_ENABLE, COMPILER_EVM, COMPILER_INLINER, COMPILER_JUMPDESTREMOVER, COMPILER_ORDERLITERALS, COMPILER_PEEPHOLE, COMPILER_RUNS, COMPILER_VIAIR, COMPILER_YUL, SymexecSettings, SYMEXEC_CALLDEPTH, SYMEXEC_LOOPBOUND, SYMEXEC_MAXDEPTH, SYMEXEC_STRATEGY, SYMEXEC_TX } from '../types'

import { safeAccess } from '../utils'

const SOLBOLT = 'SOLBOLT'

const COMPILER_SETTINGS = 'COMPILER_SETTINGS'
const SYMEXEC_SETTINGS = 'SYMEXEC_SETTINGS'
const CURRENT_VERSION = 2
const VERSION = 'VERSION'
const LAST_SAVED = 'LAST_SAVED'

export enum UpdateTypes {
  UPDATE_COMPILER_SETTINGS = 'UPDATE_COMPILER_SETTINGS',
  UPDATE_SYMEXEC_SETTINGS = 'UPDATE_SYMEXEC_SETTINGS',
}

export type LocalStorageUpdateAction = {type: UpdateTypes.UPDATE_COMPILER_SETTINGS} | {type: UpdateTypes.UPDATE_SYMEXEC_SETTINGS}

export interface LocalStorageState {
  [COMPILER_SETTINGS]: CompilerSettings;
  [SYMEXEC_SETTINGS]: SymexecSettings;
  [VERSION]: number;
}

export interface Payload {
  settings: any;
}

const LocalStorageContext = createContext<[LocalStorageState | undefined, 
                                              {
                                                updateCompilerSettings: ((settings: any) => void) | undefined, 
                                                updateSymexecSettings: ((settings: any) => void) | undefined, 
                                              }]>([undefined, 
                                                    {
                                                      updateCompilerSettings: undefined, 
                                                      updateSymexecSettings: undefined,
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

    default: {
      throw Error(`Unexpected action type in LocalStorageContext reducer: '${type}'.`)
    }
  }
}

function init() {
  const defaultLocalStorage = {
    [COMPILER_SETTINGS]: {
      [COMPILER_EVM]: 'berlin',
      [COMPILER_RUNS]: 200,
      [COMPILER_ENABLE]: true,
      [COMPILER_VIAIR]: false,
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
      [SYMEXEC_TX]: 2
    } as SymexecSettings,
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

  return (
    <LocalStorageContext.Provider
      value={useMemo(() => [state, { updateCompilerSettings, updateSymexecSettings }], [
        state,
        updateCompilerSettings,
        updateSymexecSettings
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