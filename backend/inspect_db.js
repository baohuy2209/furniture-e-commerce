const mongoose = require('mongoose');
require('dotenv').config();

async function listCollections() {
  await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/furniture-e-commerce');
  console.log('Connected to', mongoose.connection.name);
  
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('Collections:', collections.map(c => c.name));
  
  for (const coll of collections) {
    const count = await mongoose.connection.db.collection(coll.name).countDocuments();
    console.log(`Collection ${coll.name}: ${count} docs`);
    if (coll.name === 'orders') {
       const samples = await mongoose.connection.db.collection(coll.name).find().limit(2).toArray();
       console.log('Sample orders:', JSON.stringify(samples, null, 2));
    }
  }
  
  process.exit(0);
}

listCollections().catch(err => {
  console.error(err);
  process.exit(1);
});
