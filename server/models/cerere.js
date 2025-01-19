// server/models/cerere.js
const sequelize = require('../config/sequelize');
const { DataTypes } = require('sequelize');

const Cerere = sequelize.define('Cerere', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  profesorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'resubmit', 'finalizat'),
    defaultValue: 'pending',
  },
  justificareRespins: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  originalFileName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  mimeType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // ADĂUGĂ câmpul pentru fișierul încărcat de profesor:
  profFilePath: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true, // Adaugă createdAt și updatedAt
});

module.exports = Cerere;
