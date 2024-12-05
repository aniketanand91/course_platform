const jwt = require('jsonwebtoken');
const SECRET_KEY = 'your_secret_key'; // Make sure this is defined correctly

const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];

  console.log('Authorization Header:', req.header('Authorization')); // Debug output

  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded Token:', decoded); // Debug output

    req.user = decoded; 
    next();
  } catch (err) {
    console.error('JWT Error:', err); // Debug output
    res.status(401).json({ error: 'Token is not valid' });
  }
};

module.exports = authenticate;
