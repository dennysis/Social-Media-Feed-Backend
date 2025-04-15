import prisma from '../../config/database';
import { GraphQLError } from 'graphql';

const followResolver = {
  Mutation: {
    followUser: async (_: any, { userId }: { userId: number | string }, { user }: any) => {
      if (!user) throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' }
      });
      
      // Convert userId to number if it's a string
      const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
      
      // Prevent following yourself
      if (user.id === userIdNum) throw new GraphQLError("You can't follow yourself", {
        extensions: { code: 'BAD_USER_INPUT' }
      });
      
      return prisma.follow.create({
        data: {
          follower: { connect: { id: user.id } },
          following: { connect: { id: userIdNum } }
        },
        include: { follower: true, following: true }
      });
    },
    unfollowUser: async (_: any, { userId }: { userId: number | string }, { user }: any) => {
      if (!user) throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' }
      });
      
      // Convert userId to number if it's a string
      const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
      
      const followRecord = await prisma.follow.findFirst({
        where: { followerId: user.id, followingId: userIdNum }
      });
      
      if (!followRecord) throw new GraphQLError('Not following this user', {
        extensions: { code: 'BAD_USER_INPUT' }
      });
      
      await prisma.follow.delete({ where: { id: followRecord.id } });
      return true;
    }
  },
  Follow: {
    follower: async (parent: any) => {
      return prisma.user.findUnique({ where: { id: parent.followerId } });
    },
    following: async (parent: any) => {
      return prisma.user.findUnique({ where: { id: parent.followingId } });
    }
  }
};

export default followResolver;