const db = require('../config/database');

exports.addColor = (req, res) => {
  const { id: productId } = req.params;
  const { color_name, hex_code } = req.body;
  const query = 'INSERT INTO colors (product_id, color_name, hex_code) VALUES (?, ?, ?)';
  db.query(query, [productId, color_name, hex_code], (err, result) => {
    if (err) return res.status(500).send('Error adding color');
    res.status(201).json({ id: result.insertId, color_name, hex_code });
  });
};

exports.getColorsByProductId = (req, res) => {
  const { id: productId } = req.params;
  const query = 'SELECT * FROM colors WHERE product_id = ?';
  db.query(query, [productId], (err, results) => {
    if (err) return res.status(500).send('Error retrieving colors');
    res.status(200).json(results);
  });
};

exports.updateColor = (req, res) => {
  const { colorId } = req.params;
  const { color_name, hex_code } = req.body;
  const query = 'UPDATE colors SET color_name = ?, hex_code = ? WHERE id = ?';
  db.query(query, [color_name, hex_code, colorId], (err) => {
    if (err) return res.status(500).send('Error updating color');
    res.status(200).send('Color updated successfully');
  });
};

exports.deleteColor = (req, res) => {
  const { colorId } = req.params;
  const query = 'DELETE FROM colors WHERE id = ?';
  db.query(query, [colorId], (err) => {
    if (err) return res.status(500).send('Error deleting color');
    res.status(200).send('Color deleted successfully');
  });
};
