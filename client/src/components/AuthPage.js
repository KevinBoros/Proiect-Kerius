import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthStyle.css'; // Asigură-te că acest fișier există și include stilurile.

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [maxStudents, setMaxStudents] = useState('');

  const navigate = useNavigate();

  // Funcția pentru login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Eroare la autentificare");
      }

      const data = await response.json();
      console.log("Răspuns la login:", data);

      // Setăm token-ul în localStorage
      localStorage.setItem("token", data.token);

      // Dacă utilizatorul este profesor, salvăm și ID-ul
      if (data.role === "profesor") {
        localStorage.setItem("profesorId", data.user.id);
      }

      alert("Autentificare reușită!");
      navigate(data.role === "student" ? "/student-dashboard" : "/profesor-dashboard");
    } catch (error) {
      alert(error.message);
    }
  };

  // Funcția pentru register
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        email,
        password,
        role,
        firstName,
        lastName,
      };

      // Dacă rolul este profesor, adăugăm câmpul maxStudents
      if (role === 'profesor') {
        payload.maxStudents = parseInt(maxStudents, 10);
      }

      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Eroare la înregistrare');
      }

      await response.json();
      alert('Înregistrare reușită! Te poți autentifica acum.');
      setIsLogin(true);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>{isLogin ? 'Login Form' : 'Register Form'}</h2>
        <form onSubmit={isLogin ? handleLogin : handleRegister}>
          {/* Secțiunea pentru înregistrare */}
          {!isLogin && (
            <>
              <div className="input-group">
                <label>Nume:</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label>Prenume:</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
            </>
          )}
          {/* Email și parolă */}
          <div className="input-group">
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>Parola:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {/* Selectarea rolului pentru înregistrare */}
          {!isLogin && (
            <>
              <div className="input-group">
                <label>Rol:</label>
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="student">Student</option>
                  <option value="profesor">Profesor</option>
                </select>
              </div>
              {role === 'profesor' && (
                <div className="input-group">
                  <label>Nr locuri (max. studenți):</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={maxStudents}
                    onChange={(e) => setMaxStudents(e.target.value)}
                    placeholder="1-10"
                    required
                  />
                </div>
              )}
            </>
          )}
          <button type="submit" className="auth-button">{isLogin ? 'Login' : 'Register'}</button>
        </form>
        {/* Schimbare între Login și Register */}
        <p className="toggle-form">
          {isLogin ? (
            <>
              Nu ai cont?{' '}
              <button className="link-button" onClick={() => setIsLogin(false)}>Înregistrează-te</button>
            </>
          ) : (
            <>
              Ai deja cont?{' '}
              <button className="link-button" onClick={() => setIsLogin(true)}>Loghează-te</button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
