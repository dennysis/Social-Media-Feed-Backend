import prisma from '../../config/database';
import { GraphQLError } from 'graphql';

const likeResolver = {
  Mutation: {
    likePost: async (_: any, { postId }: { postId: number | string }, { user }: any) => {
      if (!user) throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' }
      });
      
      const postIdNum = typeof postId === 'string' ? parseInt(postId, 10) : postId;
      
      const existingLike = await prisma.like.findFirst({
        where: { postId: postIdNum, userId: user.id }
      });
      
      if (existingLike) {
        throw new GraphQLError('Already liked this post', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }
      
      return prisma.like.create({
        data: {
          post: { connect: { id: postIdNum } },
          user: { connect: { id: user.id } }
        },
        include: { user: true, post: true }
      });
    },
    unlikePost: async (_: any, { postId }: { postId: number }, { user }: any) => {
      if (!user) throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' }
      });
      
      const existingLike = await prisma.like.findFirst({
        where: { postId, userId: user.id }
      });
      
      if (!existingLike) {
        throw new GraphQLError('You have not liked this post', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }
      
      await prisma.like.delete({ where: { id: existingLike.id } });
      return true;
    }
  },
  Like: {
    user: async (parent: any) => {
      return prisma.user.findUnique({ where: { id: parent.userId } });
    },
    post: async (parent: any) => {
      return prisma.post.findUnique({ where: { id: parent.postId } });
    }
  }
};
export default likeResolver;
