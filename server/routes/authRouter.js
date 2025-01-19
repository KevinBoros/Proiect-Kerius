// server/routes/authRouter.js

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Student, Profesor } = require('../models');

const router = express.Router();

// **Alege o cheie secretă mai lungă și mai sigură în producție**
const SECRET_KEY = 'your_secret_key'; 

// ===========================================================================
// POST /api/auth/register - Înregistrare utilizator
// ===========================================================================
router.post('/register', async (req, res) => {
  const { email, password, role, firstName, lastName, maxStudents } = req.body;

  try {
    // Verificăm dacă email-ul există deja în Student sau Profesor
    const existingStudent = await Student.findOne({ where: { email } });
    const existingProfesor = await Profesor.findOne({ where: { email } });

    if (existingStudent || existingProfesor) {
      return res.status(400).json({ error: 'Email-ul este deja folosit.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Cazul: Student
    if (role === 'student') {
      const newStudent = await Student.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
      });
      return res.status(201).json({
        message: 'Student înregistrat cu succes!',
        student: newStudent
      });
    } 
    
    // Cazul: Profesor
    else if (role === 'profesor') {
      if (!maxStudents || maxStudents < 1 || maxStudents > 10) {
        return res
          .status(400)
          .json({ error: 'Nr locuri trebuie să fie între 1 și 10.' });
      }

      const newProfesor = await Profesor.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        maxStudents,
      });
      return res.status(201).json({
        message: 'Profesor înregistrat cu succes!',
        profesor: newProfesor
      });
    } 
    
    // Cazul: Rol invalid
    else {
      return res.status(400).json({ error: 'Rol invalid.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Eroare la înregistrare.' });
  }
});

// ===========================================================================
// POST /api/auth/login - Autentificare utilizator
// ===========================================================================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Încercăm să găsim utilizatorul în ambele modele (Student și Profesor)
    const student = await Student.findOne({ where: { email } });
    const profesor = await Profesor.findOne({ where: { email } });

    let user, role;
    if (student) {
      user = student;
      role = 'student';
    } else if (profesor) {
      user = profesor;
      role = 'profesor';
    } else {
      return res
        .status(401)
        .json({ error: 'Autentificare eșuată. Utilizator inexistent.' });
    }

    // Verificăm parola
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Autentificare eșuată. Parolă greșită.' });
    }

    // Generăm token JWT
    const token = jwt.sign(
      { id: user.id, role },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    // Returnăm token, rol și date de bază ale user-ului (ID, email, etc.)
    return res.json({
      message: 'Autentificare reușită.',
      token,
      role, 
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error('Eroare la login:', error);
    res.status(500).json({ error: 'Eroare la autentificare.' });
  }
});

module.exports = router;
