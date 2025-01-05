// server/sequelize.js

const { Sequelize } = require('sequelize');

// Creăm instanta sequelize, spunandu-i sa foloseasca dialectul "sqlite"
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './sqlite/disertatie.db' // Baza de date în folderul "sqlite"
}); //fisierul nu exista initial, deci va fi creat

module.exports = sequelize;
