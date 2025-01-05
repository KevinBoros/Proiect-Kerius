// server/studentRouter.js

//se definesc rutele REST -> folosim Student din student.js

const router = require('express').Router();
const Student = require('../models/student'); // importam modelul
const { Op } = require('sequelize');  // pentru operatorul "like" sau "greater than"

// /api/students
router.route('/students')
  .get(async (req, res) => {
    try {
      const students = await Student.findAll();
      res.json(students);
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve students', details: err });
    }
  })
  .post(async (req, res) => {
    try {
      const student = await Student.create(req.body);
      res.status(201).json(student);
    } catch (err) {
      res.status(400).json({ error: 'Failed to create student', details: err });
    }
  });

// /api/students/:id
router.route('/students/:id')
  .get(async (req, res) => {
    try {
      const student = await Student.findByPk(req.params.id);
      if (student) {
        res.json(student);
      } else {
        res.sendStatus(404); 
      }
    } catch (err) {
      res.status(500).json({ error: 'Failed to get student', details: err });
    }
  })
  .put(async (req, res) => {
    try {
      const student = await Student.findByPk(req.params.id);
      if (student) {
        await student.update(req.body);
        res.json(student);
      } else {
        res.sendStatus(404);
      }
    } catch (err) {
      res.status(500).json({ error: 'Failed to update student', details: err });
    }
  })
  .delete(async (req, res) => {
    try {
      const student = await Student.findByPk(req.params.id);
      if (student) {
        await student.destroy();
        res.json({ message: 'Student deleted' });
      } else {
        res.sendStatus(404);
      }
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete student', details: err });
    }
  });

module.exports = router;
