import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

import ContractsContextProvider, { Updater as ContractsContextUpdater } from './contexts/Contracts'
import MappingsContextProvider, { Updater as MappingsContextUpdater } from './contexts/Mappings'
import DecorationsContextProvider from './contexts/Decorations'
import LocalStorageContextProvider, { Updater as LocalStorageContextUpdater } from './contexts/LocalStorage'
import ApplicationContextProvider from './contexts/Application'
import SourcesContextProvider from './contexts/Sources'
import CompilationUpdater from './updaters/CompilationUpdater';
import SymexecUpdater from './updaters/SymexecUpdater';

function ContextProviders({ children }: { children: any }) {
  return (
    <ApplicationContextProvider>
      <SourcesContextProvider>
        <LocalStorageContextProvider>
          <ContractsContextProvider>
            <MappingsContextProvider>
              <DecorationsContextProvider>
                {children}
              </DecorationsContextProvider>
            </MappingsContextProvider>
          </ContractsContextProvider>
        </LocalStorageContextProvider>
      </SourcesContextProvider>
    </ApplicationContextProvider>
  )
}

function Updaters() {
  return (
    <>
      <LocalStorageContextUpdater />
      <CompilationUpdater />
      <MappingsContextUpdater />
      <SymexecUpdater />
      <ContractsContextUpdater />
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

