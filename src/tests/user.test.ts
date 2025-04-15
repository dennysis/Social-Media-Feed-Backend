import mockPrisma from './mockDatabase';

jest.mock('../config/database', () => {
  return {
    __esModule: true,
    default: mockPrisma
  };
});

// Mock the email service
jest.mock('../utils/emailService', () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  generatePasswordResetToken: jest.fn().mockResolvedValue('mock-reset-token'),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined)
}));

import { createTestServer, createTestUsers, generateToken } from './setup';
import bcrypt from 'bcrypt';
import { sendWelcomeEmail, generatePasswordResetToken, sendPasswordResetEmail } from '../utils/emailService';

describe('User Authentication', () => {
  let server: any;
  
  beforeAll(async () => {
    server = await createTestServer();
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
    await mockPrisma.$disconnect();
  });

  test('Register a new user', async () => {
    const registerMutation = `
      mutation {
        register(username: "newuser", email: "new@example.com", password: "password123") {
          token
          user {
            id
            username
            email
          }
        }
      }
    `;

    const result = await server.executeOperation({
      query: registerMutation
    });

    expect(result.body.singleResult.errors).toBeUndefined();
    expect(result.body.singleResult.data.register.token).toBeDefined();
    expect(result.body.singleResult.data.register.user.username).toBe('newuser');
    expect(result.body.singleResult.data.register.user.email).toBe('new@example.com');
    
    // Verify welcome email was sent
    expect(sendWelcomeEmail).toHaveBeenCalledWith('new@example.com', 'newuser');
  });

  test('Login with valid credentials', async () => {
    jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

    const loginMutation = `
      mutation {
        login(email: "login@example.com", password: "password123") {
          token
          user {
            id
            username
            email
          }
        }
      }
    `;

    const result = await server.executeOperation({
      query: loginMutation
    });

    expect(result.body.singleResult.errors).toBeUndefined();
    expect(result.body.singleResult.data.login.token).toBeDefined();
    expect(result.body.singleResult.data.login.user.username).toBe('logintest');
    expect(result.body.singleResult.data.login.user.email).toBe('login@example.com');
  });

  test('Login with invalid credentials', async () => {
    jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

    const loginMutation = `
      mutation {
        login(email: "login@example.com", password: "wrongpassword") {
          token
          user {
            id
            username
            email
          }
        }
      }
    `;

    const result = await server.executeOperation({
      query: loginMutation
    });

    expect(result.body.singleResult.errors).toBeDefined();
    expect(result.body.singleResult.errors[0].extensions.code).toBe('UNAUTHENTICATED');
  });
  
  test('Request password reset', async () => {
    // Mock the user find
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 1,
      username: 'resetuser',
      email: 'reset@example.com',
      password: 'hashedpassword',
      createdAt: new Date()
    });
    
    // Mock the password reset creation
    mockPrisma.passwordReset.upsert.mockResolvedValueOnce({
      id: 1,
      userId: 1,
      token: 'hashed-token',
      expiresAt: new Date(Date.now() + 3600000),
      createdAt: new Date()
    });
    
    const requestResetMutation = `
      mutation {
        requestPasswordReset(email: "reset@example.com") {
          success
          message
        }
      }
    `;
    
    const result = await server.executeOperation({
      query: requestResetMutation
    });
    
    expect(result.body.singleResult.errors).toBeUndefined();
    expect(result.body.singleResult.data.requestPasswordReset.success).toBe(true);
    expect(generatePasswordResetToken).toHaveBeenCalledWith(1);
    expect(sendPasswordResetEmail).toHaveBeenCalledWith('reset@example.com', 'resetuser', 'mock-reset-token');
  });
  
  test('Reset password with valid token', async () => {
    // Mock finding the password reset record
    mockPrisma.passwordReset.findFirst.mockResolvedValueOnce({
      id: 1,
      userId: 1,
      token: 'hashed-token',
      expiresAt: new Date(Date.now() + 3600000),
      createdAt: new Date()
    });
    
    // Mock updating the user password
    mockPrisma.user.update.mockResolvedValueOnce({
      id: 1,
      username: 'resetuser',
      email: 'reset@example.com',
      password: 'new-hashed-password',
      createdAt: new Date()
    });
    
    // Mock deleting the password reset record
    mockPrisma.passwordReset.delete.mockResolvedValueOnce({
      id: 1,
      userId: 1,
      token: 'hashed-token',
      expiresAt: new Date(Date.now() + 3600000),
      createdAt: new Date()
    });
    
    const resetPasswordMutation = `
      mutation {
        resetPassword(token: "valid-token", newPassword: "newpassword123") {
          success
          message
        }
      }
    `;
    
    const result = await server.executeOperation({
      query: resetPasswordMutation
    });
    
    expect(result.body.singleResult.errors).toBeUndefined();
    expect(result.body.singleResult.data.resetPassword.success).toBe(true);
    expect(mockPrisma.user.update).toHaveBeenCalled();
    expect(mockPrisma.passwordReset.delete).toHaveBeenCalled();
  });
  
  test('Reset password with invalid token', async () => {
    // Mock finding no password reset record (invalid token)
    mockPrisma.passwordReset.findFirst.mockResolvedValueOnce(null);
    
    const resetPasswordMutation = `
      mutation {
        resetPassword(token: "invalid-token", newPassword: "newpassword123") {
          success
          message
        }
      }
    `;
    
    const result = await server.executeOperation({
      query: resetPasswordMutation
    });
    
    expect(result.body.singleResult.errors).toBeDefined();
    expect(result.body.singleResult.errors[0].extensions.code).toBe('BAD_USER_INPUT');
  });
});
