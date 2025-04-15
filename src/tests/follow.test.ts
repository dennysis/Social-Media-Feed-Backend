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

describe('Follow Functionality', () => {
  let server: any;
  let user1: any;
  let user2: any;
  
  beforeAll(async () => {
    try {
      console.log('Starting test server...');
      server = await createTestServer();
      console.log('Test server started');
    } catch (error) {
      console.error('Error starting test server:', error);
      throw error;
    }
  });

  afterAll(async () => {
    try {
      console.log('Stopping test server...');
      await server.stop();
      console.log('Test server stopped');
    } catch (error) {
      console.error('Error stopping test server:', error);
    }
  });

  beforeEach(async () => {
    try {
      console.log('Setting up test users...');
      const users = await createTestUsers();
      user1 = users.user1;
      user2 = users.user2;
      console.log('Test users set up');
      
      // Reset mock implementations for each test
      mockPrisma.follow.findFirst.mockReset();
      mockPrisma.follow.create.mockReset();
      mockPrisma.follow.delete.mockReset();
      mockPrisma.user.findUnique.mockReset();
      
      // Set up user.findUnique mock to return proper user data
      mockPrisma.user.findUnique.mockImplementation((args) => {
        if (args.where.id === 1) {
          return Promise.resolve({
            id: 1,
            username: 'testuser1',
            email: 'test1@example.com',
            password: 'hashedpassword123'
          });
        } else if (args.where.id === 2) {
          return Promise.resolve({
            id: 2,
            username: 'testuser2',
            email: 'test2@example.com',
            password: 'hashedpassword123'
          });
        } else {
          return Promise.resolve(null);
        }
      });
      
      // Set up follow.create mock to return proper follow data
      mockPrisma.follow.create.mockImplementation((data) => {
        const followerId = data.data.follower.connect.id;
        const followingId = data.data.following.connect.id;
        
        return Promise.resolve({
          id: 1,
          followerId,
          followingId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });
    } catch (error) {
      console.error('Error setting up test users:', error);
      throw error;
    }
  });

  test('Follow a user', async () => {
    try {
      console.log('Testing follow user...');
      
      // Mock the Follow.follower resolver to return a user
      mockPrisma.user.findUnique.mockImplementation((args) => {
        if (args.where.id === 2) {
          return Promise.resolve({
            id: 2,
            username: 'testuser2',
            email: 'test2@example.com',
            password: 'hashedpassword123'
          });
        } else if (args.where.id === 1) {
          return Promise.resolve({
            id: 1,
            username: 'testuser1',
            email: 'test1@example.com',
            password: 'hashedpassword123'
          });
        }
        return Promise.resolve(null);
      });
      
      const followUserMutation = `
        mutation {
          followUser(userId: ${user1.id}) {
            id
            follower {
              username
            }
            following {
              username
            }
          }
        }
      `;

      console.log('Executing operation...');
      const result = await server.executeOperation({
        query: followUserMutation
      }, {
        contextValue: {
          user: { id: user2.id, email: user2.email }
        }
      });

      console.log('Operation result:', JSON.stringify(result.body.singleResult, null, 2));

      // If there are errors, log them for debugging
      if (result.body.singleResult.errors) {
        console.error('GraphQL errors:', JSON.stringify(result.body.singleResult.errors, null, 2));
      }

      // Check if the data exists before asserting on it
      if (result.body.singleResult.data && result.body.singleResult.data.followUser) {
        expect(result.body.singleResult.data.followUser.follower.username).toBe('testuser2');
        expect(result.body.singleResult.data.followUser.following.username).toBe('testuser1');
      } else {
        // If data doesn't exist, fail the test with a helpful message
        fail('Expected followUser data to be returned, but got: ' + 
             JSON.stringify(result.body.singleResult, null, 2));
      }
      
      console.log('Follow user test completed');
    } catch (error) {
      console.error('Error in follow user test:', error);
      throw error;
    }
  });

  test('Fail to follow yourself', async () => {
    const followUserMutation = `
      mutation {
        followUser(userId: ${user1.id}) {
          id
        }
      }
    `;

    const result = await server.executeOperation({
      query: followUserMutation
    }, {
      contextValue: {
        user: { id: user1.id, email: user1.email }
      }
    });

    expect(result.body.singleResult.errors).toBeDefined();
    expect(result.body.singleResult.errors[0].extensions.code).toBe('BAD_USER_INPUT');
  });

  test('Fail to follow when not authenticated', async () => {
    const followUserMutation = `
      mutation {
        followUser(userId: ${user1.id}) {
          id
        }
      }
    `;

    const result = await server.executeOperation({
      query: followUserMutation
    }, {
      contextValue: {} // No user in context
    });

    expect(result.body.singleResult.errors).toBeDefined();
    expect(result.body.singleResult.errors[0].extensions.code).toBe('UNAUTHENTICATED');
  });

  test('Unfollow a user', async () => {
    // Mock finding an existing follow record
    mockPrisma.follow.findFirst.mockResolvedValue({
      id: 1,
      followerId: user2.id,
      followingId: user1.id,
      createdAt: new Date()
    });

    const unfollowUserMutation = `
      mutation {
        unfollowUser(userId: ${user1.id})
      }
    `;

    const result = await server.executeOperation({
      query: unfollowUserMutation
    }, {
      contextValue: {
        user: { id: user2.id, email: user2.email }
      }
    });

    expect(result.body.singleResult.errors).toBeUndefined();
    expect(result.body.singleResult.data.unfollowUser).toBe(true);
  });

  test('Fail to unfollow a user you are not following', async () => {
    // Mock not finding a follow record
    mockPrisma.follow.findFirst.mockResolvedValue(null);

    const unfollowUserMutation = `
      mutation {
        unfollowUser(userId: ${user1.id})
      }
    `;

    const result = await server.executeOperation({
      query: unfollowUserMutation
    }, {
      contextValue: {
        user: { id: user2.id, email: user2.email }
      }
    });

    expect(result.body.singleResult.errors).toBeDefined();
    expect(result.body.singleResult.errors[0].extensions.code).toBe('BAD_USER_INPUT');
  });

  test('Fail to unfollow when not authenticated', async () => {
    const unfollowUserMutation = `
      mutation {
        unfollowUser(userId: ${user1.id})
      }
    `;

    const result = await server.executeOperation({
      query: unfollowUserMutation
    }, {
      contextValue: {} // No user in context
    });

    expect(result.body.singleResult.errors).toBeDefined();
    expect(result.body.singleResult.errors[0].extensions.code).toBe('UNAUTHENTICATED');
  });
});