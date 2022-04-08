import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

import ContractsContextProvider from './contexts/Contracts'
import MappingsContextProvider from './contexts/Mappings'
import DecorationsContextProvider from './contexts/Decorations'
import LocalStorageContextProvider, { Updater as LocalStorageContextUpdater } from './contexts/LocalStorage'

function ContextProviders({ children }: { children: any }) {
  return (
    <LocalStorageContextProvider>
      <ContractsContextProvider>
        <MappingsContextProvider>
          <DecorationsContextProvider>
            {children}
          </DecorationsContextProvider>
        </MappingsContextProvider>
      </ContractsContextProvider>
    </LocalStorageContextProvider>
  )
}

function Updaters() {
  return (
    <>
      <LocalStorageContextUpdater />
    </>
  )
}

ReactDOM.render(
  <ContextProviders>
    <Updaters />
    <App />
  </ContextProviders>,
  document.getElementById('root')
);

