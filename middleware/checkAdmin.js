const jwt = require('jsonwebtoken');
const userModel = require('../models/user');

const checkAdmin = async (req, res, next) => {
  // Get token from header
  const token = req.header('Authorization')?.split(' ')[1];

  // Check if token doesn't exist
  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userid = decoded.userId; // Assuming `userId` is in decoded payload

    // Fetch user from database and check if the role is 'admin'
    const user = await userModel.getUserById(userid);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the user role is 'admin'
    if (user.role === 'admin') {
      req.user = user; // Attach the user to the request object
      next(); // Allow access to the next middleware or route handler
    } else {
      res.status(403).json({ error: 'Unauthorized access' });
    }
  } catch (err) {
    console.error(err); // For debugging purposes
    res.status(401).json({ error: 'Token is not valid' });
  }
};


module.exports = checkAdmin;
