// index.js à la racine de votre backend
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const db = require('./config/database');
const routes = require('./routes'); // Ce fichier routes est l'index.js du dossier routes

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Middleware CORS pour autoriser les requêtes cross-origin
app.use(cors({
  origin: ['http://localhost:8080'], // Autorisez ici les origines dont vous avez besoin
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true
}));

// Middleware pour parser les requêtes JSON
app.use(express.json());

// Connexion à la base de données
db.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données :', err);
    throw err;
  }
  console.log('Connecté à la base de données MySQL');
});

// Enregistrement des routes
app.use('/api', routes); // J'ai changé '/routes' en '/api' pour des conventions plus standard

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Serveur backend en écoute sur le port ${port}`);
});
