const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// student routes
const userRoutes = require('./routes/users');
const videoRoutes = require('./routes/videos');

// admin routes
const adminRoutes = require('./routes/admin')
const paymentsRoutes = require('./routes/payment')

const app = express();
app.use(cors());

app.use(bodyParser.json());
const thumbnailsPath = path.join(__dirname, 'uploads', 'thumbnails');
app.use('/uploads/thumbnails', express.static(thumbnailsPath));

// student api's
app.use('/users', userRoutes);
app.use('/payment', paymentsRoutes);
app.use('/videos', videoRoutes);

// admin api's
app.use('/api', adminRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
