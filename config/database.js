const mysql = require('mysql2');
require('dotenv').config(); 

// Use environment variables to get database connection details
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost', // Default to localhost if not defined
  user: process.env.DB_USER || 'root', // Default to root if not defined
  password: process.env.DB_PASSWORD || '123456', // Default to '123456' if not defined
  database: process.env.DB_NAME || 'course_platform', // Default to course_platform if not defined
  port: process.env.DB_PORT || 3306, // Default to 3306 if not defined
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool.promise();
