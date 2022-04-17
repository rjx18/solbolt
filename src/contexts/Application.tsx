import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'

import { safeAccess } from '../utils'

const SETTINGS_TAB_OPEN = 'SETTINGS_TAB_OPEN'
const SHOW_GAS_METRICS = 'SHOW_GAS_METRICS'
const FREEZE_HOVER = 'FREEZE_HOVER'
const ASSEMBLY_TAB_OPEN = 'ASSEMBLY_TAB_OPEN'
const SOLIDITY_TAB_OPEN = 'SOLIDITY_TAB_OPEN'

export enum UpdateTypes {
  UPDATE_SETTINGS_TAB_OPEN = 'UPDATE_SETTINGS_TAB_OPEN',
  TOGGLE_SHOW_GAS_METRICS = 'TOGGLE_SHOW_GAS_METRICS',
  TOGGLE_FREEZE_HOVER = 'TOGGLE_FREEZE_HOVER',
  UPDATE_ASSEMBLY_TAB_OPEN = 'UPDATE_ASSEMBLY_TAB_OPEN',
  UPDATE_SOLIDITY_TAB_OPEN = 'UPDATE_SOLIDITY_TAB_OPEN'
}

export type ApplicationUpdateAction = {type: UpdateTypes.UPDATE_SETTINGS_TAB_OPEN} | 
          {type: UpdateTypes.TOGGLE_SHOW_GAS_METRICS} | 
          {type: UpdateTypes.TOGGLE_FREEZE_HOVER} |
          {type: UpdateTypes.UPDATE_ASSEMBLY_TAB_OPEN} | 
          {type: UpdateTypes.UPDATE_SOLIDITY_TAB_OPEN}

export interface ApplicationState {
  [SETTINGS_TAB_OPEN]: number;
  [SHOW_GAS_METRICS]: boolean;
  [FREEZE_HOVER]: boolean;
  [ASSEMBLY_TAB_OPEN]: number;
  [SOLIDITY_TAB_OPEN]: number;
}

export interface Payload {
  updatedTab: number;
}

const ApplicationContext = createContext<[ApplicationState | undefined, {
    updateSettingsTabOpen: ((updatedTab: number) => void) | undefined, 
    toggleShowGasMetrics: (() => void) | undefined,
    toggleFreezeHover: (() => void) | undefined,
    updateAssemblyTabOpen: ((updatedTab: number) => void) | undefined, 
    updateSolidityTabOpen: ((updatedTab: number) => void) | undefined, 
  }]>([undefined, {
    updateSettingsTabOpen: undefined, 
    toggleShowGasMetrics: undefined,
    toggleFreezeHover: undefined,
    updateAssemblyTabOpen: undefined,
    updateSolidityTabOpen: undefined
  }]);

export function useApplicationContext() {
  return useContext(ApplicationContext)
}

function reducer(state: ApplicationState, { type, payload }: { type: UpdateTypes, payload: Payload | undefined}) {
  switch (type) {
    case UpdateTypes.UPDATE_SETTINGS_TAB_OPEN: {
      if (!payload) {
        throw Error(`No settings tab included in payload!`)
      }
      const { updatedTab } = payload
      return {
        ...state,
        [SETTINGS_TAB_OPEN]: updatedTab
      }
    }

    case UpdateTypes.TOGGLE_SHOW_GAS_METRICS: {
      return { ...state, [SHOW_GAS_METRICS]: !state[SHOW_GAS_METRICS] as boolean }
    }

    case UpdateTypes.TOGGLE_FREEZE_HOVER: {
      return { ...state, [FREEZE_HOVER]: !state[FREEZE_HOVER] as boolean }
    }

    case UpdateTypes.UPDATE_ASSEMBLY_TAB_OPEN : {
      if (!payload) {
        throw Error(`No assembly tab included in payload!`)
      }
      const { updatedTab } = payload
      return {
        ...state,
        [ASSEMBLY_TAB_OPEN]: updatedTab
      }
    }

    case UpdateTypes.UPDATE_SOLIDITY_TAB_OPEN : {
      if (!payload) {
        throw Error(`No assembly tab included in payload!`)
      }
      const { updatedTab } = payload
      return {
        ...state,
        [SOLIDITY_TAB_OPEN]: updatedTab
      }
    }

    default: {
      throw Error(`Unexpected action type in ApplicationContext reducer: '${type}'.`)
    }
  }
}

