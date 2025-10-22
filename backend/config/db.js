const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/soulworld';
    
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Optional settings for Atlas / production
      serverSelectionTimeoutMS: 5000, // short timeout for faster failure
      // retryWrites: true,          // Atlas default
      // w: 'majority',              // Atlas default
    });

    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1); // exit process if DB connection fails
  }
};

module.exports = connectDB;
