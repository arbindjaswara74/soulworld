require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const compression = require('compression');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const connectDB = require('./config/db'); // Connect using process.env.MONGODB_URI
const storyRoutes = require('./routes/storyRoutes');
const thoughtRoutes = require('./routes/thoughtRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// --------------------
// Connect to MongoDB
// --------------------
const mongoURI = process.env.MONGODB_URI;
if (!mongoURI) {
  console.warn('⚠️ MONGODB_URI not set. DB connection will be skipped.');
} else {
  connectDB(mongoURI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => {
      console.error('❌ MongoDB connection error:', err.message);
      if (process.env.NODE_ENV !== 'production') {
        console.log('[db] continuing without DB connection (local dev)');
      }
    });
}

// --------------------
// Middlewares
// --------------------
app.use(cors());
app.use(express.json());
app.use(express.static('public', { maxAge: '7d', etag: true }));
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(compression());

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// --------------------
// Routes
// --------------------
app.use('/api/stories', storyRoutes);
app.use('/api/thoughts', thoughtRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// --------------------
// Error handling
// --------------------
app.use(notFound);
app.use(errorHandler);

// --------------------
// Socket.io Setup
// --------------------
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Temporary 7-person group chat logic
const groups = []; // { id: 'group-1', users: [] }

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

  socket.on('message', (msg) => {
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

// --------------------
// Start server
// --------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`SoulWorld backend with chat running on port ${PORT}`);
});
