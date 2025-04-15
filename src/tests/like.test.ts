import mockPrisma from './mockDatabase';

jest.mock('../config/database', () => {
  return {
    __esModule: true,
    default: mockPrisma
  };
});

import { createTestServer, createTestUsers, generateToken } from './setup';

describe('Like Functionality', () => {
  let server: any;
  let user1: any;
  let user2: any;
  let post: any;
  
  beforeAll(async () => {
    server = await createTestServer();
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
    await mockPrisma.$disconnect();
  });

  beforeEach(async () => {
    const users = await createTestUsers();
    user1 = users.user1;
    user2 = users.user2;
    
    post = {
      id: 1,
      content: 'Test post for likes',
      authorId: user1.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockPrisma.like.create.mockClear();
    mockPrisma.like.findFirst.mockClear();
    mockPrisma.like.delete.mockClear();
    mockPrisma.post.findUnique.mockImplementation((args) => {
      if (args.where.id === 1) {
        return Promise.resolve(post);
      }
      return Promise.resolve(null);
    });
  });

  test('Like a post', async () => {
    mockPrisma.like.findFirst.mockResolvedValue(null);
    
    const likePostMutation = `
      mutation {
        likePost(postId: ${post.id}) {
          id
          user {
            username
          }
          post {
            content
          }
        }
      }
    `;

    const result = await server.executeOperation({
      query: likePostMutation
    }, {
      contextValue: {
        user: { id: user2.id, email: user2.email }
      }
    });

    expect(result.body.singleResult.errors).toBeUndefined();
    expect(result.body.singleResult.data.likePost.post.content).toBe('Test post for likes');
    expect(result.body.singleResult.data.likePost.user.username).toBe('testuser2');
  });

  test('Fail to like a post twice', async () => {
    mockPrisma.like.findFirst.mockResolvedValue({
      id: 1,
      postId: post.id,
      userId: user2.id,
      createdAt: new Date()
    });
    
    const likePostMutation = `
      mutation {
        likePost(postId: ${post.id}) {
          id
        }
      }
    `;

    const result = await server.executeOperation({
      query: likePostMutation
    }, {
      contextValue: {
        user: { id: user2.id, email: user2.email }
      }
    });

    expect(result.body.singleResult.errors).toBeDefined();
    expect(result.body.singleResult.errors[0].extensions.code).toBe('BAD_USER_INPUT');
  });

  test('Unlike a post', async () => {
    mockPrisma.like.findFirst.mockResolvedValue({
      id: 1,
      postId: post.id,
      userId: user2.id,
      createdAt: new Date()
    });
    
    const unlikePostMutation = `
      mutation {
        unlikePost(postId: ${post.id})
      }
    `;

    const result = await server.executeOperation({
      query: unlikePostMutation
    }, {
      contextValue: {
        user: { id: user2.id, email: user2.email }
      }
    });

    expect(result.body.singleResult.errors).toBeUndefined();
    expect(result.body.singleResult.data.unlikePost).toBe(true);
  });

  test('Fail to unlike a post that is not liked', async () => {
    mockPrisma.like.findFirst.mockResolvedValue(null);
    
    const unlikePostMutation = `
      mutation {
        unlikePost(postId: ${post.id})
      }
    `;

    const result = await server.executeOperation({
      query: unlikePostMutation
    }, {
      contextValue: {
        user: { id: user2.id, email: user2.email }
      }
    });

    expect(result.body.singleResult.errors).toBeDefined();
    expect(result.body.singleResult.errors[0].extensions.code).toBe('BAD_USER_INPUT');
  });
});
