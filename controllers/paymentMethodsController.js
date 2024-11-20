const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../config/database');

// Créer un SetupIntent pour permettre à un utilisateur de sauvegarder un moyen de paiement
exports.createSetupIntent = async (req, res) => {
  const { userId, email } = req.body;

  if (!userId || !email) {
    return res.status(400).json({ error: 'User ID and email are required.' });
  }

  try {
    // Étape 1 : Vérifiez si l'utilisateur a déjà un `stripe_customer_id`
    let customerId = null;
    const [users] = await db.promise().query('SELECT stripe_customer_id FROM users WHERE id = ?', [userId]);

    if (users.length && users[0].stripe_customer_id) {
      customerId = users[0].stripe_customer_id;
    } else {
      // Étape 2 : Créez un client Stripe si aucun `customerId` n'existe
      const customer = await stripe.customers.create({
        email: email,
        metadata: { userId }, // Permet de relier le client Stripe à votre utilisateur
      });

      customerId = customer.id;

      // Étape 3 : Mettez à jour la base de données avec le `customerId`
      await db.promise().query('UPDATE users SET stripe_customer_id = ? WHERE id = ?', [customerId, userId]);
    }

    // Étape 4 : Créez un `SetupIntent` pour sauvegarder une méthode de paiement
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
    });

    // Étape 5 : Retournez le `client_secret` au frontend
    return res.status(200).json({
      clientSecret: setupIntent.client_secret,
      customerId, // Optionnel pour des usages futurs
    });
  } catch (error) {
    console.error('Error creating or retrieving SetupIntent:', error);

    // Gérer les erreurs de Stripe explicitement
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ error: 'Invalid request to Stripe. Check the parameters.' });
    }

    return res.status(500).json({ error: 'Failed to create or retrieve SetupIntent.' });
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
