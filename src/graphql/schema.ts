import userResolver from './resolvers/userResolver';
import postResolver from './resolvers/postResolver';
import likeResolver from './resolvers/likeResolver';
import followResolver from './resolvers/followResolver';

const typeDefs = `
  type User {
    id: ID!
    username: String!
    email: String!
    createdAt: String!
  }

  type Post {
    id: ID!
    content: String!
    author: User!
    likes: [Like!]!
    createdAt: String!
  }

  type Like {
    id: ID!
    post: Post!
    user: User!
    createdAt: String!
  }

  type Follow {
    id: ID!
    follower: User!
    following: User!
    createdAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Comment {
    id: ID!
    content: String!
    post: Post!
    author: User!
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    me: User
    user(id: ID!): User
    posts: [Post!]!
    commentsByPost(postId: ID!): [Comment!]!
    comment(id: ID!): Comment
  }

  type Mutation {
    register(username: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    createPost(content: String!): Post!
    deletePost(postId: ID!): Boolean!
    likePost(postId: ID!): Like!
    followUser(userId: ID!): Follow!
    unfollowUser(userId: ID!): Boolean!
    unlikePost(postId: ID!): Boolean!
    createComment(postId: ID!, content: String!): Comment!
    updateComment(id: ID!, content: String!): Comment!
    deleteComment(id: ID!): Boolean!
  }
`;

const resolvers = {
  Query: {
    ...userResolver.Query,
    ...postResolver.Query
  },
  Mutation: {
    ...userResolver.Mutation,
    ...postResolver.Mutation,
    ...likeResolver.Mutation,
    ...followResolver.Mutation
  },
  Post: postResolver.Post,
  Like: likeResolver.Like,
  Follow: followResolver.Follow
};

export { typeDefs, resolvers };
