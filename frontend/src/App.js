import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Participant from './Participant'; 
import Admin from './Admin';

function App() {
  return (
    <Router>
      <Routes>
        {/* Main Experiment */}
        <Route path="/" element={<Participant />} />

        {/* Researcher Dashboard */}
        <Route path="/admin" element={<Admin />} />

        {/* Catch-all: If the URL is wrong, go back to the experiment */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;