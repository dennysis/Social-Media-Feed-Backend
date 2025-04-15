import { Router } from 'express';
import prisma from '../config/database';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();


router.get('/me', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        posts: true,
        followers: true,
        following: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    

    const { password, ...userWithoutPassword } = user;
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ error: 'Server error while fetching user profile' });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      include: {
        posts: true,
        followers: true,
        following: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
 
    const { password, ...userWithoutPassword } = user;
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: 'Server error while fetching user' });
  }
});

export default router;
