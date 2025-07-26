// server.js
// Backend for the Blog Platform using Node.js, Express, and Prisma

import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

// Initialize Prisma Client and Express App
const prisma = new PrismaClient();
const app = express();

// --- Middleware ---
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Enable JSON body parsing

// --- API Endpoints ---

// GET /posts - Fetch all posts with author and tags
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: true, // Include the related author object
        tags: true,   // Include the related tags
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// GET /posts/:id - Fetch a single post by ID with comments
app.get('/api/posts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const post = await prisma.post.findUnique({
      where: { id: parseInt(id) },
      include: {
        author: true,
        tags: true,
        comments: {
          include: {
            author: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
    if (post) {
      res.json(post);
    } else {
      res.status(404).json({ error: 'Post not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// POST /posts - Create a new post
app.post('/api/posts', async (req, res) => {
  const { title, content, authorId, tags } = req.body;
  try {
    // Logic to find or create tags
    const tagOperations = tags.map((tagName) => {
      return prisma.tag.upsert({
        where: { name: tagName },
        update: {},
        create: { name: tagName },
      });
    });
    const createdTags = await prisma.$transaction(tagOperations);

    const newPost = await prisma.post.create({
      data: {
        title,
        content,
        author: { connect: { id: authorId } },
        tags: {
          connect: createdTags.map(tag => ({ id: tag.id })),
        },
      },
      include: { author: true, tags: true },
    });
    res.status(201).json(newPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// POST /posts/:id/comments - Add a comment to a post
app.post('/api/posts/:id/comments', async (req, res) => {
    const { id } = req.params;
    const { text, authorId } = req.body;
    try {
        const newComment = await prisma.comment.create({
            data: {
                text,
                author: { connect: { id: authorId } },
                post: { connect: { id: parseInt(id) } }
            },
            include: { author: true }
        });
        res.status(201).json(newComment);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add comment' });
    }
});


// --- Start Server ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

