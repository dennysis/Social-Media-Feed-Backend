import mockPrisma from './mockDatabase';

jest.mock('../config/database', () => {
  return {
    __esModule: true,
    default: mockPrisma
  };
});

import { ApolloServer } from '@apollo/server';
import { typeDefs, resolvers } from '../schema';
import jwt from 'jsonwebtoken';

export async function createTestServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });
  
  await server.start();
  
  return {
    executeOperation: (args: any, context?: any) => server.executeOperation(args, context),
    start: async () => {},
    stop: async () => server.stop()
  };
}

export async function createTestUsers() {
  console.log('Creating mock test users...');
  
  const user1 = {
    id: 1,
    username: 'testuser1',
    email: 'test1@example.com',
    password: 'hashedpassword1',
    createdAt: new Date()
  };
  
  const user2 = {
    id: 2,
    username: 'testuser2',
    email: 'test2@example.com',
    password: 'hashedpassword2',
    createdAt: new Date()
  };
  
  mockPrisma.user.findUnique.mockImplementation((args) => {
    if (args.where.id === 1) return Promise.resolve(user1);
    if (args.where.id === 2) return Promise.resolve(user2);
    if (args.where.email === 'test1@example.com') return Promise.resolve(user1);
    if (args.where.email === 'test2@example.com') return Promise.resolve(user2);
    return Promise.resolve(null);
  });
  
  console.log('Mock test users created successfully');
  
  return { user1, user2 };
}

export function generateToken(user: any) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || 'test_secret_key',
    { expiresIn: '1d' }
  );
}
