const mongoose = require('mongoose');
const Order = require('./app/models/order.model');
const OrderItem = require('./app/models/orderItem.model');

async function checkDB() {
  await mongoose.connect('mongodb://localhost:27017/furniture-e-commerce'); // Adjust DB name if needed
  console.log('Connected');
  
  const orders = await Order.find().limit(5);
  console.log('Orders found:', orders.length);
  orders.forEach(o => console.log(`Order: ${o.order_number}, ID: ${o._id}, User: ${o.user_id}`));
  
  const items = await OrderItem.find().limit(5);
  console.log('OrderItems found:', items.length);
  items.forEach(i => console.log(`Item OrderID: ${i.order_id}`));
  
  process.exit(0);
}

checkDB().catch(err => {
  console.error(err);
  process.exit(1);
});
