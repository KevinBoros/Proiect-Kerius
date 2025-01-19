const jwt = require('jsonwebtoken');
const SECRET_KEY = 'your_secret_key'; // Asigură-te că e aceeași cheie ca în `authRouter.js`

const verifyToken = (req, res, next) => {
  // Preluăm token-ul din header-ul Authorization
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(403).json({ error: 'Token lipsă. Acces interzis.' });
  }

  try {
    // Verificăm și decodăm token-ul
    const decoded = jwt.verify(token.split(' ')[1], SECRET_KEY);
    req.user = decoded; // Adăugăm informațiile utilizatorului în request
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalid sau expirat.' });
  }
};

module.exports = verifyToken;
