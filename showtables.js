const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();

// Database connection configuration
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

const alterColorsTable = async () => {
  try {
    const addImageIdColumn = `
        SHOW TABLES;
          `;

    await db.promise().query(addImageIdColumn);
    console.log("Commande réussi");
    
    db.end();
  } catch (error) {
    console.error('Error with tables', error);
    db.end();
  }
};

// Run the function
alterColorsTable();