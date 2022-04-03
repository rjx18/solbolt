import React from 'react';
import './App.css';
import Box from '@mui/material/Box'
import { styled, createTheme, ThemeProvider } from '@mui/system';
import { BrowserRouter as Router, Route, Navigate, Routes } from "react-router-dom";
import CompilerPage from './pages/CompilerPage';

const RootBox = styled(Box)(({ theme }) => ({
  // [theme.breakpoints.up('sm')]: {
  //   marginTop: 50
  // },
  // [theme.breakpoints.down('sm')]: {
  //   marginTop: 20
  // },
  width: '100%',
  height: '100vh',
  margin: 0,
  padding: 0,
  overflowY: 'hidden' // TODO: figure out where the extra vertical padding comes from
}));


function App() {
  return (
    <RootBox display="flex">
      <Router>
        <Routes>
          <Route path="/compile" element={<CompilerPage />} />
          <Route
              path="*"
              element={<Navigate to="/compile" />}
          />
        </Routes>
      </Router>
    </RootBox>
  );
}

export default App;
