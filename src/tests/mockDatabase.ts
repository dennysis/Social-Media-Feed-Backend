const mockPrisma = {
    user: {
      create: jest.fn().mockImplementation((args) => {
        const { username, email, password } = args.data;
        return Promise.resolve({
          id: Math.floor(Math.random() * 1000),
          username,
          email,
          password,
          createdAt: new Date()
        });
      }),
      findUnique: jest.fn().mockImplementation((args) => {
        if (args.where.email === 'login@example.com') {
          return Promise.resolve({
            id: 3,
            username: 'logintest',
            email: 'login@example.com',
            password: '$2b$10$X2Pn4RvU6OHrOQ5/ca8ArOksJx22iA3EWI66xLpLOyxbbFBMGQ1zS', // bcrypt hash for 'password123'
            createdAt: new Date()
          });
        }
        return Promise.resolve(null);
      }),
      findMany: jest.fn()
    },
    post: {
        create: jest.fn().mockImplementation((args) => {
            const { post, user } = args.data;
            return Promise.resolve({
              id: Math.floor(Math.random() * 1000),
              postId: post.connect.id,
              userId: user.connect.id,
              createdAt: new Date(),
              post: {
                id: post.connect.id,
                content: 'Test post for likes',
                authorId: 1
              },
              user: {
                id: user.connect.id,
                username: 'testuser2',
                email: 'test2@example.com'
              }
            });
          }),
      findUnique: jest.fn().mockImplementation((args) => {
        return Promise.resolve({
          id: args.where.id,
          content: 'Test post content',
          authorId: 1,
          createdAt: new Date()
        });
      }),
     // Update the post.findMany implementation:
    findMany: jest.fn().mockImplementation(() => {
    return Promise.resolve([
      {
        id: 1,
        content: 'Test post 1',
        authorId: 1,
        createdAt: new Date(),
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
        authorId: 2,
        createdAt: new Date(),
        likes: []
      }
    ]);
  })
  ,
      delete: jest.fn().mockImplementation(() => {
        return Promise.resolve({
          id: 1,
          content: 'Test post content',
          authorId: 1,
          createdAt: new Date()
        });
      })
    },
    like: {
      create: jest.fn().mockImplementation((args) => {
        const { post, user } = args.data;
        return Promise.resolve({
          id: Math.floor(Math.random() * 1000),
          postId: post.connect.id,
          userId: user.connect.id,
          createdAt: new Date()
        });
      }),
      findFirst: jest.fn(),
      findMany: jest.fn().mockImplementation(() => {
        return Promise.resolve([
          {
            id: 1,
            postId: 1,
            userId: 2,
            createdAt: new Date()
          }
        ]);
      }),
      delete: jest.fn()
    },
    follow: {
      create: jest.fn().mockImplementation((args) => {
        const { follower, following } = args.data;
        return Promise.resolve({
          id: 1,
          followerId: follower.connect.id,
          followingId: following.connect.id,
          createdAt: new Date()
        });
      }),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn()
    },
    $disconnect: jest.fn()
  };
  
  export default mockPrisma;
  