export const postTypeDefs = `
  type Post {
    id: ID!
    content: String!
    author: User!
    likes: [Like!]!
  }

  extend type Query {
    posts: [Post!]!
  }

  extend type Mutation {
    createPost(content: String!): Post!
    deletePost(postId: ID!): Boolean!
  }
`;
