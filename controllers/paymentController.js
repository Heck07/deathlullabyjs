// controllers/paymentController.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.createPayment = async (req, res) => {
  try {
    const { token, billingAddress, billingZip, billingCity, useShippingAsBilling } = req.body;

    const charge = await stripe.charges.create({
      amount: 5000, // Montant en centimes
      currency: 'eur',
      source: token,
      description: `Commande pour ${billingAddress}, ${billingCity}, ${billingZip}`,
    });

    res.status(201).json({ message: 'Paiement réussi', charge });
  } catch (error) {
    res.status(500).json({ message: 'Échec du paiement', error: error.message });
  }
};
