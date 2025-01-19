const express = require('express');
const cors = require('cors'); // <== import cors
const sequelize = require('./config/sequelize'); // conexiunea
const bcrypt = require('bcryptjs'); // import pentru bcryptjs

const Student = require('./models/student'); // modele
const Profesor = require('./models/profesor');

// routere
const studentRouter = require('./routes/studentRouter');
const profesorRouter = require('./routes/profesorRouter');
const cerereRouter = require('./routes/cerereRouter');
const authRouter = require('./routes/authRouter'); // Router pentru autentificare
const verifyToken = require('./middleware/authMiddleware'); // Middleware pentru autentificare

const app = express();
const port = 3001;

/* 
   1) Adaugă și inițializează cors înainte de rutele tale:
*/
app.use(cors());

// 2) Middleware pentru a parsa JSON în body
app.use(express.json());

// 3) Rute NEprotejate (register, login)
app.use('/api/auth', authRouter);

// 4) Rute protejate cu token (student/profesor/cereri)
app.use('/api', verifyToken, studentRouter);
app.use('/api', verifyToken, profesorRouter);
app.use('/api', verifyToken, cerereRouter);

// 5) Pentru a parsa form-data cu urlencoded
app.use(express.urlencoded({ extended: true }));

// 6) Servim fișierele din /uploads (dacă este cazul)
app.use('/uploads', express.static('uploads'));

// Sincronizare DB fără introducere automată de date
sequelize.sync({ alter: true })
  .then(async () => {
    console.log('All entities have been synchronized.');
    // Pornim serverul
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  })
  .catch(err => {
    console.error('Eroare la sincronizare:', err);
  });
