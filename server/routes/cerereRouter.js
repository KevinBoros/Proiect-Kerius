const router = require('express').Router();
const Cerere = require('../models/cerere');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const Profesor = require('../models/profesor'); 

//folder local unde se salveaza fisierele

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // folosim data + random + numele original,
    // sau doar un hash + extensia originală
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    // extragem extensia
    const ext = path.extname(file.originalname);
    // ex: "1673690341234-623123.pdf"
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });


// POST /api/cereri - Creare cerere
router.post('/cereri', async (req, res) => {
  try {
    const { studentId, profesorId } = req.body;


    // Dupa ce verifici professor in DB:
   const profesor = await Profesor.findByPk(profesorId);
   if (!profesor) {
     return res.status(400).json({ error: 'Profesor inexistent' });
   }
   const countApproved = await Cerere.count({
      where: { profesorId, status: 'approved' }
    });
    if (countApproved >= profesor.maxStudents) {
      return res.status(400).json({
        error: 'Acest profesor nu mai are locuri disponibile.'
      });
    }



    // 1. Verifică dacă studentul e deja "approved" la oricare profesor
    const cerereAprobata = await Cerere.findOne({
      where: {
        studentId,
        status: 'approved'
      }
    });
    if (cerereAprobata) {
      return res.status(400).json({
        error: 'Acest student este deja aprobat la un profesor. Nu mai poate trimite cereri noi.'
      });
    }

    // 2. Verifică dacă există deja cerere la acest profesor (cu status != 'invalid' / 'rejected')
    const cerereExistenta = await Cerere.findOne({
      where: {
        studentId,
        profesorId,
        status: {
          [Op.notIn]: ['invalid', 'rejected']
        }
      }
    });
    if (cerereExistenta) {
      return res.status(400).json({
        error: 'Există deja o cerere activă către acest profesor.'
      });
    }

    // 3. Dacă a trecut de verificări, creează cererea
    const cerere = await Cerere.create(req.body);
    res.status(201).json(cerere);
    
  } catch (err) {
    res.status(400).json({ error: 'Failed to create request', details: err });
  }
});


// GET /api/cereri - Vizualizare cereri
router.get('/cereri', async (req, res) => {
  try {
    const { studentId, profesorId } = req.query;

    let where = {};
    if (studentId) where.studentId = studentId;
    if (profesorId) where.profesorId = profesorId;

    const cereri = await Cerere.findAll({ where });
    res.json(cereri);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve requests', details: err });
  }
});

// PUT /api/cereri/:id - Actualizare status cerere
router.put('/cereri/:id', async (req, res) => {
  try {
    const cerere = await Cerere.findByPk(req.params.id);
    if (!cerere) return res.status(404).json({ error: 'Request not found' });

    const { status, justificareRespins, filePath } = req.body;

    // Daca cererea e aprobata, invalideaza restul cererilor studentului
    if (status === 'approved') {
      const profesor = await Profesor.findByPk(cerere.profesorId);
      if (!profesor) {
        return res.status(400).json({ error: 'Profesor inexistent' });
      }

      // Câți studenți deja aprobați la acest profesor?
      const countApproved = await Cerere.count({
        where: {
          profesorId: profesor.id,
          status: 'approved'
        }
      });
      if (countApproved >= profesor.maxStudents) {
        // Respinge direct
        return res.status(400).json({
          error: 'Profesorul a atins deja limita de studenți aprobați.'
        });
      }
      cerere.status = 'approved';
      await cerere.save();

      // Apoi “invalidezi” restul cererilor studentului care sunt pending
      await Cerere.update(
        { status: 'invalid' },
        {
          where: {
            studentId: cerere.studentId,
            id: { [Op.ne]: cerere.id },     // toate cererile altfel decat cea curenta
            status: { [Op.in]: ['pending', 'resubmit'] }
          }
        }
      );

      return res.json(cerere);
    }

    // Daca status e "rejected"
    if (status === 'rejected') {
      cerere.status = 'rejected';
      if (justificareRespins) cerere.justificareRespins = justificareRespins;
      await cerere.save();
      return res.json(cerere);
    }

    // altfel, update normal
    if (status) cerere.status = status;
    if (justificareRespins) cerere.justificareRespins = justificareRespins;
    if (filePath) cerere.filePath = filePath;

    await cerere.save();
    res.json(cerere);

  } catch (err) {
    res.status(500).json({ error: 'Failed to update request', details: err });
  }
});


// DELETE /api/cereri/:id - Stergere cerere
router.delete('/cereri/:id', async (req, res) => {
  try {
    const cerere = await Cerere.findByPk(req.params.id);
    if (!cerere) return res.status(404).json({ error: 'Request not found' });

    await cerere.destroy();
    res.json({ message: 'Request deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete request', details: err });
  }
});


//PUT /api/cereri/invalidate/:studentId
router.put('/cereri/invalidate/:studentId', async (req, res) => {
    try {
      const { studentId } = req.params;
  
      // Invalidam cererile care sunt `pending`
      const updated = await Cerere.update(
        { status: 'invalid' },
        {
          where: {
            studentId,
            status: { [Op.or]: ['pending', 'respinsa'] } // Include pending si respins
          }
        }
      );
  
      res.json({ message: 'Cereri invalidate', count: updated[0] });
    } catch (err) {
      res.status(500).json({ error: 'Failed to invalidate requests', details: err });
    }
  });
  

  // POST /api/cereri/:id/upload
router.post('/cereri/:id/upload', upload.single('file'), async (req, res) => {
  try {
    const cerereId = req.params.id;
    const cerere = await Cerere.findByPk(cerereId);
    if (!cerere) return res.status(404).json({ error: 'Cererea nu există' });

    // Verificare optionala: veste cererea 'approved'?
    if (cerere.status !== 'approved') {
      return res.status(400).json({ error: 'Cererea nu este în stadiu "approved".' });
    }

    // Se salveaza calea fisierului in DB
    // req.file.path e calea generata in uploads/
    console.log("file upload =>", req.file);
    cerere.filePath = req.file.path; 
    cerere.originalFileName = req.file.originalname;
    cerere.mimeType = req.file.mimetype;
    // se poate marca status = "resubmit" ca sa fie vazut de profesor, daca vrem, de ex. "in_asteptare"
    await cerere.save();

    res.json({ message: 'Fișier încărcat cu succes', cerere });
  } catch (err) {
    res.status(500).json({ error: 'Eroare la încărcarea fișierului', details: err });
  }
});
  


module.exports = router;
