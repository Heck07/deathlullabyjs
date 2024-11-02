// controllers/orderController.js
const db = require('../config/database');

exports.createOrder = async (req, res) => {
  const { userId, email, address, items, paymentIntentId, orderTotal } = req.body;

  try {
    // Insérer la commande dans la table `orders`
    const [orderResult] = await db.promise().query(`
      INSERT INTO orders (user_id, email, street_address, postal_code, city, country, payment_intent_id, order_total)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, email, address.street, address.postalCode, address.city, address.country, paymentIntentId, orderTotal]);

    const orderId = orderResult.insertId;

    // Préparer les articles de commande pour l'insertion en masse
    const orderItems = items.map(item => [
      orderId, item.productId, item.color, item.size, item.quantity, item.price
    ]);

    // Insérer les articles dans la table `order_items`
    await db.promise().query(`
      INSERT INTO order_items (order_id, product_id, color, size, quantity, price)
      VALUES ?
    `, [orderItems]);

    res.status(201).json({ message: 'Commande créée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création de la commande', error });
  }
};
