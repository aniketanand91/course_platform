const jwt = require('jsonwebtoken');

const checkAdmin = (req, res, next) => {
  // Get token from header
  const token = req.header('Authorization')?.split(' ')[1];

  // Check if token doesn't exist
  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if the user role is admin
    if (decoded.user && decoded.user.role === 'admin') {
      req.user = decoded.user; // Attach the decoded user to the request object
      next(); // Allow access to the next middleware or route handler
    } else {
      res.status(403).json({ error: 'Unauthorized access' });
    }
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

module.exports = checkAdmin;
