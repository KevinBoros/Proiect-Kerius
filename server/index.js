const express = require('express');
const sequelize = require('./config/sequelize'); // conexiunea

const Student = require('./models/student');     // modele
const Profesor = require('./models/profesor');

//routere
const studentRouter = require('./routes/studentRouter'); 
const profesorRouter = require('./routes/profesorRouter');

const app = express();
const port = 3000;

// Middlewares
app.use(express.json());  // pentru a putea primi JSON in body

// Rutele
app.use('/api', studentRouter);
app.use('/api', profesorRouter); 

// Sincronizare DB
sequelize.sync({ alter: true }) //asta va crea sau modifica tabelele pentru modelele definite
  .then(async () => {
    console.log('All entities have been synchronized');

    // (EXEMPLU) Populare DB cu date pentru TESTARE
    const count = await Student.count();
    if (count === 0) {
      await Student.bulkCreate([
        { firstName: 'Ion',   lastName: 'Popescu', email: 'ion@example.com' },
        { firstName: 'Maria', lastName: 'Ionescu', email: 'maria@example.com' },
      ]);
      console.log('Sample students created.');
    } else {
      console.log('Students already exist in the DB.');
    }

    const countProfs = await Profesor.count();
    if (countProfs === 0) {
      await Profesor.bulkCreate([
        { firstName: 'Marian', lastName: 'Marin', email: 'marian@xyz.com', maxStudents: 4 },
        { firstName: 'Camelia', lastName: 'Bratianu', email: 'camelia@xyz.com', maxStudents: 3 }
      ]);
      console.log('Sample professors created.');
    }

    // Pornim serverul
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });

  })
  .catch(err => {
    console.error('Eroare la sincronizare:', err);
  });
