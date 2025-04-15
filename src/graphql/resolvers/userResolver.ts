// import bcrypt from 'bcrypt';
import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import prisma from '../../config/database';
import { GraphQLError } from 'graphql';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const userResolver = {
  Query: {
    me: async (_: any, __: any, { user }: any) => {
      if (!user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }
      return prisma.user.findUnique({ where: { id: user.id } });
    },
    user: async (_: any, { id }: { id: number }) => {
      return prisma.user.findUnique({ where: { id } });
    }
  },
  Mutation: {
    register: async (_: any, { username, email, password }: { username: string; email: string; password: string; }) => {
      const hashedPassword = await (bcrypt as any).hash(password, 10);
      const user = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword
        }
      });
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      return { token, user };
    },
    login: async (_: any, { email, password }: { email: string; password: string; }) => {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        throw new GraphQLError('Invalid password', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      return { token, user };
    }
  }
};

export default userResolver;
