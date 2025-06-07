const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AWS = require('aws-sdk');
const userModel = require('../models/user');
const { OAuth2Client } = require('google-auth-library'); 
const { JWT_SECRET, GOOGLE_CLIENT_ID } = process.env; 

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Signup (traditional)
const sns = new AWS.SNS();

exports.signup = async (req, res) => {
  try {
    const { name, mobile, email, password, role } = req.body;

    // Check if the user already exists
    const existingUser = await userModel.getUserByMobile(mobile);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Send OTP via AWS SNS
    const params = {
      Message: `Dear User, Your One-Time Password (OTP) for verification on the Receptive India learning platform is: ${otp}. This code is valid for the next 5 minutes. Do not share it with anyone for security reasons.`,
      PhoneNumber: `+91${mobile}`, // Ensure correct format
    };
    

    await sns.publish(params).promise();
    // Optionally store OTP in your DB or cache (e.g., Redis) for later verification
    await userModel.storeOTP(mobile, otp); // You'll need to implement this

    res.status(200).json({ message: 'OTP sent successfully', mobile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong while signing up' });
  }
};
// Login (traditional)

exports.verifyOtpAndRegister = async (req, res) => {
  try {
    const { name, mobile, email, password, role, otp } = req.body;

    const isValidOtp = await userModel.verifyOTP(mobile, otp);
    if (!isValidOtp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await userModel.createUser({ name, mobile, email,  password: hashedPassword, role });
    res.status(201).json(newUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'OTP verification failed' });
  }
};

exports.login = async (req, res) => {
  const { identifier, password } = req.body; // renamed from email to identifier

  try {
    let user;

    // Simple regex to check if identifier is email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (emailRegex.test(identifier)) {
      // If identifier matches email format
      user = await userModel.getUserByEmail(identifier);
    } else {
      // Otherwise treat as mobile number
      user = await userModel.getUserByMobile(identifier);
    }

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
