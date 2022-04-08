import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'

import { safeAccess } from '../utils'

const SETTINGS_TAB_OPEN = 'SETTINGS_TAB_OPEN'
const SHOW_GAS_METRICS = 'SHOW_GAS_METRICS'

export enum UpdateTypes {
  UPDATE_SETTINGS_TAB_OPEN = 'UPDATE_SETTINGS_TAB_OPEN',
  TOGGLE_SHOW_GAS_METRICS = 'TOGGLE_SHOW_GAS_METRICS',
}

export type ApplicationUpdateAction = {type: UpdateTypes.UPDATE_SETTINGS_TAB_OPEN} | {type: UpdateTypes.TOGGLE_SHOW_GAS_METRICS}

export interface ApplicationState {
  [SETTINGS_TAB_OPEN]: number;
  [SHOW_GAS_METRICS]: boolean;
}

export interface Payload {
  settingsTab: number;
}

const ApplicationContext = createContext<[ApplicationState | undefined, {
    updateSettingsTabOpen: ((settingsTab: number) => void) | undefined, 
    toggleShowGasMetrics: (() => void) | undefined
  }]>([undefined, {
    updateSettingsTabOpen: undefined, 
    toggleShowGasMetrics: undefined
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
      return { ...state, [SHOW_GAS_METRICS]: !state[SHOW_GAS_METRICS] }
    }

    default: {
      throw Error(`Unexpected action type in ApplicationContext reducer: '${type}'.`)
    }
  }
}

export default function Provider({ children }: {children: any}) {
  const [state, dispatch] = useReducer(reducer, {
    [SETTINGS_TAB_OPEN]: 0,
    [SHOW_GAS_METRICS]: false
  })

  const updateSettingsTabOpen = useCallback((settingsTab) => {
    dispatch({ type: UpdateTypes.UPDATE_SETTINGS_TAB_OPEN, payload: { settingsTab } as Payload })
  }, [])

  const toggleShowGasMetrics = useCallback(() => {
    dispatch({ type: UpdateTypes.TOGGLE_SHOW_GAS_METRICS, payload: undefined }  )
  }, [])


  return (
    <ApplicationContext.Provider
      value={useMemo(() => [state, { updateSettingsTabOpen, toggleShowGasMetrics }], [
        state,
        updateSettingsTabOpen,
        toggleShowGasMetrics
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
      if (settingsTab && updateSettingsTabOpen) {
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
