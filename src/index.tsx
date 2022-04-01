import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

import ContractsContextProvider from './contexts/Contracts'
import MappingsContextProvider from './contexts/Mappings'
import DecorationsContextProvider from './contexts/Decorations'

function ContextProviders({ children }: { children: any }) {
  return (
    <ContractsContextProvider>
      <MappingsContextProvider>
        <DecorationsContextProvider>
          {children}
        </DecorationsContextProvider>
      </MappingsContextProvider>
    </ContractsContextProvider>
  )
}

ReactDOM.render(
  <ContextProviders>
    <App />
  </ContextProviders>,
  document.getElementById('root')
);

