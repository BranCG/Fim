import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Routes
import authRoutes from './routes/auth';
import driverRoutes from './routes/drivers';
import tripRoutes from './routes/trips';
import adminRoutes from './routes/admin';
import uploadRoutes from './routes/uploads';
import paymentRoutes from './routes/payments.routes';

// Socket handler
import { setupSocketHandlers } from './socket/handlers';

const app = express();
const httpServer = createServer(app);

// ─── CORS configuration for local network testing ──────────────────────────
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true);
    // Allow http:// and capacitor:// origins for local dev subnets
    const isLocal = /^(http|capacitor):\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin);
    // Allow Vercel deployments (production/preview)
    const isVercel = /\.vercel\.app$/.test(origin);
    
    if (isLocal || isVercel) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

// ─── Socket.io ────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    ...corsOptions,
    methods: ['GET', 'POST'],
  },
});
app.set('io', io);


import fs from 'fs';

// ─── Middleware ────────────────────────────────────────────────────────────
// Logger middleware to write requests to a file for mobile debugging
app.use((req, res, next) => {
  const logFile = path.join(__dirname, '..', 'api-debug.log');
  const start = Date.now();
  
  const originalSend = res.send;
  res.send = function (body) {
    const duration = Date.now() - start;
    const logLine = `[${new Date().toISOString()}] ${req.method} ${req.url} - Status: ${res.statusCode} - Origin: ${req.headers.origin || 'none'} - Duration: ${duration}ms - Body: ${body}\n`;
    fs.appendFileSync(logFile, logLine);
    return originalSend.apply(res, arguments as any);
  };
  
  next();
});

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ─── Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentRoutes);

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'Fim API' });
});
// ─── Socket.io handlers ───────────────────────────────────────────────────
setupSocketHandlers(io);

// ─── Start server ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════╗
║     🚗  FIM API SERVER           ║
║     Running on port ${PORT}         ║
║     http://localhost:${PORT}        ║
╚═══════════════════════════════════╝
  `);
});

export { io };
