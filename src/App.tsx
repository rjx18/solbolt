import React from 'react';
import './App.css';
import Box from '@mui/material/Box'
import { styled, createTheme, ThemeProvider } from '@mui/system';
import { BrowserRouter as Router, Route, Navigate, Routes } from "react-router-dom";
import CompilerPage from './pages/CompilerPage';

const RootBox = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '100vh',
  margin: 0,
  padding: 0,
  overflowY: 'hidden'
}));


function App() {
  return (
    <RootBox display="flex">
      <Router>
        <Routes>
          <Route path="/" element={<CompilerPage />} />
          <Route
              path="*"
              element={<Navigate to="/" />}
          />
        </Routes>
      </Router>
    </RootBox>
  );
}

export default App;
