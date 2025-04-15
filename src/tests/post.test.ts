import mockPrisma from './mockDatabase';

jest.mock('../config/database', () => {
  return {
    __esModule: true,
    default: mockPrisma
  };
});

import { createTestServer, createTestUsers } from './setup';

describe('Post Management', () => {
  let server: any;
  let user1: any;
  let user2: any;
  
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
    
    // Reset mocks
    mockPrisma.post.create.mockClear();
    mockPrisma.post.findMany.mockClear();
    mockPrisma.post.findUnique.mockClear();
    mockPrisma.post.delete.mockClear();
  });

  test('Create a post', async () => {
    const createPostMutation = `
      mutation {
        createPost(content: "Test post content") {
          id
          content
          author {
            username
          }
        }
      }
    `;

    mockPrisma.post.create.mockResolvedValue({
      id: 1,
      content: 'Test post content',
      authorId: user1.id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const result = await server.executeOperation({
      query: createPostMutation
    }, {
      contextValue: {
        user: { id: user1.id, email: user1.email }
      }
    });

    expect(result.body.singleResult.errors).toBeUndefined();
    expect(result.body.singleResult.data.createPost.content).toBe('Test post content');
    expect(mockPrisma.post.create).toHaveBeenCalledWith({
      data: {
        content: 'Test post content',
        author: { connect: { id: user1.id } }
      },
      include: { author: true }
    });
  });

  test('Get all posts', async () => {
    const postsQuery = `
      query {
        posts {
          id
          content
          author {
            username
          }
          likes {
            id
          }
        }
      }
    `;

    mockPrisma.post.findMany.mockResolvedValue([
      {
        id: 1,
        content: 'Test post 1',
        authorId: user1.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        likes: [
          {
            id: 1,
            postId: 1,
            userId: 2,
            createdAt: new Date()
          }
        ]
      },
      {
        id: 2,
        content: 'Test post 2',
        authorId: user2.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        likes: []
      }
    ]);

    const result = await server.executeOperation({
      query: postsQuery
    });

    expect(result.body.singleResult.errors).toBeUndefined();
    expect(result.body.singleResult.data.posts.length).toBe(2);
    expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
      include: { author: true, likes: true }
    });
  });

  test('Delete a post as the author', async () => {
    mockPrisma.post.findUnique.mockResolvedValue({
      id: 1,
      content: 'Test post content',
      authorId: user1.id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    mockPrisma.post.delete.mockResolvedValue({
      id: 1,
      content: 'Test post content',
      authorId: user1.id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const deletePostMutation = `
      mutation {
        deletePost(postId: "1")
      }
    `;

    const result = await server.executeOperation({
      query: deletePostMutation
    }, {
      contextValue: {
        user: { id: user1.id, email: user1.email }
      }
    });

    expect(result.body.singleResult.errors).toBeUndefined();
    expect(result.body.singleResult.data.deletePost).toBe(true);
    expect(mockPrisma.post.delete).toHaveBeenCalledWith({ where: { id: "1" } });
  });

  test('Fail to delete a post as a non-author', async () => {
    mockPrisma.post.findUnique.mockResolvedValue({
      id: 1,
      content: 'Test post content',
      authorId: user1.id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const deletePostMutation = `
      mutation {
        deletePost(postId: "1")
      }
    `;

    const result = await server.executeOperation({
      query: deletePostMutation
    }, {
      contextValue: {
        user: { id: user2.id, email: user2.email }
      }
    });

    expect(result.body.singleResult.errors).toBeDefined();
    expect(result.body.singleResult.errors[0].extensions.code).toBe('FORBIDDEN');
    expect(mockPrisma.post.delete).not.toHaveBeenCalled();
  });
});
