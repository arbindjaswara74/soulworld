const mongoose = require('mongoose');

function maskUri(uri){
  try{
    // Try to mask password in mongodb uri: mongodb+srv://user:pass@host/...
    return uri.replace(/(mongodb(?:\+srv)?:\/\/)([^:@\/]+)(:)([^@\/]+)(@)/, (m,p,user,colon,pass,at) => {
      return `${p}${user}${colon}****${at}`;
    });
  }catch(e){ return uri; }
}

const connectDB = async (providedUri) => {
  const uri = providedUri || process.env.MONGODB_URI || 'mongodb://localhost:27017/soulworld';
  console.log('[db] attempting connection to MongoDB at', maskUri(uri));

  try {
    await mongoose.connect(uri, {
      // Mongoose 7+ doesn't require useNewUrlParser / useUnifiedTopology, but harmless
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });

    console.log('✅ Connected to MongoDB');
    return mongoose.connection;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err && err.message ? err.message : err);

    // Provide actionable tips for authentication failures
    if (err && /auth/i.test(String(err.message)) || /Authentication failed/i.test(String(err.message))){
      console.error('\nTroubleshooting tips for Authentication failed:');
      console.error('- Verify MONGODB_URI credentials (username and password) are correct.');
      console.error("- If your password contains special characters (e.g. @, :, \\#, %), URL-encode it in the URI.");
      console.error('- Check that the user exists in the database and has the right authSource (e.g. admin) if using Atlas.');
      console.error('- If using MongoDB Atlas: ensure your IP is whitelisted or set to 0.0.0.0/0 for quick test (not recommended long-term).');
      console.error('- Test using the `mongosh` CLI with the same URI to confirm credentials.');
      console.error('- Example (PowerShell): mongosh "<your-uri>"');
    }

    // In development, don't kill the process — allow the server to start so other routes or mock flows can run.
    if (process.env.NODE_ENV === 'production'){
      console.error('[db] Exiting because NODE_ENV=production and DB connection failed');
      process.exit(1);
    } else {
      console.warn('[db] Continuing without DB connection (NODE_ENV!=production).');
      return null;
    }
  }
};

module.exports = connectDB;
