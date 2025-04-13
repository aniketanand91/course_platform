const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user');
const { OAuth2Client } = require('google-auth-library'); // Google Auth Library
const { JWT_SECRET, GOOGLE_CLIENT_ID } = process.env; // Ensure these environment variables are set

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Signup (traditional)
exports.signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if the user already exists
    const existingUser = await userModel.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the user
    const newUser = await userModel.createUser({ name, email, password: hashedPassword, role });
    res.status(201).json(newUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

// Login (traditional)
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user exists
    const user = await userModel.getUserByEmail(email);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Generate Token
    const token = jwt.sign({ userId: user.user_id }, JWT_SECRET, { expiresIn: '24h' });

    const userInfo = {
      user_ID: user.user_id,
      UserName: user.name,
      UserEmail: user.email,
      UserRole: user.role,
      userToken: token,
    };

    res.json({ userInfo });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Google OAuth
exports.googleOAuth = async (req, res) => {
  const { idToken } = req.body; // Expect idToken from the client

  try {
    // Verify the Google ID Token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,  // Ensure you use the correct Client ID from your environment variable
    });

    const payload = ticket.getPayload(); // Extract user information from token
    const { sub: googleId, email, name } = payload;

    // Check if the user already exists by Google ID or email
    console.log(name);
    let user = await userModel.getUserByGoogleId(googleId);
    if (!user) {
      user = await userModel.getUserByEmail(email);

      if (!user) {
        // Create a new user if not found
        user = await userModel.createUser({
          name,
          email,
          password: null, // No password for Google OAuth
          role: 'user',
          googleId,
        });
      } else {
        // Link the Google ID to the existing user
        await userModel.linkGoogleIdToUser(user.user_id, googleId);
      }
    }

    // Generate Token
    const token = jwt.sign({ userId: user.user_id }, JWT_SECRET, { expiresIn: '1h' });

    const userInfo = {
      user_ID: user.user_id,
      UserName: user.name,
      UserEmail: user.email,
      UserRole: user.role,
      userToken: token,
    };

    res.json({ userInfo });
  } catch (error) {
    console.error('Error during Google OAuth:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
};
