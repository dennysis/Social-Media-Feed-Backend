// @ts-nocheck
import { Router, Request, Response, NextFunction } from "express";
import prisma from "../config/database";
import { authenticateUser } from "../middleware/authMiddleware";
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { logger } from "../utils/logger";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

const router = Router();
router.use(express.json());

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "social-media-posts",
    allowed_formats: ["jpg", "jpeg", "png", "gif"],
  },
});

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Accept jpeg, jpg, png, gif, webp
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images are allowed."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});
const handleMulterError = (
  err: any,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ error: "File too large. Maximum size is 5MB." });
    }

    return res.status(400).json({ error: `Upload error: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }

  next();
};

router.get("/", async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: true,
        likes: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return res.status(200).json(posts);
  } catch (error) {
    logger.error(`Error fetching posts: ${error}`);
    return res.status(500).json({ error: "Server error while fetching posts" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const post = await prisma.post.findUnique({
      where: { id: Number(id) },
      include: {
        author: true,
        likes: true,
      },
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    return res.status(200).json(post);
  } catch (error) {
    logger.error(`Error fetching post: ${error}`);
    return res.status(500).json({ error: "Server error while fetching post" });
  }
});

router.post(
  "/",
  authenticateUser,
  upload.single("image"),
  handleMulterError,
  async (req: Request, res: Response) => {
    try {
      const content = req.body?.content || "";

      if (!content && !req.file) {
        return res
          .status(400)
          .json({ error: "Either content or image is required" });
      }

      const userId = req.user.id;

      const postData: any = {
        content,
        author: { connect: { id: userId } },
      };

      if (req.file) {
        const imageUrl = `/uploads/${req.file.filename}`;
        postData.imageUrl = imageUrl;
      }

      const post = await prisma.post.create({
        data: postData,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              email: true,
              createdAt: true,
            },
          },
        },
      });

      return res.status(201).json(post);
    } catch (error) {
      it;

      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          logger.error(`Error deleting file after failed post: ${unlinkError}`);
        }
      }

      logger.error(`Error creating post: ${error}`);

      return res
        .status(500)
        .json({ error: "Server error while creating post" });
    }
  }
);

router.put(
  "/:id",
  authenticateUser,
  upload.single("image"),
  handleMulterError,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const { content } = req.body;

      const userId = req.user.id;

      if (!content && !req.file) {
        return res
          .status(400)
          .json({ error: "Either content or image is required" });
      }

      const existingPost = await prisma.post.findUnique({
        where: { id: Number(id) },
      });

      if (!existingPost) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }

        return res.status(404).json({ error: "Post not found" });
      }

      if (existingPost.authorId !== userId) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res
          .status(403)
          .json({ error: "Not authorized to update this post" });
      }

      const updateData: any = {};
      if (content) {
        updateData.content = content;
      }

      if (req.file) {
        const imageUrl = `/uploads/${req.file.filename}`;
        updateData.imageUrl = imageUrl;

        if (existingPost.imageUrl) {
          const oldImagePath = path.join(
            __dirname,
            "../../",
            existingPost.imageUrl.replace(/^\//, "")
          );
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
      }

      const updatedPost = await prisma.post.update({
        where: { id: Number(id) },
        data: updateData,
        include: { author: true },
      });

      return res.status(200).json(updatedPost);
    } catch (error) {
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          logger.error(
            `Error deleting file after failed update: ${unlinkError}`
          );
        }
      }

      logger.error(`Error updating post: ${error}`);
      return res
        .status(500)
        .json({ error: "Server error while updating post" });
    }
  }
);

router.delete("/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existingPost = await prisma.post.findUnique({
      where: { id: Number(id) },
    });

    if (!existingPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (existingPost.authorId !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this post" });
    }

    if (existingPost.imageUrl) {
      const imagePath = path.join(
        __dirname,
        "../../",
        existingPost.imageUrl.replace(/^\//, "")
      );
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await prisma.post.delete({
      where: { id: Number(id) },
    });

    return res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    logger.error(`Error deleting post: ${error}`);
    return res.status(500).json({ error: "Server error while deleting post" });
  }
});

router.use("/uploads", express.static(path.join(__dirname, "../../uploads")));

export default router;
