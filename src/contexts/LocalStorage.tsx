import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'
import { DEFAULT_COMPILER_SETTINGS, DEFAULT_SYMEXEC_SETTINGS } from '../constants'
import { CompilerOptimizerDetails, CompilerSettings, COMPILER_CONSTANTOPTIMIZER, COMPILER_CSE, COMPILER_DEDUPLICATE, COMPILER_DETAILS, COMPILER_DETAILS_ENABLED, COMPILER_ENABLE, COMPILER_EVM, COMPILER_INLINER, COMPILER_JUMPDESTREMOVER, COMPILER_ORDERLITERALS, COMPILER_PEEPHOLE, COMPILER_RUNS, COMPILER_VERSION, COMPILER_VIAIR, COMPILER_YUL, EVMSource, Source, SourceContent, SOURCE_FILENAME, SOURCE_LAST_SAVED_VALUE, SymexecSettings, SYMEXEC_CALLDEPTH, SYMEXEC_ENABLE_ONCHAIN, SYMEXEC_IGNORE_CONSTRAINTS, SYMEXEC_LOOPBOUND, SYMEXEC_MAXDEPTH, SYMEXEC_ONCHAIN_ADDRESS, SYMEXEC_STRATEGY, SYMEXEC_TX, TaskStatus } from '../types'

import { compileSourceRemoteStatus, hashString, parseCompiledJSON, parseLegacyEVMMappings, safeAccess } from '../utils'
import { useCompilerErrorManager } from './Application'
import { useUpdateAllContracts } from './Contracts'
import { useRemoveHiglightedClass } from './Decorations'
import { useRemoveAllMappings, useUpdateAllMappings } from './Mappings'

const SOLBOLT = 'SOLBOLT'

const COMPILER_SETTINGS = 'COMPILER_SETTINGS'
const SYMEXEC_SETTINGS = 'SYMEXEC_SETTINGS'
const CURRENT_VERSION = 2
const VERSION = 'VERSION'
const LAST_SAVED = 'LAST_SAVED'
const SOURCES = 'sources'
const COMPILER_TASK = 'COMPILER_TASK'
const COMPILED_SRC_HASH = 'COMPILED_SRC_HASH'
const SYMEXEC_TASK = 'SYMEXEC_TASK'
const SYMEXEC_CONTRACT = 'SYMEXEC_CONTRACT'

export enum UpdateTypes {
  UPDATE_COMPILER_SETTINGS = 'UPDATE_COMPILER_SETTINGS',
  UPDATE_SYMEXEC_SETTINGS = 'UPDATE_SYMEXEC_SETTINGS',
  UPDATE_ALL_SOURCES = 'UPDATE_ALL_SOURCES',
  UPDATE_SOURCE = 'UPDATE_SOURCE',
  REMOVE_SOURCE = 'REMOVE_SOURCE',
  UPDATE_COMPILER_TASK = 'UPDATE_COMPILER_TASK',
  UPDATE_SYMEXEC_TASK = 'UPDATE_SYMEXEC_TASK',
  UPDATE_COMPILED_SRC_HASH = 'UPDATE_COMPILED_HASH',
  UPDATE_SYMEXEC_CONTRACT = 'UPDATE_SYMEXEC_CONTRACT'
}

export type LocalStorageUpdateAction = {type: UpdateTypes.UPDATE_COMPILER_SETTINGS} | 
                                      {type: UpdateTypes.UPDATE_SYMEXEC_SETTINGS} | 
                                      {type: UpdateTypes.UPDATE_ALL_SOURCES} | 
                                      {type: UpdateTypes.UPDATE_COMPILER_TASK} |
                                      {type: UpdateTypes.UPDATE_SYMEXEC_TASK} |
                                      {type: UpdateTypes.UPDATE_SOURCE} | 
                                      {type: UpdateTypes.REMOVE_SOURCE} | 
                                      {type: UpdateTypes.UPDATE_COMPILED_SRC_HASH} |
                                      {type: UpdateTypes.UPDATE_SYMEXEC_CONTRACT}

