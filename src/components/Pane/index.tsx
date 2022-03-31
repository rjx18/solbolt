import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Editor from "@monaco-editor/react";
import { EVMMap, getGasClass } from '../../utils';

interface PaneProps {
  mappings?: EVMMap;
  content: string;
  readOnly?: boolean;
  isCompiled: boolean;
  language: string;
  height: string;
  highlightedClass?: any;
  handleMouseHover: (key: string) => void;
  // handleMountRef: (editorRef: any) => void // so the parent also has a reference to the editor
}

const NUM_LINE_CLASSES = 12

const Pane = forwardRef((props: PaneProps, ref: any) => {
  const {mappings, content, readOnly, isCompiled, language, height, highlightedClass, handleMouseHover} = props

  useImperativeHandle(ref, () => ({
    getValue() {
      if (editorRef.current) {
        console.log(editorRef.current.getValue())
        return editorRef.current.getValue()
      }
      return ''
    }
  })); 

  const [decorations, setDecorations] = useState(undefined as any)
  const [mouseMoveHandler, setMouseMoveHandler] = useState(undefined as any)

  const editorRef = useRef<any>();
  const monacoRef = useRef<any>();

  function handleEditorDidMount(editor: any, monaco: any) {
    editorRef.current = editor; 
    monacoRef.current = monaco;
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
            if (!highlightedClass || mappingKey.key !== highlightedClass.class) {
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
              if (!highlightedClass || mappingKey.key !== highlightedClass.class) {
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
      if (mouseMoveHandler) {
        mouseMoveHandler.dispose()
      }
      const newMouseHandler = editorRef.current.onMouseMove(handleMouseMove);
      setMouseMoveHandler(newMouseHandler)
    }
  }, [editorRef.current, mappings, highlightedClass]);
  

  useEffect(() => {
    if (editorRef.current && monacoRef.current && mappings) {

      console.log('updating mappings!')

      if (highlightedClass) {
        if (!isCompiled && highlightedClass.triggeredFrom === "compile") {
          editorRef.current.revealLineInCenterIfOutsideViewport(mappings[highlightedClass.class].sourceMap.startLine);
        } else if (isCompiled && highlightedClass.triggeredFrom === "source") {
          editorRef.current.revealLineInCenterIfOutsideViewport(mappings[highlightedClass.class].compiledMaps[0].startLine);
        }
      }

      const deltaDecorations = [] as any[]

      const mappingKeysSorted = Object.keys(mappings).map((k) => {return {key: k, length: mappings[k].sourceMap.length}})

      mappingKeysSorted.sort((firstEl, secondEl) => { return secondEl.length - firstEl.length }) // sort by length descending, so we can mark the largest regions first

      let currClassCount = 0

      for (const mappingKey of mappingKeysSorted) {
        const mappingItem = mappings[mappingKey.key]
        const isHighlighted = highlightedClass && highlightedClass.class === mappingKey.key

        if (!isCompiled) {
          const wholeLine = mappingItem.sourceMap.startLine !== mappingItem.sourceMap.endLine

          const colorGasClass = mappingItem.gasMap ? getGasClass(mappingItem.gasMap.meanWcGas) : `frag-color-${currClassCount % NUM_LINE_CLASSES}`

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
          const colorGasClass = mappingItem.gasMap ? getGasClass(mappingItem.gasMap.meanWcGas) : `frag-color-${currClassCount % NUM_LINE_CLASSES}`

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
          decorations || [],
          deltaDecorations
        );

      setDecorations(updatedDecorations)
    }
  }, [editorRef.current, monacoRef.current, mappings, highlightedClass]);

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
