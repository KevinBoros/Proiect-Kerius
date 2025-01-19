// server/clearall.js

const fs = require('fs');
const path = require('path');
const sequelize = require('./config/sequelize'); // conexiunea Sequelize

// Importăm modelele, care definesc tabelele
const Cerere = require('./models/cerere');
const Student = require('./models/student');
const Profesor = require('./models/profesor');

const clearDatabase = async () => {
  try {
    // 1) Șterge datele din tabele
    await Cerere.destroy({ where: {} });
    await Student.destroy({ where: {} });
    await Profesor.destroy({ where: {} });
    
    console.log('Toate datele au fost șterse cu succes din DB.');

    // 2) Șterge fișierele din folderul "uploads/"
    // Atenție la calea către folder!
    const uploadsFolder = path.join(__dirname, 'uploads');

    if (fs.existsSync(uploadsFolder)) {
      const files = fs.readdirSync(uploadsFolder); // listăm fișierele
      files.forEach(file => {
        const filePath = path.join(uploadsFolder, file);
        fs.unlinkSync(filePath); // ștergem fiecare fișier
      });
      console.log('Toate fișierele din folderul uploads/ au fost șterse.');
    } else {
      console.log('Folderul uploads/ nu există sau calea este incorectă.');
    }

  } catch (error) {
    console.error('Eroare la ștergerea datelor/fișierelor:', error);
  } finally {
    await sequelize.close(); // Închide conexiunea la DB
  }
};

// Apelăm funcția
clearDatabase();
