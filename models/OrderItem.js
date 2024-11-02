// models/OrderItem.js
module.exports = (sequelize, DataTypes) => {
    const OrderItem = sequelize.define('OrderItem', {
      orderId: DataTypes.INTEGER,
      productId: DataTypes.INTEGER,
      color: DataTypes.STRING,
      size: DataTypes.STRING,
      quantity: DataTypes.INTEGER,
      price: DataTypes.DECIMAL,
    });
  
    OrderItem.associate = (models) => {
      OrderItem.belongsTo(models.Order, { foreignKey: 'orderId' });
    };
  
    return OrderItem;
  };
  