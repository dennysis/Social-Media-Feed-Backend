import prisma from '../../config/database';
import { GraphQLError } from 'graphql';
const postResolver = {
  Query: {
    posts: async () => {
      return prisma.post.findMany({
        include: { author: true, likes: true }
      });
    }
  },
  Mutation: {
    createPost: async (_: any, { content }: { content: string }, { user }: any) => {
      if (!user) throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' }
      });
      return prisma.post.create({
        data: {
          content,
          author: { connect: { id: user.id } }
        },
        include: { author: true }
      });
    },
    deletePost: async (_: any, { postId }: { postId: number }, { user }: any) => {
      if (!user) throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' }
      });
      
      const post = await prisma.post.findUnique({ where: { id: postId } });
      if (!post) throw new GraphQLError('Post not found', {
        extensions: { code: 'NOT_FOUND' }
      });
      
      if (post.authorId !== user.id) throw new GraphQLError('Not authorized to delete this post', {
        extensions: { code: 'FORBIDDEN' }
      });
      
      await prisma.post.delete({ where: { id: postId } });
      return true;
    }
  },
  Post: {
    author: async (parent: any) => {
      return prisma.user.findUnique({ where: { id: parent.authorId } });
    },
    likes: async (parent: any) => {
      return prisma.like.findMany({ where: { postId: parent.id } });
    }
  }
};
export default postResolver;
