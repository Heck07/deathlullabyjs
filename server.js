const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db');  // La config MySQL

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Import des routes
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');

// Routes API
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);

// Port d'écoute du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
