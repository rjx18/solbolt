export interface FragmentMap {
  startLine: number;
  startChar?: number;
  endLine: number;
  endChar?: number;
  sourceLines: number[];
  length: number;
  isLine: boolean;
}

export interface EVMMap {
  [key: string]: FragmentMap
}

const EVM_REGEX = /\s+\/\*\s+\"(?<Filename>[\w|\#|\.]+)\":(?<StartOffset>\d+):(?<EndOffset>\d+)\s+(?<Identifier>[\w|{]+)?./

export const parseEVMMappings = (sourceText: string, compiledEVM: string) => {
  // outputs a mapping of classes to lines
  
  const splitEVM = compiledEVM.split('\n')

  // let unknownFunctionJumpType = false

  const filteredLinesArray = []

  let currLineNumber = 1

  let currMap = undefined as undefined | FragmentMap

  const mappings = {} as EVMMap

  for (const ins of splitEVM) {
    if (EVM_REGEX.test(ins)) {
      const match = EVM_REGEX.exec(ins)
      if (match && match.groups) {
        console.log(match.groups.Filename)
        if (match.groups.Filename.indexOf('#utility.yul') !== -1) {
          currMap = undefined
          continue
        }

        const currKey = `${match.groups.StartOffset}:${match.groups.EndOffset}`
        
        if (match.groups.Identifier && match.groups.Identifier.indexOf("constructor") !== -1) {
          if (!(currKey in mappings)) {
            const [startLine, ] = getLineCharFromOffset(sourceText, parseInt(match.groups.StartOffset))
            const [endLine, ] = getLineCharFromOffset(sourceText, parseInt(match.groups.EndOffset))

            mappings[currKey] = {
              startLine: startLine,
              endLine: endLine,
              sourceLines: [],
              length: parseInt(match.groups.EndOffset) - parseInt(match.groups.StartOffset),
              isLine: true
            }
          }
          currMap = mappings[currKey]
          continue
        }

        switch(match.groups.Identifier) {
          case 'function':
            // unknownFunctionJumpType = true
          case '{':
          case 'if':
          case 'for':
          case 'while':
          case 'require':
            if (!(currKey in mappings)) {
              const [startLine, ] = getLineCharFromOffset(sourceText, parseInt(match.groups.StartOffset))
              const [endLine, ] = getLineCharFromOffset(sourceText, parseInt(match.groups.EndOffset))

              mappings[currKey] = {
                startLine: startLine,
                endLine: endLine,
                sourceLines: [],
                length: parseInt(match.groups.EndOffset) - parseInt(match.groups.StartOffset),
                isLine: true
              }
            }
            currMap = mappings[currKey]
            break;
          case 'contract':  // skip contracts
            break
          default:
              if (!(currKey in mappings)) {
                const [startLine, startChar] = getLineCharFromOffset(sourceText, parseInt(match.groups.StartOffset))
                const [endLine, endChar] = getLineCharFromOffset(sourceText, parseInt(match.groups.EndOffset))
  
                mappings[currKey] = {
                  startLine: startLine,
                  startChar: startChar,
                  endLine: endLine,
                  endChar: endChar,
                  sourceLines: [],
                  length: parseInt(match.groups.EndOffset) - parseInt(match.groups.StartOffset), // when marking, start with greatest lengths first
                  isLine: false
                }
              }
              currMap = mappings[currKey]
              break
        }
      }
    } else {
      filteredLinesArray.push(ins)

      if (currMap != undefined) {
        currMap.sourceLines.push(currLineNumber)
      }

      currLineNumber++
    }
  }

  const filteredLines = filteredLinesArray.join('\n')

  return {
    mappings,
    filteredLines
  }
}

export const getLineCharFromOffset = (sourceText: string, offset: number) => {
  const newlineRegex = RegExp('\n', 'g');

  let numLines = 0;

  const sourceTextSliced = sourceText.slice(0, offset)

  let finalLineOffset = 0;

  while ((newlineRegex.exec(sourceTextSliced)) !== null) {
    numLines++
    finalLineOffset = newlineRegex.lastIndex
  }
  
  const numChars = offset - finalLineOffset
  return [numLines, numChars]
}

export function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

