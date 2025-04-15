import prisma from '../../config/database';
import { GraphQLError } from 'graphql';

const commentResolver = {
  Query: {
    commentsByPost: async (_: any, { postId }: { postId: number }) => {
      return prisma.comment.findMany({
        where: { postId },
        include: { author: true, post: true },
        orderBy: { createdAt: 'desc' }
      });
    },
    comment: async (_: any, { id }: { id: number }) => {
      return prisma.comment.findUnique({
        where: { id },
        include: { author: true, post: true }
      });
    }
  },
  Mutation: {
    createComment: async (_: any, { postId, content }: { postId: number, content: string }, { user }: any) => {
      if (!user) throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' }
      });
      
      return prisma.comment.create({
        data: {
          content,
          post: { connect: { id: postId } },
          author: { connect: { id: user.id } }
        },
        include: { author: true, post: true }
      });
    },
    updateComment: async (_: any, { id, content }: { id: number, content: string }, { user }: any) => {
      if (!user) throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' }
      });
      
      const comment = await prisma.comment.findUnique({ where: { id } });
      
      if (!comment) throw new GraphQLError('Comment not found', {
        extensions: { code: 'NOT_FOUND' }
      });
      
      if (comment.authorId !== user.id) throw new GraphQLError('Not authorized to update this comment', {
        extensions: { code: 'FORBIDDEN' }
      });
      
      return prisma.comment.update({
        where: { id },
        data: { content },
        include: { author: true, post: true }
      });
    },
    deleteComment: async (_: any, { id }: { id: number }, { user }: any) => {
      if (!user) throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' }
      });
      
      const comment = await prisma.comment.findUnique({ where: { id } });
      
      if (!comment) throw new GraphQLError('Comment not found', {
        extensions: { code: 'NOT_FOUND' }
      });
      
      // Check if user is the author of the comment or the post owner
      if (comment.authorId !== user.id) {
        const post = await prisma.post.findUnique({ where: { id: comment.postId } });
        
        if (!post || post.authorId !== user.id) {
          throw new GraphQLError('Not authorized to delete this comment', {
            extensions: { code: 'FORBIDDEN' }
          });
        }
      }
      
      await prisma.comment.delete({ where: { id } });
      return true;
    }
  }
};

export default commentResolver;
