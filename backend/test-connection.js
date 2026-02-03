const mongoose = require('mongoose');
require('dotenv').config();

console.log('Testing MongoDB connection...');
console.log('Connection string (masked):', process.env.MONGODB_URI?.replace(/:[^:@]+@/, ':****@'));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ SUCCESS! Connected to MongoDB Atlas');
    process.exit(0);
  })
  .catch((err) => {
    console.log('❌ Connection failed');
    console.log('Error name:', err.name);
    console.log('Error message:', err.message);
    if (err.reason) {
      console.log('Reason:', JSON.stringify(err.reason, null, 2));
    }
    process.exit(1);
  });