export default function Provider({ children }: {children: any}) {
  const [state, dispatch] = useReducer(reducer, {
    [SETTINGS_TAB_OPEN]: 0,
    [SHOW_GAS_METRICS]: true,
    [FREEZE_HOVER]: false,
    [ASSEMBLY_TAB_OPEN]: 0,
    [SOLIDITY_TAB_OPEN]: 0
  })

  const updateSettingsTabOpen = useCallback((updatedTab) => {
    dispatch({ type: UpdateTypes.UPDATE_SETTINGS_TAB_OPEN, payload: { updatedTab } as Payload })
  }, [])

  const toggleShowGasMetrics = useCallback(() => {
    dispatch({ type: UpdateTypes.TOGGLE_SHOW_GAS_METRICS, payload: undefined }  )
  }, [])

  const toggleFreezeHover = useCallback(() => {
    dispatch({ type: UpdateTypes.TOGGLE_FREEZE_HOVER, payload: undefined }  )
  }, [])

  const updateAssemblyTabOpen = useCallback((updatedTab) => {
    dispatch({ type: UpdateTypes.UPDATE_ASSEMBLY_TAB_OPEN, payload: { updatedTab } as Payload })
  }, [])

  const updateSolidityTabOpen = useCallback((updatedTab) => {
    dispatch({ type: UpdateTypes.UPDATE_SOLIDITY_TAB_OPEN, payload: { updatedTab } as Payload })
  }, [])

  return (
    <ApplicationContext.Provider
      value={useMemo(() => [state, { updateSettingsTabOpen, toggleShowGasMetrics, toggleFreezeHover, updateAssemblyTabOpen, updateSolidityTabOpen }], [
        state,
        updateSettingsTabOpen,
        toggleShowGasMetrics,
        toggleFreezeHover,
        updateAssemblyTabOpen,
        updateSolidityTabOpen
      ])}
    >
      {children}
    </ApplicationContext.Provider>
  )
}

export function useSettingsTabOpenManager() {
  const [state, { updateSettingsTabOpen }] = useApplicationContext()

  const settingsTabOpen = safeAccess(state, [SETTINGS_TAB_OPEN]) as number

  const _updateSettingsTabOpen = useCallback(
    settingsTab => {
      if (settingsTab != null && updateSettingsTabOpen) {
        updateSettingsTabOpen(settingsTab)
      }
    },
    [updateSettingsTabOpen]
  )

  return [
    settingsTabOpen, _updateSettingsTabOpen, 
  ] as [number, (settingsTab: number) => void ]
}

export function useToggleGasMetricsManager() {
  const [state, { toggleShowGasMetrics }] = useApplicationContext()

  const showGasMetrics = safeAccess(state, [SHOW_GAS_METRICS]) as boolean

  const _toggleShowGasMetrics = useCallback(
    () => {
      if (toggleShowGasMetrics) {
        toggleShowGasMetrics()
      }
    },
    [toggleShowGasMetrics]
  )

  return [
    showGasMetrics, _toggleShowGasMetrics, 
  ] as [boolean, () => void ]
}


export function useToggleFreezeHoverManager() {
  const [state, { toggleFreezeHover }] = useApplicationContext()

  const freezeHover = safeAccess(state, [FREEZE_HOVER]) as boolean

  const _toggleFreezeHover = useCallback(
    () => {
      if (toggleFreezeHover) {
        toggleFreezeHover()
      }
    },
    [toggleFreezeHover]
  )

  return [
    freezeHover, _toggleFreezeHover, 
  ] as [boolean, () => void ]
}

export function useAssemblyTabOpenManager() {
  const [state, { updateAssemblyTabOpen }] = useApplicationContext()

  const assemblyTabOpen = safeAccess(state, [ASSEMBLY_TAB_OPEN]) as number

  const _updateAssemblyTabOpen = useCallback(
    assemblyTab => {
      if (assemblyTab != null && updateAssemblyTabOpen) {
        updateAssemblyTabOpen(assemblyTab)
      }
    },
    [updateAssemblyTabOpen]
  )

  return [
    assemblyTabOpen, _updateAssemblyTabOpen, 
  ] as [number, (assemblyTab: number) => void ]
}

export function useSolidityTabOpenManager() {
  const [state, { updateSolidityTabOpen }] = useApplicationContext()

  const solidityTabOpen = safeAccess(state, [SOLIDITY_TAB_OPEN]) as number

  const _updateSolidityTabOpen = useCallback(
    solidityTab => {
      if (solidityTab != null && updateSolidityTabOpen) {
        updateSolidityTabOpen(solidityTab)
      }
    },
    [updateSolidityTabOpen]
  )

  return [
    solidityTabOpen, _updateSolidityTabOpen, 
  ] as [number, (solidityTab: number) => void ]
}