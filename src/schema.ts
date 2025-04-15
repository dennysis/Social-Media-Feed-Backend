import { makeExecutableSchema } from '@graphql-tools/schema';
import { userTypeDefs } from './graphql/types/User';
import { postTypeDefs } from './graphql/types/Post';
import userResolver from './graphql/resolvers/userResolver';
import postResolver from './graphql/resolvers/postResolver';
import likeResolver from './graphql/resolvers/likeResolver';
import followResolver from './graphql/resolvers/followResolver';

const typeDefs = [userTypeDefs, postTypeDefs];

const resolvers = [userResolver, postResolver, likeResolver, followResolver];

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

export { typeDefs, resolvers };