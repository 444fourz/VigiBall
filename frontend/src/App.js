import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './Home';
import Participant from './Participant'; 
import Admin from './Admin';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* Standard mode */}
        <Route path="/standard" element={<Participant />} />
        {/* Researcher test created mode */}
        <Route path="/test/:testId" element={<Participant />} />
        {/* Admin Console */}
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;