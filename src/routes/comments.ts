// @ts-nocheck
import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticateUser } from '../middleware/authMiddleware';
import cors from 'cors';
import express from 'express';

const router = Router();

router.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.options('/:postId', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(204).end();
});


router.get('/post/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    

    const post = await prisma.post.findUnique({
      where: { id: Number(postId) }
    });
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    

    const comments = await prisma.comment.findMany({
      where: { postId: Number(postId) },
      include: { 
        author: true,
        post: true 
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return res.status(200).json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return res.status(500).json({ error: 'Server error while fetching comments' });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const comment = await prisma.comment.findUnique({
      where: { id: Number(id) },
      include: { 
        author: true,
        post: true 
      }
    });
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    return res.status(200).json(comment);
  } catch (error) {
    console.error('Error fetching comment:', error);
    return res.status(500).json({ error: 'Server error while fetching comment' });
  }
});


router.post('/post/:postId', authenticateUser, async (req: Request, res: Response) => {
  try {
    console.log('Request body:', req.body);
    console.log('Headers:', req.headers);

    let content = '';
    
    if (req.body && typeof req.body === 'object') {
      content = req.body.content || '';
    } else if (typeof req.body === 'string') {
      try {
        const parsedBody = JSON.parse(req.body);
        content = parsedBody.content || '';
      } catch (e) {
        console.error('Error parsing body:', e);
      }
    }
    
    const { postId } = req.params;
    const userId = req.user.id;
    
    console.log('Extracted content:', content);
    
    if (!content) {
      return res.status(400).json({ error: 'Comment content is required' });
    }
 
    const post = await prisma.post.findUnique({
      where: { id: Number(postId) }
    });
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        post: { connect: { id: Number(postId) } },
        author: { connect: { id: userId } }
      },
      include: { 
        author: true,
        post: true 
      }
    });
    
    return res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    return res.status(500).json({ error: 'Server error while creating comment' });
  }
});

router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body || {};
    const userId = req.user.id;
    
    if (!content) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const existingComment = await prisma.comment.findUnique({
      where: { id: Number(id) }
    });
    
    if (!existingComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
   
    if (existingComment.authorId !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this comment' });
    }
    

    const updatedComment = await prisma.comment.update({
      where: { id: Number(id) },
      data: { content },
      include: { 
        author: true,
        post: true 
      }
    });
    
    return res.status(200).json(updatedComment);
  } catch (error) {
    console.error('Error updating comment:', error);
    return res.status(500).json({ error: 'Server error while updating comment' });
  }
});

router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    

    const existingComment = await prisma.comment.findUnique({
      where: { id: Number(id) }
    });
    
    if (!existingComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
 
    if (existingComment.authorId !== userId) {

      const post = await prisma.post.findUnique({
        where: { id: existingComment.postId }
      });
      
      if (!post || post.authorId !== userId) {
        return res.status(403).json({ error: 'Not authorized to delete this comment' });
      }
    }
    

    await prisma.comment.delete({
      where: { id: Number(id) }
    });
    
    return res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return res.status(500).json({ error: 'Server error while deleting comment' });
  }
});

export default router;
