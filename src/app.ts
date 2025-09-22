import express, { Application, Request, Response } from "express";
import cors from "cors";
import passport from "passport";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import { corsUrl } from "./config/secrets";
import errorMiddleware from "./middleware/errorMiddleware";
import logger from "./utils/logger";
import cookieParser from "cookie-parser";

import "./config/passport-Jwt-Statergy"; // Initialize passport JWT strategy

const app: Application = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // More restrictive in production
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path
    });
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// Compression middleware
app.use(compression());

// Apply rate limiting to API routes
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: corsUrl || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Raw body parser for webhooks (must be before JSON parser)
app.use('/api/v1/subscriptions/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static("uploads"));
app.use(passport.initialize());
app.use(cookieParser())

//welcome route
app.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "🪑 NewChapter: Furniture Shop Management API",
    version: "1.0.0",
  });
});

// Import routes
import router from "./routes";
import healthRouter from "./routes/health";

// Health check routes (before authentication)
app.use("/api/v1/", healthRouter);

// Use main routes
app.use("/api/v1/", router);

// Error handling middleware
app.use(errorMiddleware);

export default app;
