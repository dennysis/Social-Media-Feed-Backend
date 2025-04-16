import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { logger } from '../utils/logger';

export const checkDatabaseConnection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    next();
  } catch (error) {
    logger.error(`Database connection error: ${error}`);
    return res.status(503).json({ 
      error: 'Database service unavailable', 
      message: 'The application is experiencing database connectivity issues. Please try again later.'
    });
  }
};
