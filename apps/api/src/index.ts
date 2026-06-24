import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Routes
import authRoutes from './routes/auth';
import driverRoutes from './routes/drivers';
import tripRoutes from './routes/trips';
import adminRoutes from './routes/admin';
import uploadRoutes from './routes/uploads';
import paymentRoutes from './routes/payments.routes';
import configRoutes from './routes/config';
import agentRoutes from './routes/agent';
import financeRoutes from './routes/finances';

// Socket handler
import { setupSocketHandlers } from './socket/handlers';

const app = express();
const httpServer = createServer(app);

// ─── CORS configuration ───────────────────────────────────────────────────
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // 1. Siempre permitir peticiones sin origen (Nativas Móviles / Postman / Servidor a Servidor)
    if (!origin) return callback(null, true);
    
    const clientUrl = process.env.CLIENT_URL;
    const adminUrl = process.env.ADMIN_URL;
    const matchesEnv = (clientUrl && origin === clientUrl) || (adminUrl && origin === adminUrl);

    // 2. Si es Producción, ser muy estricto
    if (process.env.NODE_ENV === 'production') {
      // Las apps híbridas (Capacitor/Ionic) en móviles a veces envían estos origenes
      const isMobileApp = origin === 'capacitor://localhost' || origin === 'http://localhost';
      
      if (matchesEnv || isMobileApp) {
        callback(null, true);
      } else {
        callback(new Error(`Origen no permitido por CORS en Producción: ${origin}`));
      }
      return;
    }

    // 3. Si es Desarrollo (Local), ser más flexible
    const isLocal = /^(http|capacitor):\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin);
    const isVercel = /\.vercel\.app$/.test(origin);
    
    if (isLocal || isVercel || matchesEnv) {
      callback(null, true);
    } else {
      callback(new Error(`Origen no permitido por CORS: ${origin}`));
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
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Permite que tus imágenes en /uploads carguen en tu app
}));

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

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ─── Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/config', configRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/finances', financeRoutes);

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
