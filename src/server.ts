import express from 'express';
import http from 'http';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs, resolvers } from './schema';
import * as bodyParser from 'body-parser';
import router from './routes/index';
import { authMiddleware } from './middleware/authMiddleware';

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  
  app.use('/', router);
  
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await apolloServer.start();
  
  app.use('/graphql', authMiddleware);
  
  app.use(
    '/graphql',
    cors(),
    bodyParser.json(),
    expressMiddleware(apolloServer, {
      context: async ({ req }) => {
        return { user: (req as any).user };
      },
    }),
  );

  return { app, httpServer };
}

export { startServer };
