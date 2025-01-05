//server/routes/profesorRouter.js

const router = require('express').Router();
const Profesor = require('../models/profesor');
const { Op } = require('sequelize');

// Endpoint principal: /api/profesors
router.route('/professors')
  // GET /api/profesors => lista de profesori
  .get(async (req, res) => {
    try {
      const profesors = await Profesor.findAll();
      res.json(profesors);
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve professors', details: err });
    }
  })
  // POST /api/profesors => cream un profesor nou
  .post(async (req, res) => {
    try {
      const profesor = await Profesor.create(req.body);
      res.status(201).json(profesor);
    } catch (err) {
      res.status(400).json({ error: 'Failed to create professor', details: err });
    }
  });

// Endpoint: /api/profesors/:id
router.route('/professors/:id')
  // GET un profesor anume
  .get(async (req, res) => {
    try {
      const profesor = await Profesor.findByPk(req.params.id);
      if (profesor) {
        res.json(profesor);
      } else {
        res.sendStatus(404);
      }
    } catch (err) {
      res.status(500).json({ error: 'Failed to get professor', details: err });
    }
  })
  // PUT => actualizare
  .put(async (req, res) => {
    try {
      const profesor = await Profesor.findByPk(req.params.id);
      if (profesor) {
        await profesor.update(req.body);
        res.json(profesor);
      } else {
        res.sendStatus(404);
      }
    } catch (err) {
      res.status(500).json({ error: 'Failed to update professor', details: err });
    }
  })
  // DELETE => stergere
  .delete(async (req, res) => {
    try {
      const profesor = await Profesor.findByPk(req.params.id);
      if (profesor) {
        await profesor.destroy();
        res.json({ message: 'Professor deleted' });
      } else {
        res.sendStatus(404);
      }
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete professor', details: err });
    }
  });

// Export router
module.exports = router;
