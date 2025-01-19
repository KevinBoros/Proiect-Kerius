// server/models/index.js

const Student = require('./student');
const Profesor = require('./profesor');
const Cerere = require('./cerere');

// Relația: un Student are mai multe Cereri
Student.hasMany(Cerere, { foreignKey: 'studentId' });

// Relația: un Profesor are mai multe Cereri
Profesor.hasMany(Cerere, { foreignKey: 'profesorId' });

// Iar o Cerere aparține (belongsTo) unui Student
Cerere.belongsTo(Student, { foreignKey: 'studentId' });

// O Cerere aparține (belongsTo) unui Profesor
Cerere.belongsTo(Profesor, { foreignKey: 'profesorId' });

// Exportă toate modelele
module.exports = {
  Student,
  Profesor,
  Cerere,
};

// Aceste linii permit lui Sequelize să facă join automat între tabele atunci când cerem include: [Student] sau include: [Profesor].