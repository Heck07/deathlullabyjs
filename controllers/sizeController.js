const db = require('../config/database');

exports.addSize = (req, res) => {
  const { id: productId } = req.params;
  const { size } = req.body;
  const query = 'INSERT INTO sizes (product_id, size) VALUES (?, ?)';
  db.query(query, [productId, size], (err, result) => {
    if (err) return res.status(500).send('Error adding size');
    res.status(201).json({ id: result.insertId, size });
  });
};

exports.getSizesByProductId = (req, res) => {
  const { id: productId } = req.params;
  const query = 'SELECT * FROM sizes WHERE product_id = ?';
  db.query(query, [productId], (err, results) => {
    if (err) return res.status(500).send('Error retrieving sizes');
    res.status(200).json(results);
  });
};

exports.updateSize = (req, res) => {
  const { sizeId } = req.params;
  const { size } = req.body;
  const query = 'UPDATE sizes SET size = ? WHERE id = ?';
  db.query(query, [size, sizeId], (err) => {
    if (err) return res.status(500).send('Error updating size');
    res.status(200).send('Size updated successfully');
  });
};

exports.deleteSize = (req, res) => {
  const { sizeId } = req.params;
  const query = 'DELETE FROM sizes WHERE id = ?';
  db.query(query, [sizeId], (err) => {
    if (err) return res.status(500).send('Error deleting size');
    res.status(200).send('Size deleted successfully');
  });
};
