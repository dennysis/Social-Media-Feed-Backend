import { Router } from 'express';
import prisma from '../config/database';
import { authenticateUser } from '../middleware/authMiddleware';
import cors from 'cors';

const router = Router();

// Apply CORS middleware specifically for this router
router.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight OPTIONS requests explicitly
router.options('/:postId', (req, res) => {
  // Set CORS headers manually to ensure they're present
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(204).end();
});

// Like a post
router.post('/:postId', authenticateUser, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    
    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: Number(postId) }
    });
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Check if already liked
    const existingLike = await prisma.like.findFirst({
      where: { 
        postId: Number(postId), 
        userId 
      }
    });
    
    if (existingLike) {
      return res.status(400).json({ error: 'Already liked this post' });
    }
    
    // Create like
    const like = await prisma.like.create({
      data: {
        post: { connect: { id: Number(postId) } },
        user: { connect: { id: userId } }
      },
      include: { user: true, post: true }
    });
    
    return res.status(201).json(like);
  } catch (error) {
    console.error('Error liking post:', error);
    return res.status(500).json({ error: 'Server error while liking post' });
  }
});

// Unlike a post
router.delete('/:postId', authenticateUser, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    
    // Find the like
    const like = await prisma.like.findFirst({
      where: { 
        postId: Number(postId), 
        userId 
      }
    });
    
    if (!like) {
      return res.status(404).json({ error: 'Like not found' });
    }
    
    // Delete the like
    await prisma.like.delete({
      where: { id: like.id }
    });
    
    return res.status(200).json({ message: 'Post unliked successfully' });
  } catch (error) {
    console.error('Error unliking post:', error);
    return res.status(500).json({ error: 'Server error while unliking post' });
  }
});

export default router;
