// First, import the mock database
import mockPrisma from './mockDatabase';

// Then, mock the database module
jest.mock('../config/database', () => {
  return {
    __esModule: true,
    default: mockPrisma
  };
});

// Now import everything else
import { createTestServer, createTestUsers, generateToken } from './setup';
import bcrypt from 'bcrypt';

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
  });

  test('Login with valid credentials', async () => {
    // Mock bcrypt.compare to return true for our test
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
    // Mock bcrypt.compare to return false for our test
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
});
