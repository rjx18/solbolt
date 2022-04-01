export const DEFAULT_SOLIDITY_VALUE = `// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;
contract TestLoop {
    // mapping(uint256 => uint256) public mappingArray;
    string private storedString;

    constructor() {
        
    }

    function hiddenLoop(string calldata newString) external {
        storedString = newString;
    }
}
  ` // change this to use stored Source file later with a context

export const NUM_FRAGMENT_CLASSES = 12
export const OUTPUT_FILE_NAME = 'output.sol'
