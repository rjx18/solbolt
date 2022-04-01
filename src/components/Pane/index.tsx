import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Editor from "@monaco-editor/react";
import { getGasClass } from '../../utils';
import { EVMMap, HighlightedClass, HighlightedSource } from '../../types';
import { NUM_FRAGMENT_CLASSES } from '../../constants';

interface PaneProps {
  mappings?: {[key: string]: EVMMap};
  content: string;
  readOnly?: boolean;
  source: HighlightedSource;
  contract?: string;
  language: string;
  height: string;
  highlightedClass: HighlightedClass;
  handleMouseHover: (key: string) => void;
}

const Pane = forwardRef((props: PaneProps, ref: any) => {
  const {mappings, content, readOnly, source, contract, language, height, highlightedClass, handleMouseHover} = props

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


  function handleEditorDidMount(editor: any, monaco: any) {
    editorRef.current = editor; 
    monacoRef.current = monaco;

    decorationsRef.current = undefined;
    mouseHandlerRef.current = undefined;
  }

  const handleMouseMove = (event: any) => {
    if (event.target.position && mappings) {
      const {column, lineNumber} = event.target.position;
      
      const mappingKeysSorted = Object.keys(mappings).map((k) => {return {key: k, length: mappings[k].sourceMap.length}})

      mappingKeysSorted.sort((firstEl, secondEl) => { return firstEl.length - secondEl.length })

      for (const mappingKey of mappingKeysSorted) {
        const mappingItem = mappings[mappingKey.key]

        if (!isCompiled) {
          if (
            (mappingItem.sourceMap.startLine !== mappingItem.sourceMap.endLine && mappingItem.sourceMap.startLine <= lineNumber && mappingItem.sourceMap.endLine >= lineNumber) || 
            (mappingItem.sourceMap.startLine === mappingItem.sourceMap.endLine && mappingItem.sourceMap.startLine === lineNumber && mappingItem.sourceMap.startChar <= column && mappingItem.sourceMap.endChar >= column)
          ) {
            if (!highlightedClass || mappingKey.key !== highlightedClass.className) {
              console.log(`triggered mouse over source for ${mappingKey.key}`)
              handleMouseHover(mappingKey.key)
            }
            return;
          }
        } else {
          for (const compiledFragment of mappingItem.compiledMaps) {
            if (
              (compiledFragment.startLine <= lineNumber && compiledFragment.endLine >= lineNumber)
            ) {
              if (!highlightedClass || mappingKey.key !== highlightedClass.className) {
                console.log(`triggered mouse over source for ${mappingKey.key}`)
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
  }, [mappings, highlightedClass]);
  

  useEffect(() => {
    if (editorRef.current && monacoRef.current && mappings) {

      console.log('updating mappings for source ' + (source === HighlightedSource.SOURCE ? 'SOURCE' : 'COMPILED') + ' and contract: ' + contract)

      if (highlightedClass) {
        if (!isCompiled && highlightedClass.triggeredFrom === HighlightedSource.COMPILE) {
          editorRef.current.revealLineInCenterIfOutsideViewport(mappings[highlightedClass.className].sourceMap.startLine);
        } else if (isCompiled && highlightedClass.triggeredFrom === HighlightedSource.SOURCE) {
          editorRef.current.revealLineInCenterIfOutsideViewport(mappings[highlightedClass.className].compiledMaps[0].startLine);
        }
      }

      const deltaDecorations = [] as any[]

      const mappingKeysSorted = Object.keys(mappings).map((k) => {return {key: k, length: mappings[k].sourceMap.length}})

      mappingKeysSorted.sort((firstEl, secondEl) => { return secondEl.length - firstEl.length }) // sort by length descending, so we can mark the largest regions first

      let currClassCount = 0

      for (const mappingKey of mappingKeysSorted) {
        const mappingItem = mappings[mappingKey.key]
        const isHighlighted = highlightedClass && highlightedClass.className === mappingKey.key

        if (!isCompiled) {
          const wholeLine = mappingItem.sourceMap.startLine !== mappingItem.sourceMap.endLine

          const colorGasClass = mappingItem.gasMap ? getGasClass(mappingItem.gasMap.meanWcGas) : `frag-color-${currClassCount % NUM_FRAGMENT_CLASSES}`

          const colorClass = isHighlighted ? 'frag-highlighted' : colorGasClass

          const currDecoration = {
            range: new monacoRef.current.Range(mappingItem.sourceMap.startLine, mappingItem.sourceMap.startChar, mappingItem.sourceMap.endLine, mappingItem.sourceMap.endChar),
			      options: { 
              isWholeLine: wholeLine,
              ...(wholeLine ? {className: colorClass} : {inlineClassName: colorClass}),
              ...(isHighlighted && {linesDecorationsClassName: 'frag-highlighted-margin'}),
            }
          }

          deltaDecorations.push(currDecoration)
        } else {
          const colorGasClass = mappingItem.gasMap ? getGasClass(mappingItem.gasMap.meanWcGas) : `frag-color-${currClassCount % NUM_FRAGMENT_CLASSES}`

          const colorClass = isHighlighted ? 'frag-highlighted' : colorGasClass

          for (const compiledFragment of mappingItem.compiledMaps) {
            const currDecoration = {
              range: new monacoRef.current.Range(compiledFragment.startLine, compiledFragment.startChar, compiledFragment.endLine, compiledFragment.endChar),
              options: { 
                isWholeLine: true,
                className: colorClass,
                ...(isHighlighted && {linesDecorationsClassName: 'frag-highlighted-margin'})
              }
            }

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
  }, [mappings, highlightedClass]);

  return <Editor
    defaultLanguage={language}
    value={content}
    height={height}
    onMount={handleEditorDidMount}
    options={{
      readOnly: readOnly,
    }}
/>;
})

export default Pane;
