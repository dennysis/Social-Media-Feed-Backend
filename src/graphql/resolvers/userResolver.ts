import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

import prisma from '../../config/database';
import { GraphQLError } from 'graphql';
import { sendWelcomeEmail, generatePasswordResetToken, sendPasswordResetEmail } from '../../utils/emailService';
import { logger } from '../../utils/logger';

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
      try {
        const hashedPassword = await (bcrypt as any).hash(password, 10);
        const user = await prisma.user.create({
          data: {
            username,
            email,
            password: hashedPassword
          }
        });
        
      
        sendWelcomeEmail(email, username).catch(error => {
          logger.error(`Failed to send welcome email: ${error}`);
        });
        
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        return { token, user };
      } catch (error) {
        logger.error(`Registration error: ${error}`);
        throw new GraphQLError('Registration failed', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }
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
    },
    requestPasswordReset: async (_: any, { email }: { email: string }) => {
      try {
  
        const user = await prisma.user.findUnique({ where: { email } });
        
        if (!user) {
       
          return {
            success: true,
            message: 'If your email is registered, you will receive a password reset link'
          };
        }
        
        const resetToken = await generatePasswordResetToken(user.id);
        

        sendPasswordResetEmail(user.email, user.username, resetToken).catch(error => {
          logger.error(`Failed to send password reset email: ${error}`);
        });
        
        return {
          success: true,
          message: 'Password reset link sent to your email'
        };
      } catch (error) {
        logger.error(`Password reset request error: ${error}`);
        return {
          success: false,
          message: 'Failed to process password reset request'
        };
      }
    },
    resetPassword: async (_: any, { token, newPassword }: { token: string; newPassword: string }) => {
      try {
        // Hash the token from the URL
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        
        // Find the password reset record
        const passwordReset = await prisma.passwordReset.findFirst({
          where: {
            token: hashedToken,
            expiresAt: {
              gt: new Date()
            }
          },
          include: {
            user: true
          }
        });
        
        if (!passwordReset) {
          // This needs to throw a GraphQL error for the test to pass
          throw new GraphQLError('Invalid or expired password reset token', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }
        
        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update the user's password
        await prisma.user.update({
          where: { id: passwordReset.userId },
          data: { password: hashedPassword }
        });
        
        // Delete the password reset record
        await prisma.passwordReset.delete({
          where: { id: passwordReset.id }
        });
        
        return {
          success: true,
          message: 'Password has been reset successfully'
        };
      } catch (error) {
        // If it's already a GraphQL error, rethrow it
        if (error instanceof GraphQLError) {
          throw error;
        }
        
        // Log the error but still throw a GraphQL error for the client
        logger.error(`Password reset error: ${error}`);
        throw new GraphQLError('Failed to reset password', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    }
  }
};    

export default userResolver;
