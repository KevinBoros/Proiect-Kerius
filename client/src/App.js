import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthPage from './components/AuthPage';
import StudentDashboard from './components/StudentDashboard';
import ProfesorDashboard from './components/ProfesorDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/profesor-dashboard" element={<ProfesorDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
