const express = require('express');
const sequelize = require('./config/sequelize'); // conexiunea

const Student = require('./models/student');     // modele
const Profesor = require('./models/profesor');

//routere
const studentRouter = require('./routes/studentRouter'); 
const profesorRouter = require('./routes/profesorRouter');
const cerereRouter = require('./routes/cerereRouter');


const app = express();
const port = 3000;

// Middlewares
app.use(express.json());  // pentru a putea primi JSON in body

// Rutele
app.use('/api', studentRouter);
app.use('/api', profesorRouter);
app.use(express.urlencoded({extended: true}))
app.use('/api', cerereRouter);
// Servim fisiere din /uploads, public la /uploads
app.use('/uploads', express.static('uploads'));

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
        { firstName: 'Kevin', lastName: 'Boros', email: 'kevinboros22@gmail.com' },
        { firstName: 'Marius', lastName: 'Bica', email: 'completeazaMailulTauAiciMarius@gmail.com' },
        { firstName: 'Rămurel', lastName: 'Pastramă', email: 'ramurel@example.com' },
        { firstName: 'Alexandru', lastName: 'Averescu', email: 'alexandru@example.com' },
        { firstName: 'Andreea', lastName: 'Esca', email: 'andreea@example.com' },
        { firstName: 'Călin', lastName: 'Georgescu', email: 'calin@example.com' },
        { firstName: 'Elena', lastName: 'Lasconi', email: 'elena@example.com' },
        { firstName: 'Decebal', lastName: 'Diurpaneus', email: 'decebal@example.com' }
      ]);
      console.log('Sample students created.');
    } else {
      console.log('Students already exist in the DB.');
    }

    const countProfs = await Profesor.count();
    if (countProfs === 0) {
      await Profesor.bulkCreate([
        { firstName: 'Marian', lastName: 'Marin', email: 'marian@xyz.com', maxStudents: 4 },
        { firstName: 'Camelia', lastName: 'Bratianu', email: 'camelia@xyz.com', maxStudents: 3 },
        { firstName: 'Nicolae', lastName: 'Iorga', email: 'nicolae@xyz.com', maxStudents: 5 }

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
