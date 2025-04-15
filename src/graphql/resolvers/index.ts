import userResolver from './userResolver';
import postResolver from './postResolver';
import likeResolver from './likeResolver';
import followResolver from './followResolver';
import commentResolver from './commentResolver';

export const resolvers = [userResolver, postResolver, likeResolver, followResolver, commentResolver];
