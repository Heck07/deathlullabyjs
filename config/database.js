const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function initializeDatabase() {
    try {
        const db = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME
        });
        console.log('Connected to the MySQL database');
        return db;
    } catch (err) {
        console.error('Error connecting to the database:', err);
        throw err;
    }
}

// Exportez une fonction pour obtenir une instance de la base de données
module.exports = initializeDatabase;
