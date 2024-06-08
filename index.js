const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const authRoutes = require('./src/routes/authentication');
const app = express();
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use('/authentication', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
