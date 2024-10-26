// categoryController.js
const db = require('../config/database');

// Récupérer toutes les catégories
exports.getAllCategories = async (req, res) => {
  try {
    const [results] = await db.promise().query('SELECT * FROM categories');
    res.status(200).json(results);
  } catch (err) {
    console.error('Erreur lors de la récupération des catégories :', err);
    res.status(500).send('Erreur interne lors de la récupération des catégories.');
  }
};

// Ajouter une nouvelle catégorie
exports.addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).send('Le nom de la catégorie est requis.');
    }
    const [result] = await db.promise().query('INSERT INTO categories (name) VALUES (?)', [name]);
    const newCategory = { id: result.insertId, name };
    res.status(201).json(newCategory);
  } catch (err) {
    console.error("Erreur lors de l'ajout de la catégorie :", err);
    res.status(500).send("Erreur interne lors de l'ajout de la catégorie.");
  }
};

// Mettre à jour une catégorie
exports.updateCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { name } = req.body;
    if (!name) {
      return res.status(400).send('Le nom de la catégorie est requis.');
    }
    const [result] = await db.promise().query('UPDATE categories SET name = ? WHERE id = ?', [name, categoryId]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Catégorie non trouvée.');
    }
    res.status(200).send('Catégorie mise à jour avec succès.');
  } catch (err) {
    console.error("Erreur lors de la mise à jour de la catégorie :", err);
    res.status(500).send("Erreur interne lors de la mise à jour de la catégorie.");
  }
};

// Supprimer une catégorie
exports.deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const [result] = await db.promise().query('DELETE FROM categories WHERE id = ?', [categoryId]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Catégorie non trouvée.');
    }
    res.status(200).send('Catégorie supprimée avec succès.');
  } catch (err) {
    console.error("Erreur lors de la suppression de la catégorie :", err);
    res.status(500).send("Erreur interne lors de la suppression de la catégorie.");
  }
};
