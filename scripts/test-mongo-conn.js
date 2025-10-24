#!/usr/bin/env node
// backend/scripts/test-mongo-conn.js
// Simple tester to validate MongoDB credentials/URI from env or CLI

const path = require('path');
// Load backend .env if present so the tester picks up local env vars
try { require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); } catch(e) {}
const mongoose = require('mongoose');
const { buildUriFromEnv } = require('../config/db');

function maskUri(uri){
  try{ return uri.replace(/(mongodb(?:\+srv)?:\/\/)([^:@\/]+)(:)([^@\/]+)(@)/, (m,p,user,colon,pass,at)=>`${p}${user}${colon}****${at}`); }catch(e){return uri;}
}

async function test(uri){
  console.log('[test-mongo-conn] Testing URI:', maskUri(uri));
  try{
    const c = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 5000 }).asPromise();
    console.log('[test-mongo-conn] Connected OK');
    await c.close();
    process.exit(0);
  }catch(err){
    const msg = err && err.message ? err.message : String(err);
    console.error('[test-mongo-conn] Connection failed:', msg);
    if(/ENOTFOUND|querySrv/i.test(msg)){
      console.error('\nDNS SRV lookup failed. This usually means the host is incorrect or incomplete for mongodb+srv URIs.');
      console.error(' - If you used DB_HOST like "cluster0.mongodb.net" that is incomplete. Use the full host from Atlas (e.g. cluster0.xxxxx.mongodb.net).');
      console.error(' - Try a DNS SRV check: nslookup -type=SRV _mongodb._tcp.<your-host>');
      console.error(' - Alternatively set a full MONGODB_URI copied from Atlas.');
    }
    process.exit(2);
  }
}

// CLI: allow passing components
const argv = require('minimist')(process.argv.slice(2));
let uri = process.env.MONGODB_URI || '';
if(!uri){
  // try to build from parts
  uri = buildUriFromEnv({ user: argv.user, pass: argv.pass, host: argv.host, dbName: argv.db });
}
if(!uri){
  console.error('No MongoDB URI available. Provide MONGODB_URI env or --host and optionally --user --pass --db');
  process.exit(3);
}

test(uri);
