import { Express } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: any; // Define a more specific type based on your user structure
    }
  }
}
