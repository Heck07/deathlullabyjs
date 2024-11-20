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
    console.error("Validation échouée : User ID ou email manquant.");
    return res.status(400).json({ error: 'User ID and email are required.' });
  }

  try {
    let customerId;

    console.log(`Recherche du client dans la base de données pour l'utilisateur ${userId}...`);
    const [user] = await db.promise().query('SELECT stripe_customer_id FROM users WHERE id = ?', [userId]);

    if (user.length && user[0].stripe_customer_id) {
      customerId = user[0].stripe_customer_id;
      console.log(`Client Stripe trouvé : ${customerId}`);
    } else {
      console.log(`Aucun client Stripe trouvé pour l'utilisateur ${userId}, création d'un nouveau client...`);
      const customer = await stripe.customers.create({ email, metadata: { userId } });
      customerId = customer.id;
      console.log(`Nouveau client Stripe créé : ${customerId}`);
      
      console.log(`Mise à jour de la base de données avec le Stripe Customer ID pour l'utilisateur ${userId}...`);
      await db.promise().query('UPDATE users SET stripe_customer_id = ? WHERE id = ?', [customerId, userId]);
    }

    console.log(`Création d'un SetupIntent pour le client ${customerId}...`);
    const setupIntent = await stripe.setupIntents.create({ customer: customerId });

    console.log(`SetupIntent créé avec succès : ClientSecret = ${setupIntent.client_secret}`);
    return res.status(200).json({ clientSecret: setupIntent.client_secret, customerId });
  } catch (error) {
    console.error("Erreur dans createOrRetrieveSetupIntent :", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};




// Sauvegarder une méthode de paiement dans la base de données
exports.savePaymentMethod = async (req, res) => {
  const { customerId, paymentMethodId } = req.body;

  if (!customerId || !paymentMethodId) {
    return res.status(400).json({ error: 'Customer ID and Payment Method ID are required.' });
  }

  try {
    // Récupérez les détails de la méthode de paiement depuis Stripe
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    // Sauvegardez la méthode de paiement dans votre base de données
    const query = `
      INSERT INTO payment_methods (customer_id, payment_method_id, card_last4, card_brand, exp_month, exp_year)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await db.query(query, [
      customerId,
      paymentMethod.id,
      paymentMethod.card.last4,
      paymentMethod.card.brand,
      paymentMethod.card.exp_month,
      paymentMethod.card.exp_year,
    ]);

    return res.status(201).json({ success: true });
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
