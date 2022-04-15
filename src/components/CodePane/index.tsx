import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Editor from "@monaco-editor/react";
import { getGasClass, isTargetInLineRange, sortMappingsByLength } from '../../utils';
import { EVMMap, HighlightedClass, HighlightedSource } from '../../types';
import { NUM_FRAGMENT_CLASSES } from '../../constants';
import { useToggleFreezeHoverManager, useToggleGasMetricsManager } from '../../contexts/Application';

interface CodePaneProps {
  mappings?: {[key: string]: EVMMap};
  content: string;
  readOnly?: boolean;
  source: HighlightedSource;
  contract?: string;
  language: string;
  height: string;
  highlightedClass: HighlightedClass;
  handleMouseHover: (key: string) => void;
  hasSymExec: boolean;
}

const CodePane = forwardRef((props: CodePaneProps, ref: any) => {
  const {mappings, content, readOnly, source, contract, language, height, highlightedClass, hasSymExec, handleMouseHover} = props

  useImperativeHandle(ref, () => ({
    getValue() {
      if (editorRef.current) {
        console.log(editorRef.current.getValue())
        return editorRef.current.getValue()
      }
      return ''
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

    // var bindFreeze = editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_Q, function() {
    //   toggleFreezeHover()
    // });
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
              handleMouseHover(mappingKey.key)
            }
            return;
          }
        } else {
          for (const compiledFragment of mappingItem.compiledMaps) {
            if (isTargetInLineRange(lineNumber, column, compiledFragment.startLine, compiledFragment.endLine)) {
              if (!isClassAlreadyHighlighted(highlightedClass, mappingKey.key)) {
                handleMouseHover(mappingKey.key)
              }
              return;
            }
          }
        }
      }
    }
  }

  useEffect(() => {
    if (editorRef.current) {
      if (mouseHandlerRef.current) {
        mouseHandlerRef.current.dispose()
      }
      mouseHandlerRef.current = editorRef.current.onMouseMove(handleMouseMove);
    }
  }, [mappings, highlightedClass, freezeHover]);
  

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

    if (mappingItem.loopGas != null || mappingItem.functionGas != null) {
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
          const loopMessage = `PC ${pc}: ${mappingItem.loopGas[pc]} gas units`
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
          value: `**Function gas estimate:** ${mappingItem.functionGas} gas units`
        }

        wholeLineDecoration.options.glyphMarginHoverMessage.push(functionGasDecoration)
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

    // const colorClass = isHighlighted ? 'frag-highlighted' : colorGasClass

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

  useEffect(() => {
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
      // mappingKeysSorted.reverse()

      let currClassCount = 0

      for (const mappingKey of mappingKeysSorted) {
        const mappingItem = mappings[mappingKey.key]
        const isHighlighted = highlightedClass && highlightedClass.className === mappingKey.key

        if (!isCompiled) {
          const [newDecorations, wholeLineDecorations] =  generateSourceDecorations(mappingItem, currClassCount, isHighlighted)
          deltaDecorations.push(newDecorations)
          if (wholeLineDecorations != null) {
            deltaDecorations.push(wholeLineDecorations)
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
  }, [mappings, highlightedClass, showGasMetrics]);

  return <Editor
    defaultLanguage={language}
    value={content}
    height={height}
    onMount={handleEditorDidMount}
    options={{
      readOnly: readOnly,
      glyphMargin: !readOnly
    }}
/>;
})

export default CodePane;
