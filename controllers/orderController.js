const db = require('../config/database');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.createOrder = async (req, res) => {
  const { userId, email, shippingAddress, billingAddress, items, paymentIntentId, orderTotal } = req.body;

  try {

    // Vérifiez que `paymentIntentId` est fourni
    if (!paymentIntentId) {
      return res.status(400).json({ message: 'paymentIntentId manquant' });
    }

    // Vérifier le paiement avec Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (!paymentIntent || paymentIntent.status !== 'succeeded') {
      // Affichez des informations détaillées si le paiement échoue
      console.error(`Échec du paiement : Statut - ${paymentIntent ? paymentIntent.status : 'Non trouvé'}`);
      if (paymentIntent && paymentIntent.last_payment_error) {
        console.error('Détails de l\'erreur :', paymentIntent.last_payment_error);
      }
      return res.status(400).json({ message: 'Le paiement a échoué.' });
    }

    // Insérer la commande dans la table orders
    const [orderResult] = await db.promise().query(`
      INSERT INTO orders (
        user_id, email, shipping_first_name, shipping_last_name, shipping_phone, 
        shipping_street_address, shipping_postal_code, shipping_city, shipping_country, 
        billing_first_name, billing_last_name, billing_street_address, 
        billing_postal_code, billing_city, billing_country, payment_intent_id, order_total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      email,
      shippingAddress.firstName,
      shippingAddress.lastName,
      shippingAddress.phone,
      shippingAddress.street,
      shippingAddress.postalCode,
      shippingAddress.city,
      shippingAddress.country,
      billingAddress.firstName,
      billingAddress.lastName,
      billingAddress.street,
      billingAddress.postalCode,
      billingAddress.city,
      billingAddress.country,
      paymentIntentId,
      orderTotal,
    ]);

    const orderId = orderResult.insertId;

    // Insérer les items de la commande dans order_items
    const itemInserts = items.map(item => [
      orderId,
      item.productId,
      item.color,
      item.size,
      item.quantity,
      item.price
    ]);

    await db.promise().query(`
      INSERT INTO order_items (order_id, product_id, color, size, quantity, price) 
      VALUES ?
    `, [itemInserts]);

    res.status(201).json({ message: 'Commande créée avec succès', orderId });
  } catch (error) {
    console.error('Erreur lors de la création de la commande:', error);
    res.status(500).json({ message: 'Erreur lors de la commande', error });
  }
};

exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount } = req.body; // Total de la commande en centimes

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'eur', // Par exemple, en euros
      payment_method_types: ['card'],
    });

    res.status(200).json({
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret // Renvoie le client_secret
    });
    } catch (error) {
    console.error('Erreur lors de la création du paymentIntent:', error);
    res.status(500).json({ message: 'Erreur lors de la création du paymentIntent' });
  }
};