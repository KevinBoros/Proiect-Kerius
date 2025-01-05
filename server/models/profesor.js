//server/models/profesor.js


//proprietatile pot fi oricand modificate, odata ce avansam mai mult in proiect
//la fel valabil si pentru student
const sequelize = require('../config/sequelize'); 
const { DataTypes } = require('sequelize');

const Profesor = sequelize.define('Profesor', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  firstName: {
    type: DataTypes.STRING,
    validate: {
      len: [2, 50],
      notEmpty: true
    }
  },
  lastName: {
    type: DataTypes.STRING,
    validate: {
      len: [2, 50],
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING,
    validate: {
      isEmail: true
    }
  },
  // Limita de studenti aprobati
  maxStudents: {
    type: DataTypes.INTEGER,
    defaultValue: 5,  // numar aleatoriu, poate fi modificat
    validate: {
      min: 1
    }
  }
}, {
  timestamps: false
});

module.exports = Profesor;
