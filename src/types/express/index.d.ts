import * as express from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & { id: number; email: string };
      file?:any;
    }
  }
}

export {};