export interface LocalStorageState {
  [COMPILER_SETTINGS]: CompilerSettings;
  [SYMEXEC_SETTINGS]: SymexecSettings;
  [SOURCES]: SourceContent[]
  [COMPILER_TASK]: TaskStatus | null;
  [SYMEXEC_TASK]: TaskStatus | null;
  [COMPILED_SRC_HASH]: {
    [contract: string]: number
  };
  [SYMEXEC_CONTRACT]: string | null
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

export interface Payload {
  taskStatus: TaskStatus | null;
}

export interface Payload {
  compiledSourceHash: {
    [contract: string]: number
  }
}

export interface Payload {
  symexecContract: string | null;
}

const LocalStorageContext = createContext<[LocalStorageState | undefined, 
                                              {
                                                updateCompilerSettings: ((settings: any) => void) | undefined, 
                                                updateSymexecSettings: ((settings: any) => void) | undefined, 
                                                updateAllSources: ((sources: SourceContent[]) => void) | undefined,
                                                updateSource: ((index: number, source: SourceContent) => void) | undefined, 
                                                removeSource: ((index: number) => void) | undefined,
                                                updateCompilerTask: ((taskStatus: TaskStatus | null) => void) | undefined,
                                                updateSymexecTask: ((taskStatus: TaskStatus | null) => void) | undefined,
                                                updateCompiledSourceHash: ((compiledSourceHash: {[contract: string]: number}) => void) | undefined,
                                                updateSymexecContract: ((symexecContract: string | null) => void) | undefined,
                                              }]>([undefined, 
                                                    {
                                                      updateCompilerSettings: undefined, 
                                                      updateSymexecSettings: undefined,
                                                      updateAllSources: undefined, 
                                                      updateSource: undefined, 
                                                      removeSource: undefined,
                                                      updateCompilerTask: undefined,
                                                      updateSymexecTask: undefined,
                                                      updateCompiledSourceHash: undefined,
                                                      updateSymexecContract: undefined
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

      console.log("Updated source!")

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

    case UpdateTypes.UPDATE_COMPILER_TASK: {
      if (!payload) {
        throw Error(`Payload is undefined or null!`)
      }

      const { taskStatus } = payload
      return {
        ...state,
        [COMPILER_TASK]: taskStatus
      }
    }

    case UpdateTypes.UPDATE_SYMEXEC_TASK: {
      if (!payload) {
        throw Error(`Payload is undefined or null!`)
      }

      const { taskStatus } = payload
      return {
        ...state,
        [SYMEXEC_TASK]: taskStatus
      }
    }

    case UpdateTypes.UPDATE_COMPILED_SRC_HASH: {
      if (!payload) {
        throw Error(`Payload is undefined or null!`)
      }

      const {compiledSourceHash} = payload
      return {
        ...state,
        [COMPILED_SRC_HASH]: compiledSourceHash
      }
    }

    case UpdateTypes.UPDATE_SYMEXEC_CONTRACT: {
      if (!payload) {
        throw Error(`Payload is undefined or null!`)
      }

      const { symexecContract } = payload
      return {
        ...state,
        [SYMEXEC_CONTRACT]: symexecContract
      }
    }

    default: {
      throw Error(`Unexpected action type in LocalStorageContext reducer: '${type}'.`)
    }
  }
}

function init() {
  const defaultLocalStorage = {
    [COMPILER_SETTINGS]: DEFAULT_COMPILER_SETTINGS,
    [SYMEXEC_SETTINGS]: DEFAULT_SYMEXEC_SETTINGS,
    [SOURCES]: [] as SourceContent[],
    [VERSION]: CURRENT_VERSION,
    [COMPILER_TASK]: null,
    [SYMEXEC_TASK]: null,
    [COMPILED_SRC_HASH]: {},
    [SYMEXEC_CONTRACT]: null
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

  const updateCompilerTask = useCallback((taskStatus) => {
    dispatch({ type: UpdateTypes.UPDATE_COMPILER_TASK, payload: { taskStatus } as Payload }  )
  }, [])

  const updateSymexecTask = useCallback((taskStatus) => {
    dispatch({ type: UpdateTypes.UPDATE_SYMEXEC_TASK, payload: { taskStatus } as Payload }  )
  }, [])

  const updateCompiledSourceHash = useCallback((compiledSourceHash) => {
    dispatch({ type: UpdateTypes.UPDATE_COMPILED_SRC_HASH, payload: { compiledSourceHash } as Payload }  )
  }, [])

  const updateSymexecContract = useCallback((symexecContract) => {
    dispatch({ type: UpdateTypes.UPDATE_SYMEXEC_CONTRACT, payload: { symexecContract } as Payload }  )
  }, [])

  return (
    <LocalStorageContext.Provider
      value={useMemo(() => [state, { updateCompilerSettings, updateSymexecSettings, updateAllSources, updateSource, removeSource, updateCompilerTask, updateSymexecTask, updateCompiledSourceHash, updateSymexecContract }], [
        state,
        updateCompilerSettings,
        updateSymexecSettings,
        updateSource,
        removeSource,
        updateCompilerTask,
        updateSymexecTask,
        updateCompiledSourceHash,
        updateSymexecContract
      ])}
    >
      {children}
    </LocalStorageContext.Provider>
  )
}

export function Updater() {
  const [state, ] = useLocalStorageContext()

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

export function useCompilerTaskManager() {
  const [state, {updateCompilerTask}] = useLocalStorageContext()

  const compilerTask = safeAccess(state, [COMPILER_TASK], null) as (TaskStatus | null)

  const _updateCompilerTask = useCallback(
    (taskStatus) => {
      if (updateCompilerTask) {
        updateCompilerTask(taskStatus)
      }
    },
    [updateCompilerTask]
  )

  return [compilerTask, _updateCompilerTask] as [(TaskStatus | null), ((taskStatus: TaskStatus | null) => void)]
}

export function useSymexecTaskManager() {
  const [state, {updateSymexecTask}] = useLocalStorageContext()

  const symexecTask = safeAccess(state, [SYMEXEC_TASK], null) as (TaskStatus | null)

  const _updateSymexecTask = useCallback(
    (taskStatus) => {
      if (updateSymexecTask) {
        updateSymexecTask(taskStatus)
      }
    }, 
    [updateSymexecTask]
  )

  return [symexecTask, _updateSymexecTask] as [(TaskStatus | null), ((taskStatus: TaskStatus | null) => void)]
}

export function useCompiledSourceHashManager() {
  const [state, {updateCompiledSourceHash}] = useLocalStorageContext()

  const compiledSourceHash = safeAccess(state, [COMPILED_SRC_HASH]) as {[contract: string]: number}

  const _updateCompiledSourceHash = useCallback(
    (newCompiledSourceHash) => {
      if (updateCompiledSourceHash) {
        updateCompiledSourceHash(newCompiledSourceHash)
      }
    }, 
    [updateCompiledSourceHash]
  )

  return [compiledSourceHash, _updateCompiledSourceHash] as [({[contract: string]: number}), ((compiledSourceHash: {[contract: string]: number}) => void)]
}

export function useSymexecContractManager() {
  const [state, {updateSymexecContract}] = useLocalStorageContext()

  const symexecContract = safeAccess(state, [SYMEXEC_CONTRACT], null) as (string | null)

  const _updateSymexecContract = useCallback(
    (newSymexecContract) => {
      if (updateSymexecContract) {
        updateSymexecContract(newSymexecContract)
      }
    }, 
    [updateSymexecContract]
  )

  return [symexecContract, _updateSymexecContract] as [(string | null), ((updateSymexecContract: string | null) => void)]
}