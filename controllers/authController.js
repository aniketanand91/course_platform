const jwt = require('jsonwebtoken');
const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const userModel = require('../models/user');
const { OAuth2Client } = require('google-auth-library');

const { JWT_SECRET, GOOGLE_CLIENT_ID } = process.env;
const sns = new AWS.SNS();
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// ---------------------- Signup: Send OTP ----------------------

exports.signup = async (req, res) => {
  try {
    const { name, mobile, email, password, role } = req.body;

    if (!mobile) {
      return res.status(400).json({ error: 'Mobile number is required' });
    }

    const emailVerification = await userModel.getUserByEmail(email);
    
    if (emailVerification) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const existingUser = await userModel.getUserByMobile(mobile);


    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const params = {
      Message: `Dear User, Your One-Time Password (OTP) for verification on the Receptive India learning platform is: ${otp}. This code is valid for 5 minutes. Do not share it.`,
      PhoneNumber: `+91${mobile}`,
    };

    await sns.publish(params).promise();
    await userModel.storeOTP(mobile, otp);

    res.status(200).json({ message: 'OTP sent successfully', mobile });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};

// ---------------------- Verify OTP & Register ----------------------

exports.verifyOtpAndRegister = async (req, res) => {
  try {
    const { name, mobile, email, password, role, otp } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const isValidOtp = await userModel.verifyOTP(mobile, otp);
    if (!isValidOtp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await userModel.createUser({
      name,
      mobile,
      email,
      password: hashedPassword,
      role,
    });

    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (err) {
    console.error('OTP verification error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// ---------------------- Login ----------------------

exports.login = async (req, res) => {
  const { identifier, password } = req.body;

  try {
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Email/Mobile and password are required' });
    }

    let user;
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

    user = isEmail
      ? await userModel.getUserByEmail(identifier)
      : await userModel.getUserByMobile(identifier);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

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
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// ---------------------- Google OAuth ----------------------

exports.googleOAuth = async (req, res) => {
  const { idToken } = req.body;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    let user = await userModel.getUserByGoogleId(googleId);

    if (!user) {
      user = await userModel.getUserByEmail(email);

      if (!user) {
        user = await userModel.createUser({
          name,
          email,
          password: null,
          role: 'user',
          googleId,
        });
      } else {
        await userModel.linkGoogleIdToUser(user.user_id, googleId);
      }
    }

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
    console.error('Google OAuth error:', error);
    res.status(500).json({ message: 'Google authentication failed' });
  }
};


exports.sendOtpToMobile = async (req, res) => {
  const { mobile } = req.body;
 
  try {
    const user = await userModel.getUserByMobile(mobile);
    if (!user) {
      return res.status(404).json({ message: 'User not registered' });
    }
 
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // hardcoded for now
    const params = {
      Message: `Dear User, Your One-Time Password (OTP) for password reset is: ${otp}. This code is valid for 5 minutes. Do not share it.`,
      PhoneNumber: `+91${mobile}`,
    };

    await sns.publish(params).promise();
    await userModel.storeOTP(mobile, otp);

    res.json({ message: 'OTP sent successfully' }); // simulate SMS send
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.resetPassword = async (req, res) => {
  const { mobile, otp, newPassword, confirmPassword } = req.body;
 
  try {
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
 
    const stored = await userModel.verifyOTP(mobile, otp);
    console.log(mobile,otp);
 
    if (!stored) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }
 
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userModel.updatePasswordByMobile(mobile, hashedPassword);
 
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Server error' });
  }
};