import { logger } from './logger';

export async function withRetry<T>(
  operation: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    if (retries <= 0) {
      logger.error(`Operation failed after multiple retries: ${error.message}`);
      throw error;
    }
    
    logger.warn(`Operation failed, retrying in ${delay}ms... (${retries} retries left)`);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return withRetry(operation, retries - 1, delay * 2);
  }
}
