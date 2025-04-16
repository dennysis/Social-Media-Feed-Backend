// @ts-nocheck
import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();


router.post('/:userId', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const followerId = req.user.id;
    
   
    const userIdNum = Number(userId);
    
  
    if (followerId === userIdNum) {
      return res.status(400).json({ error: "You can't follow yourself" });
    }
    

    const userToFollow = await prisma.user.findUnique({
      where: { id: userIdNum }
    });
    
    if (!userToFollow) {
      return res.status(404).json({ error: 'User not found' });
    }
   
    const existingFollow = await prisma.follow.findFirst({
      where: { 
        followerId, 
        followingId: userIdNum 
      }
    });
    
    if (existingFollow) {
      return res.status(400).json({ error: 'Already following this user' });
    }
    

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


router.delete('/:userId', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const followerId = req.user.id;
    

    const userIdNum = Number(userId);
    

    const followRecord = await prisma.follow.findFirst({
      where: { 
        followerId, 
        followingId: userIdNum 
      }
    });
    
    if (!followRecord) {
      return res.status(404).json({ error: 'Not following this user' });
    }

    await prisma.follow.delete({
      where: { id: followRecord.id }
    });
    
    return res.status(200).json({ message: 'Unfollowed successfully' });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return res.status(500).json({ error: 'Server error while unfollowing user' });
  }
});

router.get('/:userId/followers', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userIdNum = Number(userId);
    
    const followers = await prisma.follow.findMany({
      where: { followingId: userIdNum },
      include: { follower: true }
    });
    

    return res.status(200).json(followers.map((follow: { follower: any }) => follow.follower));
  } catch (error) {
    console.error('Error fetching followers:', error);
    return res.status(500).json({ error: 'Server error while fetching followers' });
  }
});

router.get('/:userId/following', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userIdNum = Number(userId);
    
    const following = await prisma.follow.findMany({
      where: { followerId: userIdNum },
      include: { following: true }
    });
    

    return res.status(200).json(following.map((follow: { following: any }) => follow.following));
  } catch (error) {
    console.error('Error fetching following:', error);
    return res.status(500).json({ error: 'Server error while fetching following' });
  }
});

export default router;
