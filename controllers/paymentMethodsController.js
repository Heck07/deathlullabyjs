const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../config/database');

exports.createSetupIntent = async (req, res) => {
  const { customerId } = req.body;

  if (!customerId) {
    return res.status(400).json({ error: 'Customer ID is required.' });
  }

  try {
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
    });

    return res.status(200).json({ clientSecret: setupIntent.client_secret });
  } catch (error) {
    console.error('Error creating SetupIntent:', error);
    return res.status(500).json({ error: 'Failed to create SetupIntent.' });
  }
};


// Créer un SetupIntent pour permettre à un utilisateur de sauvegarder un moyen de paiement
exports.createOrRetrieveSetupIntent = async (req, res) => {
  const { userId, email } = req.body;

  if (!userId || !email) {
    return res.status(400).json({ error: 'User ID and email are required.' });
  }

  try {
    let customerId;
    const [user] = await db.promise().query('SELECT stripe_customer_id FROM users WHERE id = ?', [userId]);

    if (user.length && user[0].stripe_customer_id) {
      customerId = user[0].stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({ email, metadata: { userId } });
      customerId = customer.id;
      await db.promise().query('UPDATE users SET stripe_customer_id = ? WHERE id = ?', [customerId, userId]);
    }

    const setupIntent = await stripe.setupIntents.create({ customer: customerId });

    return res.status(200).json({ clientSecret: setupIntent.client_secret, customerId });
  } catch (error) {
    console.error("Erreur createOrRetrieveSetupIntent :", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};



// Sauvegarder une méthode de paiement dans la base de données
exports.savePaymentMethod = async (req, res) => {
  const { userId, paymentMethodId, brand, last4, expMonth, expYear, isDefault } = req.body;

  if (!userId || !paymentMethodId || !brand || !last4 || !expMonth || !expYear) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  try {
    // Si une méthode de paiement par défaut existe déjà, la désactiver si `isDefault` est vrai
    if (isDefault) {
      await db.promise().query(
        `UPDATE payment_methods SET is_default = 0 WHERE user_id = ?`,
        [userId]
      );
    }

    // Insérer la méthode de paiement dans la base de données
    const [result] = await db.promise().query(
      `INSERT INTO payment_methods (user_id, payment_method_id, brand, last4, exp_month, exp_year, is_default, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [userId, paymentMethodId, brand, last4, expMonth, expYear, isDefault ? 1 : 0]
    );

    return res.status(201).json({ message: 'Payment method saved successfully.', id: result.insertId });
  } catch (error) {
    console.error('Error saving payment method:', error);
    return res.status(500).json({ error: 'Failed to save payment method.' });
  }
};

// Récupérer les méthodes de paiement d'un utilisateur
exports.getPaymentMethods = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  try {
    const [methods] = await db.promise().query(
      `SELECT id, payment_method_id, brand, last4, exp_month, exp_year, is_default
       FROM payment_methods WHERE user_id = ?`,
      [userId]
    );

    return res.status(200).json(methods);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return res.status(500).json({ error: 'Failed to fetch payment methods.' });
  }
};

// Supprimer une méthode de paiement
exports.deletePaymentMethod = async (req, res) => {
  const { paymentMethodId } = req.params;

  if (!paymentMethodId) {
    return res.status(400).json({ error: 'Payment Method ID is required.' });
  }

  try {
    await db.promise().query(
      `DELETE FROM payment_methods WHERE payment_method_id = ?`,
      [paymentMethodId]
    );

    return res.status(200).json({ message: 'Payment method deleted successfully.' });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    return res.status(500).json({ error: 'Failed to delete payment method.' });
  }
};
