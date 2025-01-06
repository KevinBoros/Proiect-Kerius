
//cererile sunt modul prin care studentii si profesorii comunica
//odata trimise, ele pot fi actualizate in functie de reactia profesorului
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
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'resubmit'),
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
}, {
  timestamps: true, // Adauga `createdAt` și `updatedAt`
});

module.exports = Cerere;
