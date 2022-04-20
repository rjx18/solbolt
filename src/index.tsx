import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

import ContractsContextProvider from './contexts/Contracts'
import MappingsContextProvider from './contexts/Mappings'
import DecorationsContextProvider from './contexts/Decorations'
import LocalStorageContextProvider, { Updater as LocalStorageContextUpdater } from './contexts/LocalStorage'
import ApplicationContextProvider from './contexts/Application'
import SourcesContextProvider from './contexts/Sources'

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

