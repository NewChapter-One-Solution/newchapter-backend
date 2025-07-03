import dotenv from 'dotenv';
dotenv.config();

import { port, host, db } from './secrets';
import app from './app';
import prisma from './db/prisma-client';

const startServer = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Connected to database');

    app.listen(port, host, () => {
      console.log(`🌐 Server running on http://${host}:${port}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
