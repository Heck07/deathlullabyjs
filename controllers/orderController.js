const db = require('../config/database');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');
const crypto = require('crypto');

async function generateSignupToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function sendConfirmationEmail(email, orderId, signupToken, items, orderTotal) {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Crée une liste HTML pour les produits commandés
  const itemsListHtml = items.map(item => `
    <li>
      <img src="${item.image}" alt="${item.productId}" style="width: 50px; height: 50px; margin-right: 10px; vertical-align: middle;" />
      <strong>${item.name}</strong> - ${item.color}, Taille: ${item.size} <br>
      Quantité: ${item.quantity}, Prix: ${item.price} €
    </li>
  `).join('');

  const mailOptions = {
    from: 'deathlullaby@support.com',
    to: email,
    subject: 'Confirmation de votre commande',
    html: `
      <h1>Merci pour votre commande !</h1>
      <p>Votre numéro de commande est : <strong>${orderId}</strong>.</p>
      <h2>Détails de votre commande :</h2>
      <ul>${itemsListHtml}</ul>
      <p>Total : <strong>${orderTotal} €</strong></p>
      <p>Pour un suivi facile et pour bénéficier d’avantages supplémentaires, <a href="http://localhost:8080/signup?token=${signupToken}">créez un compte ici</a>.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}


exports.createOrder = async (req, res) => {
  const { userId, email, saveAddress, shippingAddress, billingAddress, items, paymentIntentId, orderTotal, useShippingAsBilling } = req.body;

  try {
    // Vérifiez que `paymentIntentId` est fourni
    if (!paymentIntentId) {
      return res.status(400).json({ message: 'paymentIntentId manquant' });
    }

    // Vérifier le paiement avec Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (!paymentIntent || paymentIntent.status !== 'succeeded') {
      console.error(`Échec du paiement : Statut - ${paymentIntent ? paymentIntent.status : 'Non trouvé'}`);
      if (paymentIntent && paymentIntent.last_payment_error) {
        console.error('Détails de l\'erreur :', paymentIntent.last_payment_error);
      }
      return res.status(400).json({ message: 'Le paiement a échoué.' });
    }

    let signupToken = null;
    if (!userId) {
      signupToken = await generateSignupToken();
      await db.promise().query('INSERT INTO temp_users (email, signup_token) VALUES (?, ?) ON DUPLICATE KEY UPDATE signup_token = ?', [email, signupToken, signupToken]);
    }

    const billing = useShippingAsBilling ? shippingAddress : billingAddress;

    // Insérer la commande dans la table `orders`
    const [orderResult] = await db.promise().query(`
      INSERT INTO orders (
        user_id, email, shipping_first_name, shipping_last_name, shipping_phone, 
        shipping_street_address, shipping_postal_code, shipping_city, shipping_country, 
        billing_first_name, billing_last_name, billing_street_address, 
        billing_postal_code, billing_city, billing_country, payment_intent_id, order_total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId || null,
      email,
      shippingAddress.firstName,
      shippingAddress.lastName,
      shippingAddress.phone,
      shippingAddress.street,
      shippingAddress.postalCode,
      shippingAddress.city,
      shippingAddress.country,
      billing.firstName,
      billing.lastName,
      billing.street,
      billing.postalCode,
      billing.city,
      billing.country,
      paymentIntentId,
      orderTotal,
    ]);

    const orderId = orderResult.insertId;

    // Insérer les items de la commande dans `order_items`
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

    // Sauvegarder les adresses dans `user_addresses` si l'utilisateur est connecté
    if (userId && saveAddress) {
      await db.promise().query(
        `INSERT INTO user_addresses (user_id, address_type, first_name, last_name, phone, street_address, postal_code, city, country)
         VALUES (?, 'shipping', ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           first_name = VALUES(first_name),
           last_name = VALUES(last_name),
           phone = VALUES(phone),
           street_address = VALUES(street_address),
           postal_code = VALUES(postal_code),
           city = VALUES(city),
           country = VALUES(country)`,
        [
          userId,
          shippingAddress.firstName,
          shippingAddress.lastName,
          shippingAddress.phone,
          shippingAddress.street,
          shippingAddress.postalCode,
          shippingAddress.city,
          shippingAddress.country,
        ]
      );
    }    
    //Sauvegarde le moyen de paiement si validé
    if (setupIntentId) {
      const paymentMethod = await stripe.paymentMethods.retrieve(setupIntentId);
      if (paymentMethod) {
        await db.promise().query(
          `INSERT INTO payment_methods (user_id, payment_method_id, brand, last4, exp_month, exp_year, is_default, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            userId,
            paymentMethod.id,
            paymentMethod.card.brand,
            paymentMethod.card.last4,
            paymentMethod.card.exp_month,
            paymentMethod.card.exp_year,
            1, // Défini comme méthode par défaut
          ]
        );
      }
    }

    // Envoie un email de confirmation
    await sendConfirmationEmail(email, orderId, signupToken, items, orderTotal);

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

exports.getAllOrders = async (req, res) => {
  try {
    const [orders] = await db.promise().query('SELECT * FROM orders');
    res.status(200).json(orders);
  } catch (error) {
    console.error('Erreur lors de la récupération des ordres d\'achat :', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des ordres d\'achat' });
  }
};

exports.getOrderDetails = async (req, res) => {
  const orderId = req.params.id;

  try {
    // Récupère les informations de base de la commande
    const [orderRows] = await db.promise().query('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (orderRows.length === 0) {
      return res.status(404).json({ message: 'Commande non trouvée.' });
    }

    const order = orderRows[0];

    // Récupère les produits associés à la commande
    const [itemsRows] = await db.promise().query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);

    res.status(200).json({
      order,
      items: itemsRows,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des détails de la commande:', error);
    res.status(500).json({ message: 'Erreur interne lors de la récupération des détails de la commande.' });
  }
};

exports.getOrderItems = async (req, res) => {
  const orderId = req.params.id;

  try {
    // Récupérer les `order_items` pour la commande donnée
    const [items] = await db.promise().query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);

    res.status(200).json({ items });
  } catch (error) {
    console.error('Erreur lors de la récupération des items de la commande:', error);
    res.status(500).json({ message: 'Erreur interne lors de la récupération des items de la commande.' });
  }
};

exports.getUserOrders = async (req, res) => {
  const userId = req.user.id; // Récupérer l'utilisateur connecté depuis le token

  try {
    // Récupérer les commandes de l'utilisateur
    const [orders] = await db.promise().query(
      `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );

    if (orders.length === 0) {
      return res.status(404).json([]);
    }

    // Ajouter les détails des articles à chaque commande
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const [items] = await db.promise().query(
         `SELECT 
             oi.*, 
             p.name AS product_name, 
             (SELECT image_url 
              FROM product_images 
              WHERE product_id = oi.product_id 
              LIMIT 1) AS image_url
           FROM order_items oi
           LEFT JOIN products p ON oi.product_id = p.id
           WHERE oi.order_id = ?`,
          [order.id]
        );

        return { ...order, items };
      })
    );

    res.status(200).json(ordersWithDetails);
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes :', error);
    res.status(500).json({ message: 'Erreur interne lors de la récupération des commandes.' });
  }
};

