import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Server as SocketIOServer } from 'socket.io';
import { attachSession, requireCsrf } from './src/server/authMiddleware.ts';
import authRouter from './src/server/routes/auth.ts';
import { createAuctionsRouter } from './src/server/routes/auctions.ts';
import { createAdminRouter } from './src/server/routes/admin.ts';
import { startAuctionLifecycleWorker } from './src/server/auctionWorker.ts';
import { registerSlotSocketHandlers } from './src/server/slotManager.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new SocketIOServer(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  // Trust Cloud Run / reverse proxy for secure cookies & IP rate limiting
  app.set('trust proxy', 1);

  // Security headers (XSS, clickjacking, MIME sniffing)
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      frameguard: false, // Allow embedding inside AI Studio preview iframe
    })
  );

  app.use(cookieParser());
  app.use(express.json({ limit: '12mb' }));
  app.use(express.urlencoded({ extended: true, limit: '12mb' }));

  // Attach authenticated user & rotating HTTP-only session
  app.use('/api', attachSession);
  app.use('/api', requireCsrf);

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api', createAuctionsRouter(io));
  app.use('/api/admin', createAdminRouter(io));

  // Healthcheck
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // Socket.IO connection tracking
  registerSlotSocketHandlers(io);
  io.on('connection', (socket) => {
    socket.on('auction:join', (auctionId: number) => {
      if (Number.isInteger(auctionId)) {
        socket.join(`auction:${auctionId}`);
      }
    });
  });

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve generated assets and built SPA in production
    app.use(
      '/src/assets/images',
      express.static(path.resolve(__dirname, 'src/assets/images'))
    );
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`NaijaAuction full-stack server running on http://0.0.0.0:${PORT}`);
    startAuctionLifecycleWorker(io);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
