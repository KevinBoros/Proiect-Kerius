// server/student.js

//model de baza pentru student

const sequelize = require('../config/sequelize'); // importam conexiunea
const { DataTypes } = require('sequelize');

const Student = sequelize.define('Student', {
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
  }
}, {
  timestamps: false // nu vrem createdAt, updatedAt
});

module.exports = Student;
