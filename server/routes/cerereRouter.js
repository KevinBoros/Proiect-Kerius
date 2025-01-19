// server/routes/cerereRouter.js
const router = require('express').Router();
const { Student, Profesor, Cerere } = require('../models');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const verifyToken = require('../middleware/authMiddleware');

// Configurare multer: destinație și nume fișier
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // max 10 MB
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return cb(new Error('Tipul fișierului nu este permis (PDF, DOC, DOCX).'));
    }
    cb(null, true);
  }
});

// POST /api/cereri - Creare cerere
router.post('/cereri', verifyToken, async (req, res) => {
  try {
    const { profesorId } = req.body;
    // user-ul e student, id-ul se află în req.user.id
    const studentId = req.user.id;

    const profesor = await Profesor.findByPk(profesorId);
    if (!profesor) {
      return res.status(400).json({ error: 'Profesor inexistent' });
    }

    // 1) Verificăm dacă studentul are deja o cerere aprobată
    const cerereAprobata = await Cerere.findOne({
      where: { studentId, status: 'approved' }
    });
    if (cerereAprobata) {
      return res.status(400).json({
        error: 'Acest student este deja aprobat la un profesor.'
      });
    }

    // 2) Verificăm limita de studenți a profesorului
    const countApproved = await Cerere.count({
      where: {
        profesorId,
        status: {
          [Op.or]: ['approved', 'finalizat'], // Adăugat statusul "finalizat"
        },
      },
    });
    if (countApproved >= profesor.maxStudents) {
      return res.status(400).json({
        error: 'Profesorul a atins numărul maxim de studenți.',
      });
    }

    // 3) Creăm cererea cu status = 'pending'
    const cerere = await Cerere.create({
      studentId,
      profesorId,
      status: 'pending'
    });
    res.status(201).json(cerere);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Failed to create request' });
  }
});

// GET /api/cereri - Vizualizare generală (poate primi query studentId/profesorId)
router.get('/cereri', verifyToken, async (req, res) => {
  try {
    const { studentId, profesorId } = req.query;
    const where = {};
    if (studentId) where.studentId = studentId;
    if (profesorId) where.profesorId = profesorId;

    // Aici includem și modelul Student, pentru a putea afişa numele/prenumele
    const cereri = await Cerere.findAll({
      where,
      include: [
        {
          model: Student,
          attributes: ['firstName', 'lastName'] // câmpurile dorite din Student
        }
      ]
    });

    res.json(cereri);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve requests', details: err });
  }
});

/**
 * GET /api/cereri/me - Afișează ultima cerere a studentului curent
 */
router.get('/cereri/me', verifyToken, async (req, res) => {
  try {
    const studentId = req.user.id;
    // Poți folosi findOne + order, sau findAll dacă vrei mai multe cereri.
    const cerere = await Cerere.findOne({
      where: { studentId },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Student,
          attributes: ['firstName', 'lastName']
        }
      ]
    });

    if (!cerere) {
      return res.status(404).json({ error: 'Nu există nicio cerere pentru acest student.' });
    }

    res.json(cerere);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'Eroare la preluarea cererii pentru studentul curent.',
      details: err
    });
  }
});

// PUT /api/cereri/:id - Actualizare status cerere
router.put('/cereri/:id', verifyToken, async (req, res) => {
  try {
    const cerere = await Cerere.findByPk(req.params.id);
    if (!cerere) return res.status(404).json({ error: 'Request not found' });

    const { status, justificareRespins } = req.body;

    if (status === 'approved') {
      // Verificăm încă o dată limita
      const profesor = await Profesor.findByPk(cerere.profesorId);
      const countApproved = await Cerere.count({
        where: { profesorId: profesor.id, status: 'approved' }
      });
      if (countApproved >= profesor.maxStudents) {
        return res.status(400).json({
          error: 'Profesorul a atins limita de studenți aprobați.'
        });
      }
      cerere.status = 'approved';
      await cerere.save();
      return res.json(cerere);
    }

    if (status === 'rejected') {
      cerere.status = 'rejected';
      if (justificareRespins) cerere.justificareRespins = justificareRespins;
      await cerere.save();
      return res.json(cerere);
    }

    // alt status
    cerere.status = status;
    await cerere.save();
    res.json(cerere);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update request' });
  }
});

// DELETE /api/cereri/:id - Ștergere cerere
router.delete('/cereri/:id', verifyToken, async (req, res) => {
  try {
    const cerere = await Cerere.findByPk(req.params.id);
    if (!cerere) return res.status(404).json({ error: 'Request not found' });

    await cerere.destroy();
    res.json({ message: 'Request deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete request', details: err });
  }
});

// PUT /api/cereri/invalidate/:studentId - Invalidate cereri unui student
router.put('/cereri/invalidate/:studentId', verifyToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const updated = await Cerere.update(
      { status: 'invalid' },
      {
        where: {
          studentId,
          status: { [Op.or]: ['pending', 'respinsa'] }
        }
      }
    );
    res.json({ message: 'Cereri invalidate', count: updated[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to invalidate requests', details: err });
  }
});

// POST /api/cereri/:id/upload - Upload fișier student
router.post('/cereri/:id/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    const cerereId = req.params.id;
    const cerere = await Cerere.findByPk(cerereId);
    if (!cerere) return res.status(404).json({ error: 'Cererea nu există' });
    if (cerere.status !== 'approved') {
      return res.status(400).json({ error: 'Cererea nu este în stadiu "approved".' });
    }
    // Salvează detalii fișier
    cerere.filePath = req.file.path;
    cerere.originalFileName = req.file.originalname;
    cerere.mimeType = req.file.mimetype;
    await cerere.save();

    res.json({ message: 'Fișier încărcat cu succes', cerere });
  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'Fișierul depășește dimensiunea maximă admisă (10MB).' });
    } else {
      res.status(400).json({ error: err.message });
    }
  }
});

// POST /api/cereri/:id/upload-profesor - Upload fișier profesor
router.post('/cereri/:id/upload-profesor', verifyToken, upload.single('file'), async (req, res) => {
  try {
    const cerereId = req.params.id;
    const cerere = await Cerere.findByPk(cerereId);
    if (!cerere) return res.status(404).json({ error: 'Cererea nu există' });
    if (cerere.status !== 'approved') {
      return res.status(400).json({ error: 'Cererea nu este în stadiul "approved".' });
    }

    cerere.profFilePath = req.file.path; 
    cerere.status = 'finalizat'; // marcăm cererea ca "finalizat"
    await cerere.save();

    res.json({ message: 'Fișier încărcat cu succes', cerere });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
