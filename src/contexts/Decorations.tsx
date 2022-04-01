import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'
import { ContractMappings, EVMMap, HighlightedClass, HighlightedSource } from '../types'

import { safeAccess } from '../utils'

export enum UpdateTypes {
  UPDATE_HIGHLIGHTED_CLASS = 'UPDATE_HIGHLIGHTED_CLASS',
  REMOVE_HIGHLIGHTED_CLASS = 'REMOVE_HIGHLIGHTED_CLASS',
}

export type DecorationsUpdateAction = {type: UpdateTypes.UPDATE_HIGHLIGHTED_CLASS} | {type: UpdateTypes.REMOVE_HIGHLIGHTED_CLASS}

const HIGHLIGHTED = "HIGHLIGHTED"

export interface DecorationsState {
  [HIGHLIGHTED]: HighlightedClass | undefined,
} // compiled mapping have hoverMessage, with type 'fn' and 'loop'

export interface Payload {
  className: string
  triggeredFrom: HighlightedSource
}


const DecorationsContext = createContext<
  [DecorationsState | undefined, {
    updateHighlightedClass: ((className: string, triggeredFrom: HighlightedSource) => void) | undefined, 
    removeHighlightedClass: (() => void) | undefined,
  }]>([undefined, {updateHighlightedClass: undefined, removeHighlightedClass: undefined}]);

export function useDecorationsContext() {
  return useContext(DecorationsContext)
}

function reducer(state: DecorationsState, { type, payload }: { type: UpdateTypes, payload: Payload | undefined}) {
  switch (type) {
    case UpdateTypes.UPDATE_HIGHLIGHTED_CLASS: {
      if (!payload) {
        throw Error(`Payload is undefined or null!`)
      }
      const { className, triggeredFrom } = payload
      return {
        ...state,
        [HIGHLIGHTED]: {
          className,
          triggeredFrom
        }
      }
    }

    case UpdateTypes.REMOVE_HIGHLIGHTED_CLASS: {
      return {
        ...state,
        [HIGHLIGHTED]: undefined
      }
    }

    default: {
      throw Error(`Unexpected action type in DecorationsContext reducer: '${type}'.`)
    }
  }
}

export default function Provider({ children }: {children: any}) {
  const [state, dispatch] = useReducer(reducer, {
    [HIGHLIGHTED]: undefined
  } as DecorationsState)

  const updateHighlightedClass = useCallback((className, triggeredFrom) => {
    dispatch({ type: UpdateTypes.UPDATE_HIGHLIGHTED_CLASS, payload: { className, triggeredFrom } as Payload })
  }, [])

  const removeHighlightedClass = useCallback(() => {
    dispatch({ type: UpdateTypes.REMOVE_HIGHLIGHTED_CLASS, payload: undefined }  )
  }, [])

  return (
    <DecorationsContext.Provider
      value={useMemo(() => [state, { updateHighlightedClass, removeHighlightedClass }], [
        state,
        updateHighlightedClass,
        removeHighlightedClass,
      ])}
    >
      {children}
    </DecorationsContext.Provider>
  )
}

export function useUpdateHiglightedClass() {

  const [, { updateHighlightedClass }] = useDecorationsContext()

  return useCallback(
      (className: string, triggeredFrom: HighlightedSource) => {
        if (
          updateHighlightedClass &&
          className != null &&
          triggeredFrom != null
        ) {
          updateHighlightedClass(className, triggeredFrom)
        }
      },
      [updateHighlightedClass]
    )
}

export function useRemoveHiglightedClass() {

  const [, { removeHighlightedClass }] = useDecorationsContext()

  return useCallback(
      () => {
        if (
          removeHighlightedClass
        ) {
          removeHighlightedClass()
        }
      },
      [removeHighlightedClass]
    )
}

export function useHighlightedClass() {
  const [state] = useDecorationsContext();

  return safeAccess(state, [HIGHLIGHTED]) as HighlightedClass
}
