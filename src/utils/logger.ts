// logger.ts
import fs from 'fs';
import path from 'path';
import winston from 'winston';

// Define logs directory
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

// Create base logger
const baseLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: {
    service: process.env.SERVICE_NAME || 'new-chapter',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
      tailable: true
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
      tailable: true
    })
  ]
});

// Add console transport for dev
if (process.env.NODE_ENV !== 'production') {
  baseLogger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          ({ level, message, timestamp, ...meta }) =>
            `[${timestamp}] ${level}: ${message}${Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
            }`
        )
      )
    })
  );
}

// 🔧 Extend the Winston Logger type
interface ContextualLogger extends winston.Logger {
  createContext(context?: Record<string, unknown>): winston.Logger;
}

const logger = baseLogger as ContextualLogger;

// Add the helper
logger.createContext = (context = {}) => logger.child(context);

export default logger;
