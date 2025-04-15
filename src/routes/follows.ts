import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();

// Follow a user
router.post('/:userId', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const followerId = req.user.id;
    
    // Convert userId to number
    const userIdNum = Number(userId);
    
    // Prevent following yourself
    if (followerId === userIdNum) {
      return res.status(400).json({ error: "You can't follow yourself" });
    }
    
    // Check if user exists
    const userToFollow = await prisma.user.findUnique({
      where: { id: userIdNum }
    });
    
    if (!userToFollow) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if already following
    const existingFollow = await prisma.follow.findFirst({
      where: { 
        followerId, 
        followingId: userIdNum 
      }
    });
    
    if (existingFollow) {
      return res.status(400).json({ error: 'Already following this user' });
    }
    
    // Create follow relationship
    const follow = await prisma.follow.create({
      data: {
        follower: { connect: { id: followerId } },
        following: { connect: { id: userIdNum } }
      },
      include: { follower: true, following: true }
    });
    
    return res.status(201).json(follow);
  } catch (error) {
    console.error('Error following user:', error);
    return res.status(500).json({ error: 'Server error while following user' });
  }
});

// Unfollow a user
router.delete('/:userId', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const followerId = req.user.id;
    
    // Convert userId to number
    const userIdNum = Number(userId);
    
    // Find the follow relationship
    const followRecord = await prisma.follow.findFirst({
      where: { 
        followerId, 
        followingId: userIdNum 
      }
    });
    
    if (!followRecord) {
      return res.status(404).json({ error: 'Not following this user' });
    }
    
    // Delete the follow relationship
    await prisma.follow.delete({
      where: { id: followRecord.id }
    });
    
    return res.status(200).json({ message: 'Unfollowed successfully' });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return res.status(500).json({ error: 'Server error while unfollowing user' });
  }
});

// Get followers of a user
router.get('/:userId/followers', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userIdNum = Number(userId);
    
    const followers = await prisma.follow.findMany({
      where: { followingId: userIdNum },
      include: { follower: true }
    });
    
    // Add explicit type to the follow parameter
    return res.status(200).json(followers.map((follow: { follower: any }) => follow.follower));
  } catch (error) {
    console.error('Error fetching followers:', error);
    return res.status(500).json({ error: 'Server error while fetching followers' });
  }
});

// Get users that a user is following
router.get('/:userId/following', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userIdNum = Number(userId);
    
    const following = await prisma.follow.findMany({
      where: { followerId: userIdNum },
      include: { following: true }
    });
    
    // Add explicit type to the follow parameter
    return res.status(200).json(following.map((follow: { following: any }) => follow.following));
  } catch (error) {
    console.error('Error fetching following:', error);
    return res.status(500).json({ error: 'Server error while fetching following' });
  }
});

export default router;
