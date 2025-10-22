require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const compression = require('compression');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const connectDB = require('./config/db'); // Ensure this connects using process.env.MONGODB_URI
// buildUriFromEnv is attached to the exported function in config/db
const buildUriFromEnv = connectDB.buildUriFromEnv;
const storyRoutes = require('./routes/storyRoutes');
const thoughtRoutes = require('./routes/thoughtRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// Connect to MongoDB - prefer MONGODB_URI, fall back to discrete env vars (DB_USER/DB_PASS/DB_HOST/DB_NAME)
const chosenUri = process.env.MONGODB_URI || buildUriFromEnv() || undefined;
connectDB(chosenUri);

// Middlewares
app.use(cors());
app.use(express.json());
// Serve static files. Prefer frontend/public (common layout) then fall back to ../public
const fs = require('fs');
let staticDir = path.join(__dirname, '..', 'frontend', 'public');
if (!fs.existsSync(staticDir)) {
  staticDir = path.join(__dirname, '..', 'public');
}
console.log('[server] serving static files from', staticDir);
app.use(express.static(staticDir, {
  maxAge: '7d',
  etag: true,
}));
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(compression());

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// Routes
app.use('/api/stories', storyRoutes);
app.use('/api/thoughts', thoughtRoutes);

// Health check route — include DB connection state for easier diagnostics
app.get('/api/health', (req, res) => {
  const ready = mongoose && mongoose.connection ? mongoose.connection.readyState : 0; // 0 = disconnected, 1 = connected
  const dbState = {
    readyState: ready,
    connected: ready === 1,
  };
  res.json({ status: 'ok', time: new Date(), db: dbState });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server — use app.listen so the returned HTTP server can be given to Socket.io
const PORT = process.env.PORT || 5000;
// Bind to 0.0.0.0 to ensure the server listens on all IPv4 interfaces (avoids IPv6-only binding issues on some systems)
let server;
try {
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
} catch (listenErr) {
  console.error('[server] Failed to start HTTP server:', listenErr && listenErr.message ? listenErr.message : listenErr);
  process.exit(1);
}

// Handle server errors (eg. EADDRINUSE)
server.on('error', (err) => {
  console.error('[server] HTTP server error:', err && err.message ? err.message : err);
  if (err && err.code === 'EADDRINUSE'){
    console.error(`[server] Port ${PORT} is already in use. Make sure no other process is listening on this port.`);
  }
});

// Attach Socket.io to the running server
const io = new Server(server, {
  cors: { origin: '*' },
});

// --- 7-Person Temporary Chat Logic ---
const groups = []; // {id: 'group-1', users: []}

function joinGroup(socket) {
  let group = groups.find(g => g.users.length < 7);
  if (!group) {
    group = { id: `group-${groups.length + 1}`, users: [] };
    groups.push(group);
  }
  group.users.push(socket.id);
  socket.join(group.id);
  socket.groupId = group.id;
  socket.emit('joined', group.id);
  console.log(`Socket ${socket.id} joined ${group.id}`);
}

io.on('connection', (socket) => {
  joinGroup(socket);

  socket.on('message', msg => {
    io.to(socket.groupId).emit('message', { id: socket.id, text: msg });
  });

  socket.on('disconnect', () => {
    const group = groups.find(g => g.id === socket.groupId);
    if (group) {
      group.users = group.users.filter(u => u !== socket.id);
      if (group.users.length === 0) {
        groups.splice(groups.indexOf(group), 1);
        console.log(`Removed empty group ${group.id}`);
      }
    }
  });
});

// Process-level handlers for unhandled errors to help debugging during development
process.on('unhandledRejection', (reason, promise) => {
  console.error('[process] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[process] Uncaught Exception:', err && err.stack ? err.stack : err);
  // In production, it's safer to exit; in dev we log and keep running
  if (process.env.NODE_ENV === 'production') process.exit(1);
});
