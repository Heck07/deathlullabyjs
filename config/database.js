const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

// Vérifier la connexion au pool
db.query()
    .then(connection => {
        console.log('Connected to the MySQL database');
        connection.release(); // Libère la connexion après vérification
    })
    .catch(err => {
        console.error('Error connecting to the database:', err);
    });

module.exports = db;
