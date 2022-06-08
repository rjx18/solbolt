import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Editor from "@monaco-editor/react";
import { getGasClass, isTargetInLineRange, sortMappingsByLength } from '../../utils';
import { EVMMap, HighlightedClass, HighlightedSource } from '../../types';
import { NUM_FRAGMENT_CLASSES } from '../../constants';
import { useToggleFreezeHoverManager, useToggleGasMetricsManager } from '../../contexts/Application';

interface CodePaneProps {
  mappings?: {[key: string]: EVMMap};
  defaultContent?: string;
  model?: any;
  viewState?: any;
  readOnly?: boolean;
  source: HighlightedSource;
  contract?: string;
  language?: string;
  height: string;
  highlightedClass: HighlightedClass;
  handleMouseHover: (key: string, source: number) => void;
  onMounted?: () => void;
  hasSymExec: boolean;
  solidityTab?: number
}

const CodePane = forwardRef((props: CodePaneProps, ref: any) => {
  const {mappings, defaultContent, readOnly, source, contract, language, height, highlightedClass, hasSymExec, handleMouseHover, onMounted, model, viewState, solidityTab} = props

  useImperativeHandle(ref, () => ({
    getValue() {
      if (editorRef.current) {
        return editorRef.current.getValue()
      }
      return ''
    },
    createModel(content: string) {
      return monacoRef.current.editor.createModel(content, "sol")
    },
    getViewState() {
      return editorRef.current.saveViewState()
    }
  })); 

  const editorRef = useRef<any>();
  const monacoRef = useRef<any>();

  const decorationsRef = useRef<any>();
  const mouseHandlerRef = useRef<any>();

  const isCompiled = source === HighlightedSource.COMPILE

  const [showGasMetrics, ] = useToggleGasMetricsManager()
  const [freezeHover, ] = useToggleFreezeHoverManager()

  function handleEditorDidMount(editor: any, monaco: any) {
    editorRef.current = editor; 
    monacoRef.current = monaco;

    decorationsRef.current = undefined;
    mouseHandlerRef.current = undefined;

    if (onMounted) {
      onMounted()
    }

    renderDecorations()
    generateMouseHandlers()
  }

  const isClassAlreadyHighlighted = (highlightedClass: HighlightedClass, currentClass: string) => {
    return highlightedClass !== null && highlightedClass.className === currentClass
  }

  const handleMouseMove = (event: any) => {
    if (event.target.position && mappings && !freezeHover) {
      const {column, lineNumber} = event.target.position;
      
      const mappingKeysSorted = sortMappingsByLength(mappings)
      mappingKeysSorted.reverse()

      for (const mappingKey of mappingKeysSorted) {
        const mappingItem = mappings[mappingKey.key]

        if (!isCompiled) {
          if (isTargetInLineRange(lineNumber, column, mappingItem.sourceMap.startLine, mappingItem.sourceMap.endLine, mappingItem.sourceMap.startChar, mappingItem.sourceMap.endChar)) {
            if (!isClassAlreadyHighlighted(highlightedClass, mappingKey.key)) {
              handleMouseHover(mappingKey.key, mappingItem.sourceMap.source)
            }
            return;
          }
        } else {
          for (const compiledFragment of mappingItem.compiledMaps) {
            if (isTargetInLineRange(lineNumber, column, compiledFragment.startLine, compiledFragment.endLine)) {
              if (!isClassAlreadyHighlighted(highlightedClass, mappingKey.key)) {
                handleMouseHover(mappingKey.key, mappingItem.sourceMap.source)
              }
              return;
            }
          }
        }
      }
    }
  }

  const generateMouseHandlers = () => {
    if (editorRef.current) {
      if (mouseHandlerRef.current) {
        mouseHandlerRef.current.dispose()
      }
      mouseHandlerRef.current = editorRef.current.onMouseMove(handleMouseMove);
    }
  }

  useEffect(() => {
    generateMouseHandlers()
  }, [mappings, highlightedClass, freezeHover, solidityTab]);
  
  useEffect(() => {
    if (model != null) {
      editorRef.current.setModel(model);
      if (viewState != null) {
        editorRef.current.restoreViewState(viewState);
      }
    }
  }, [model])
  

  const generateSourceDecorations = (mappingItem: EVMMap, currClassCount: number, isHighlighted: boolean) => {
    const wholeLine = mappingItem.sourceMap.startLine !== mappingItem.sourceMap.endLine

    let colorGasClass

    if (hasSymExec && showGasMetrics) {
      if (mappingItem.gasMap) {
        colorGasClass = mappingItem.gasMap.class
      } else {
        colorGasClass = 'frag-heatmap-null'
      }
    } else {
      colorGasClass = `frag-color-${currClassCount % NUM_FRAGMENT_CLASSES}`
    }

    const colorClass = isHighlighted ? 'frag-highlighted' : colorGasClass

    const currDecoration = {
      range: new monacoRef.current.Range(mappingItem.sourceMap.startLine, mappingItem.sourceMap.startChar, mappingItem.sourceMap.endLine, mappingItem.sourceMap.endChar),
      options: { 
        isWholeLine: wholeLine,
        ...(wholeLine ? {className: colorClass} : {inlineClassName: colorClass}),
        ...(isHighlighted && {linesDecorationsClassName: 'frag-highlighted-margin'}),
      }
    }

    let wholeLineDecoration = undefined

    if (mappingItem.loopGas != null || mappingItem.functionGas != null || mappingItem.detectedIssues != null) {
      wholeLineDecoration = { 
        range: new monacoRef.current.Range(mappingItem.sourceMap.startLine, 1, mappingItem.sourceMap.startLine, 1),
        options: { 
          isWholeLine: wholeLine,
          glyphMarginHoverMessage: []
        }
      } as any

      if (mappingItem.loopGas != null) {
        wholeLineDecoration.options.glyphMarginClassName = "fa-solid fa-arrow-rotate-left"

        let loopGasMessages = []

        for (const pc in mappingItem.loopGas) {
          const loopMessage = `PC ${pc}: ${mappingItem.loopGas[pc].gas.toFixed(2)} gas units${mappingItem.loopGas[pc].isHidden ? ", hidden" : ""}`
          loopGasMessages.push(loopMessage)
        }

        const loopGasDecoration = {
          value: `**Loop gas estimates:**\n\n${loopGasMessages.join('\n\n')}`
        }

        wholeLineDecoration.options.glyphMarginHoverMessage.push(loopGasDecoration)
      }
      
      if (mappingItem.functionGas != null) {
        wholeLineDecoration.options.glyphMarginClassName = "fa-solid fa-gas-pump"

        const functionGasDecoration = {
          value: `**Function gas estimate:** ${mappingItem.functionGas.toFixed(2)} gas units`
        }

        wholeLineDecoration.options.glyphMarginHoverMessage.push(functionGasDecoration)
      }

      if (mappingItem.detectedIssues != null) {
        wholeLineDecoration.options.glyphMarginClassName = "fa-solid fa-triangle-exclamation"

        for (const issue of mappingItem.detectedIssues) {
          switch (issue) {
            case "loop-mutation":
              const loopMutationDecoration = {
                value: `**Possible SSTORE or SLOAD within a loop**\n\nUnless this is a string or bytes operation, possibly able to refactor such that storage variable is updated once at the end of the loop`
              }
              wholeLineDecoration.options.glyphMarginHoverMessage.push(loopMutationDecoration)
              break
          }
        }
      }

      
    }
    return [currDecoration, wholeLineDecoration]
  }

  const generateCompilerDecorations = (mappingItem: EVMMap, currClassCount: number, isHighlighted: boolean) => {
    let colorGasClass

    if (hasSymExec && showGasMetrics) {
      if (mappingItem.gasMap) {
        colorGasClass = mappingItem.gasMap.class
      } else {
        colorGasClass = 'frag-heatmap-null'
      }
    } else {
      colorGasClass = `frag-color-${currClassCount % NUM_FRAGMENT_CLASSES}`
    }

    const generatedDeltaDecorations = [] as any[]

    for (const compiledFragment of mappingItem.compiledMaps) {
      const currDecoration = {
        range: new monacoRef.current.Range(compiledFragment.startLine, compiledFragment.startChar, compiledFragment.endLine, compiledFragment.endChar),
        options: { 
          isWholeLine: true,
          className: colorGasClass,
          ...(isHighlighted && {linesDecorationsClassName: 'frag-highlighted-margin'})
        }
      }

      generatedDeltaDecorations.push(currDecoration)
    }

    return generatedDeltaDecorations
  }

  const renderDecorations = () => {
    if (editorRef.current && monacoRef.current && mappings) {

      if (highlightedClass && mappings[highlightedClass.className]) {
        if (!isCompiled && highlightedClass.triggeredFrom === HighlightedSource.COMPILE) {
          editorRef.current.revealLineInCenterIfOutsideViewport(mappings[highlightedClass.className].sourceMap.startLine);
        } else if (isCompiled && highlightedClass.triggeredFrom === HighlightedSource.SOURCE) {
          editorRef.current.revealLineInCenterIfOutsideViewport(mappings[highlightedClass.className].compiledMaps[0].startLine);
        }
      }

      const deltaDecorations = [] as any[]

      const mappingKeysSorted = sortMappingsByLength(mappings) // sort by length descending, so we can mark the largest regions first

      let currClassCount = 0

      for (const mappingKey of mappingKeysSorted) {
        const mappingItem = mappings[mappingKey.key]
        const isHighlighted = highlightedClass && highlightedClass.className === mappingKey.key

        if (!isCompiled) {
          if (solidityTab != null && solidityTab === mappingItem.sourceMap.source) {
            const [newDecorations, wholeLineDecorations] =  generateSourceDecorations(mappingItem, currClassCount, isHighlighted)
            deltaDecorations.push(newDecorations)
            if (wholeLineDecorations != null) {
              deltaDecorations.push(wholeLineDecorations)
            }
          }
        } else {
          const newDeltaDecorations = generateCompilerDecorations(mappingItem, currClassCount, isHighlighted)

          for (const currDecoration of newDeltaDecorations) {
            deltaDecorations.push(currDecoration)
          }
        }

        currClassCount++;
      }

      const updatedDecorations = editorRef.current.deltaDecorations(
          decorationsRef.current || [],
          deltaDecorations
        );

      decorationsRef.current = updatedDecorations

    }
  }

  useEffect(() => {
    renderDecorations()
  }, [mappings, highlightedClass, showGasMetrics, solidityTab]);

  return <Editor
    defaultLanguage={language}
    value={defaultContent}
    height={height}
    onMount={handleEditorDidMount}
    options={{
      readOnly: readOnly,
      glyphMargin: !readOnly,
      automaticLayout: true
    }}
/>;
})

export default CodePane;
