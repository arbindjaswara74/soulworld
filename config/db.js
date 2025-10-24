const mongoose = require('mongoose');

function maskUri(uri){
  try{
    // Try to mask password in mongodb uri: mongodb+srv://user:pass@host/...
    return uri.replace(/(mongodb(?:\+srv)?:\/\/)([^:@\/]+)(:)([^@\/]+)(@)/, (m,p,user,colon,pass,at) => {
      return `${p}${user}${colon}****${at}`;
    });
  }catch(e){ return uri; }
}

const dns = require('dns').promises;

const connectDB = async (providedUri) => {
  // Allow building the URI from discrete environment variables to avoid encoding mistakes
  let uri = providedUri || process.env.MONGODB_URI || '';
  if(!uri){
    const user = process.env.DB_USER;
    const pass = process.env.DB_PASS;
    const host = process.env.DB_HOST; // e.g. cluster0.xxxxx.mongodb.net
    const name = process.env.DB_NAME || 'soulworld';
    if(user && pass && host){
      const encPass = encodeURIComponent(pass);
      // Default to SRV (Atlas) if host looks like a cluster host
      const isSrv = host.indexOf('mongodb.net') !== -1 || host.indexOf('cluster') !== -1;
      uri = isSrv ? `mongodb+srv://${user}:${encPass}@${host}/${name}?retryWrites=true&w=majority` : `mongodb://${user}:${encPass}@${host}/${name}`;
      console.log('[db] constructed MongoDB URI from DB_USER/DB_HOST (password masked)');
    }
  }
  uri = uri || 'mongodb://localhost:27017/soulworld';
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
    const msg = err && err.message ? err.message : String(err);
    console.error('❌ MongoDB connection error:', msg);

    // If SRV DNS lookup failed, try to resolve SRV record to give better guidance or attempt fallback
    try {
      if (uri.startsWith('mongodb+srv://')){
        // extract host from uri
        const m = uri.match(/^mongodb(?:\+srv)?:\/\/([^@]+@)?([^\/]+)\/?(.*)$/);
        const host = m && m[2] ? m[2] : null;
        if (host){
          try{
            const srvName = `_mongodb._tcp.${host}`;
            console.log('[db] checking SRV records for', srvName);
            const records = await dns.resolveSrv(srvName);
            if(!records || records.length === 0){
              console.warn('[db] No SRV records found for', host);
            } else {
              console.log('[db] SRV records found for', host, records.map(r=>`${r.name}:${r.port}`).slice(0,3));
            }
          }catch(dnsErr){
            // Common case: ENOTFOUND -> no SRV records
            const dnsMsg = dnsErr && dnsErr.code ? `${dnsErr.code}` : String(dnsErr);
            console.warn('[db] DNS SRV lookup error for host', host, dnsMsg);
            if(/ENOTFOUND/i.test(dnsMsg)){
              console.error('\n[db] DNS SRV lookup failed (ENOTFOUND). The host in your URI looks incomplete or incorrect for an Atlas SRV host.');
              console.error(' - Example of a correct Atlas host: cluster0.xxxxx.mongodb.net (copy from Atlas -> Connect -> Your application)');
              // Attempt fallback: try non-SRV connection to the same host (may or may not work)
              try{
                console.log('[db] Attempting fallback to non-SRV connection using host as single host...');
                const fallback = uri.replace(/^mongodb\+srv:\/\//,'mongodb://');
                console.log('[db] fallback URI (masked):', maskUri(fallback));
                await mongoose.connect(fallback, { serverSelectionTimeoutMS: 5000 });
                console.log('✅ Connected to MongoDB via fallback non-SRV');
                return mongoose.connection;
              }catch(fbErr){
                console.error('[db] Fallback non-SRV connection failed:', fbErr && fbErr.message ? fbErr.message : fbErr);
              }
            }
          }
        }
      }
    } catch(e){ /* ignore dns helper errors */ }

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
// Helper: build a mongodb URI from environment components to avoid manual encoding mistakes
function buildUriFromEnv({ user, pass, host, dbName, srv } = {}){
  // Use environment variables as fallback
  user = user || process.env.DB_USER;
  pass = pass || process.env.DB_PASS;
  host = host || process.env.DB_HOST; // e.g. cluster0.xxxxx.mongodb.net
  dbName = dbName || process.env.DB_NAME || '';
  srv = typeof srv === 'boolean' ? srv : (process.env.DB_SRV === 'true' || (process.env.DB_HOST || '').startsWith('cluster'));

  if(!host){
    return null;
  }

  // Basic validation: Atlas SRV hosts usually have at least three segments (e.g. cluster0.xxxxx.mongodb.net)
  if((srv || host.indexOf('mongodb.net') !== -1)){
    const parts = host.split('.');
    // Detect obvious incomplete host like `cluster0.mongodb.net` (missing project id segment)
    if(/^cluster\d+\.mongodb\.net$/.test(host) || (parts.length >= 3 && parts[parts.length-2] === 'mongodb' && parts.length < 4)){
      console.error('[db] Provided DB_HOST looks incomplete for an SRV/Atlas host:', host);
      console.error('[db] Atlas hosts usually look like: cluster0.xxxxx.mongodb.net (note the project id segment).');
      console.error('[db] Please copy the full connection host from Atlas -> Connect -> Your application.');
      return null;
    }
  }

  const u = user ? encodeURIComponent(user) : '';
  const p = pass ? encodeURIComponent(pass) : '';
  const auth = (u && p) ? `${u}:${p}@` : '';
  const dbPath = dbName ? `/${dbName}` : '';

  if(srv || host.indexOf('mongodb+srv://') === 0){
    // Ensure host doesn't already include scheme
    const hostOnly = host.replace(/^mongodb(?:\+srv)?:\/\//,'');
    return `mongodb+srv://${auth}${hostOnly}${dbPath}?retryWrites=true&w=majority`;
  }
  return `mongodb://${auth}${host}${dbPath}`;
}

// Attach helper to exported function for backward compatibility when required
module.exports.buildUriFromEnv = buildUriFromEnv;
