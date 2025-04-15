import { Router } from 'express';
import prisma from '../config/database';
import { authenticateUser } from '../middleware/authMiddleware';
import express from 'express';

const router = Router();


router.use(express.json());

router.get('/', async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: { 
        author: true, 
        likes: true 
      }
    });
    return res.status(200).json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return res.status(500).json({ error: 'Server error while fetching posts' });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const post = await prisma.post.findUnique({
      where: { id: Number(id) },
      include: { 
        author: true, 
        likes: true 
      }
    });
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    return res.status(200).json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    return res.status(500).json({ error: 'Server error while fetching post' });
  }
});

router.post('/', authenticateUser, async (req, res) => {
  try {
    console.log('Headers:', req.headers);
    console.log('Body type:', typeof req.body);
    console.log('Body:', req.body);
    

    const content = req.body?.content || '';
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const userId = req.user.id;
    
    const post = await prisma.post.create({
      data: {
        content,
        author: { connect: { id: userId } }
      },
      include: { author: true }
    });
    
    return res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    return res.status(500).json({ error: 'Server error while creating post' });
  }
});


router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    

    const existingPost = await prisma.post.findUnique({
      where: { id: Number(id) }
    });
    
    if (!existingPost) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    if (existingPost.authorId !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this post' });
    }
    
    const updatedPost = await prisma.post.update({
      where: { id: Number(id) },
      data: { content },
      include: { author: true }
    });
    
    return res.status(200).json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    return res.status(500).json({ error: 'Server error while updating post' });
  }
});


router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    
    const existingPost = await prisma.post.findUnique({
      where: { id: Number(id) }
    });
    
    if (!existingPost) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    if (existingPost.authorId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }
    
    await prisma.post.delete({
      where: { id: Number(id) }
    });
    
    return res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return res.status(500).json({ error: 'Server error while deleting post' });
  }
});

export default router;
