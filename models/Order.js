// models/Order.js
module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    userId: DataTypes.INTEGER,
    email: DataTypes.STRING,
    streetAddress: DataTypes.STRING,
    postalCode: DataTypes.STRING,
    city: DataTypes.STRING,
    country: DataTypes.STRING,
    paymentIntentId: DataTypes.STRING, // ID Stripe/PayPal pour la transaction
    orderTotal: DataTypes.DECIMAL,
  });

  Order.associate = (models) => {
    Order.hasMany(models.OrderItem, { foreignKey: 'orderId' });
  };

  return Order;
};

