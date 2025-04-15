export const userTypeDefs = `
  type User {
    id: ID!
    username: String!
    email: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Follow {
    id: ID!
    follower: User!
    following: User!
  }

  type Like {
    id: ID!
    post: Post!
    user: User!
  }

  type PasswordResetResponse {
    success: Boolean!
    message: String!
  }

  type Query {
    me: User
    user(id: ID!): User
  }

  type Mutation {
    register(username: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    followUser(userId: ID!): Follow!
    unfollowUser(userId: ID!): Boolean!
    likePost(postId: ID!): Like!
    unlikePost(postId: ID!): Boolean!
    requestPasswordReset(email: String!): PasswordResetResponse!
    resetPassword(token: String!, newPassword: String!): PasswordResetResponse!
  }
`;
