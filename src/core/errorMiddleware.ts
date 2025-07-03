import { Request, Response, NextFunction } from 'express';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';

const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Something went wrong';

  if (err instanceof PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        status = 400;
        message = Array.isArray(err.meta?.target)
          ? `Unique constraint failed on: ${err.meta.target.join(', ')}`
          : `Unique constraint failed`;
        break;

      case 'P2025':
        status = 404;
        message = 'Record not found';
        break;

      case 'P2003':
        status = 400;
        message = 'Foreign key constraint failed';
        break;

      default:
        status = 500;
        message = `Prisma error: ${err.message}`;
    }
  }

  if (err instanceof PrismaClientValidationError) {
    status = 400;
    message = `Validation error: ${err.message}`;
  }

  if (message === 'JsonWebTokenError') {
    message = 'Invalid token';
    status = 401;
  }

  res.status(status).json({
    success: false,
    status,
    message,
  });
};

export default errorMiddleware;
