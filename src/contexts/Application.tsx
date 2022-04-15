import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'

import { safeAccess } from '../utils'

const SETTINGS_TAB_OPEN = 'SETTINGS_TAB_OPEN'
const SHOW_GAS_METRICS = 'SHOW_GAS_METRICS'
const FREEZE_HOVER = 'FREEZE_HOVER'

export enum UpdateTypes {
  UPDATE_SETTINGS_TAB_OPEN = 'UPDATE_SETTINGS_TAB_OPEN',
  TOGGLE_SHOW_GAS_METRICS = 'TOGGLE_SHOW_GAS_METRICS',
  TOGGLE_FREEZE_HOVER = 'TOGGLE_FREEZE_HOVER'
}

export type ApplicationUpdateAction = {type: UpdateTypes.UPDATE_SETTINGS_TAB_OPEN} | {type: UpdateTypes.TOGGLE_SHOW_GAS_METRICS} | {type: UpdateTypes.TOGGLE_FREEZE_HOVER}

export interface ApplicationState {
  [SETTINGS_TAB_OPEN]: number;
  [SHOW_GAS_METRICS]: boolean;
  [FREEZE_HOVER]: boolean;
}

export interface Payload {
  settingsTab: number;
}

const ApplicationContext = createContext<[ApplicationState | undefined, {
    updateSettingsTabOpen: ((settingsTab: number) => void) | undefined, 
    toggleShowGasMetrics: (() => void) | undefined,
    toggleFreezeHover: (() => void) | undefined,
  }]>([undefined, {
    updateSettingsTabOpen: undefined, 
    toggleShowGasMetrics: undefined,
    toggleFreezeHover: undefined
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
      const { settingsTab } = payload
      return {
        ...state,
        [SETTINGS_TAB_OPEN]: settingsTab
      }
    }

    case UpdateTypes.TOGGLE_SHOW_GAS_METRICS: {
      return { ...state, [SHOW_GAS_METRICS]: !state[SHOW_GAS_METRICS] as boolean }
    }

    case UpdateTypes.TOGGLE_FREEZE_HOVER: {
      return { ...state, [FREEZE_HOVER]: !state[FREEZE_HOVER] as boolean }
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
    [FREEZE_HOVER]: false
  })

  const updateSettingsTabOpen = useCallback((settingsTab) => {
    dispatch({ type: UpdateTypes.UPDATE_SETTINGS_TAB_OPEN, payload: { settingsTab } as Payload })
  }, [])

  const toggleShowGasMetrics = useCallback(() => {
    dispatch({ type: UpdateTypes.TOGGLE_SHOW_GAS_METRICS, payload: undefined }  )
  }, [])

  const toggleFreezeHover = useCallback(() => {
    dispatch({ type: UpdateTypes.TOGGLE_FREEZE_HOVER, payload: undefined }  )
  }, [])



  return (
    <ApplicationContext.Provider
      value={useMemo(() => [state, { updateSettingsTabOpen, toggleShowGasMetrics, toggleFreezeHover }], [
        state,
        updateSettingsTabOpen,
        toggleShowGasMetrics,
        toggleFreezeHover
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