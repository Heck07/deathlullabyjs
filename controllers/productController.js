const db = require('../config/db');

// Récupérer tous les produits
exports.getAllProducts = (req, res) => {
    db.query('SELECT * FROM products', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

// Ajouter un nouveau produit
exports.addProduct = (req, res) => {
    const { name, price, description } = req.body;
    db.query('INSERT INTO products (name, price, description) VALUES (?, ?, ?)', 
    [name, price, description], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Product added successfully' });
    });
};
