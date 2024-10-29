const db = require('../config/database');
const cloudinary = require('../config/cloudinaryConfig');

// Fetch a single product by ID with colors
exports.getProductById = async (req, res) => {
  const productId = req.params.id;
  
  try {
    const [productResults] = await db.query('SELECT * FROM products WHERE id = ?', [productId]);
    
    if (productResults.length === 0) {
      return res.status(404).send('Produit non trouvé.');
    }

    const [colorResults] = await db.query('SELECT color_name, hex_code, image_url FROM colors WHERE product_id = ?', [productId]);

    const product = {
      ...productResults[0],
      colors: colorResults,
    };
    
    res.status(200).json(product);
  } catch (err) {
    console.error('Erreur lors de la récupération du produit :', err);
    res.status(500).send('Erreur interne lors de la récupération du produit.');
  }
};

// Fetch all products with their colors
exports.getAllProducts = async (req, res) => {
  try {
    const [productResults] = await db.query(`
      SELECT p.id, p.name, p.price, p.category_id, pi.image_url
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
    `);

    const [colorResults] = await db.query(`
      SELECT c.product_id, c.color_name, c.hex_code, pi.image_url
      FROM colors c
      LEFT JOIN product_images pi ON c.image_id = pi.id
    `);

    const products = productResults.reduce((acc, row) => {
      const { id, name, price, category_id, image_url } = row;
      let product = acc.find(p => p.id === id);

      if (!product) {
        product = { id, name, price, category_id, images: [], colors: [] };
        acc.push(product);
      }

      if (image_url) product.images.push(image_url);

      const colorsForProduct = colorResults
        .filter(color => color.product_id === id)
        .map(({ color_name, hex_code, image_url }) => ({ color_name, hex_code, image_url }));
      
      product.colors = colorsForProduct;

      return acc;
    }, []);

    res.status(200).json(products);
  } catch (err) {
    console.error('Erreur lors de la récupération des produits :', err);
    res.status(500).send('Erreur interne lors de la récupération des produits.');
  }
};

// Add a new product with color and images
exports.addProduct = async (req, res) => {
  const { name, price, categoryId, color_name, color_hex } = req.body;

  if (!name || !price || !categoryId || !color_name || !color_hex || !req.files || req.files.length === 0) {
    return res.status(400).send("Tous les champs, y compris une couleur et des images, sont requis.");
  }

  try {
    const [productResult] = await db.query('INSERT INTO products (name, price, category_id) VALUES (?, ?, ?)', [name, price, categoryId]);
    const productId = productResult.insertId;

    const [colorResult] = await db.query('INSERT INTO colors (product_id, color_name, hex_code) VALUES (?, ?, ?)', [productId, color_name, color_hex]);
    const colorId = colorResult.insertId;

    const imagePromises = req.files.map(async (file) => {
      const uploadResponse = await cloudinary.uploader.upload(file.path);
      await db.query('INSERT INTO product_images (product_id, image_url, color_id) VALUES (?, ?, ?)', [productId, uploadResponse.secure_url, colorId]);
    });

    await Promise.all(imagePromises);

    res.status(201).json({ message: 'Produit ajouté avec succès' });
  } catch (err) {
    console.error("Erreur lors de l'ajout du produit :", err);
    res.status(500).send("Erreur lors de l'ajout du produit.");
  }
};

// Update a product with optional images
exports.updateProduct = async (req, res) => {
  const productId = req.params.id;
  const { name, price, categoryId } = req.body;

  if (!name || !price || !categoryId) {
    return res.status(400).send("Tous les champs sont requis.");
  }

  try {
    await db.query('UPDATE products SET name = ?, price = ?, category_id = ? WHERE id = ?', [name, price, categoryId, productId]);

    if (req.files && req.files.length > 0) {
      const imagePromises = req.files.map(async (file) => {
        const uploadResponse = await cloudinary.uploader.upload(file.path);
        await db.query('INSERT INTO product_images (product_id, image_url) VALUES (?, ?)', [productId, uploadResponse.secure_url]);
      });

      await Promise.all(imagePromises);
    }

    res.status(200).send("Produit mis à jour avec succès.");
  } catch (err) {
    console.error("Erreur lors de la mise à jour du produit :", err);
    res.status(500).send("Erreur lors de la mise à jour du produit.");
  }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
  const productId = req.params.id;

  try {
    const [result] = await db.query('DELETE FROM products WHERE id = ?', [productId]);

    if (result.affectedRows === 0) {
      return res.status(404).send('Produit non trouvé.');
    }

    res.status(200).send('Produit supprimé avec succès.');
  } catch (err) {
    console.error('Erreur lors de la suppression du produit :', err);
    res.status(500).send('Erreur interne lors de la suppression du produit.');
  }
};

// Add a color and its images
exports.addColor = async (req, res) => {
  const { color_name, hex_code } = req.body;
  const productId = req.params.id;
  const images = req.files || [];

  try {
    const [colorResult] = await db.query('INSERT INTO colors (product_id, color_name, hex_code) VALUES (?, ?, ?)', [productId, color_name, hex_code]);
    const colorId = colorResult.insertId;

    const imagePromises = images.map(async (file) => {
      const uploadResponse = await cloudinary.uploader.upload(file.path);
      await db.query('INSERT INTO product_images (product_id, image_url, color_id) VALUES (?, ?, ?)', [productId, uploadResponse.secure_url, colorId]);
    });

    await Promise.all(imagePromises);

    res.status(201).json({ message: 'Couleur et images ajoutées avec succès' });
  } catch (err) {
    console.error("Erreur lors de l'ajout de la couleur et des images :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

exports.getProductImages = (req, res) => {
  const productId = req.params.id;
  const query = 'SELECT image_url FROM product_images WHERE product_id = ?';

  db.query(query, [productId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des images :', err);
      return res.status(500).send('Erreur interne lors de la récupération des images.');
    }
    res.status(200).json(results.map(row => row.image_url));
  });
};