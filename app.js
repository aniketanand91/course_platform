const express = require('express');
const bodyParser = require('body-parser');

// student routes
const userRoutes = require('./routes/users');
const videoRoutes = require('./routes/videos');

// admin routes
const adminRoutes = require('./routes/admin')
const paymentsRoutes = require('./routes/payment')

const app = express();

app.use(bodyParser.json());

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
