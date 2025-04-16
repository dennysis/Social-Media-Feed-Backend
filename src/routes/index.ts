// @ts-nocheck
import { Router } from "express";
import authRoutes from "./auth";
import postRoutes from "./posts";
import userRoutes from "./users";
import likeRoutes from "./likes";
import followRoutes from "./follows";
import commentRoutes from "./comments";

const router = Router();

router.get("/", (_, res) => {
  res.send("Social Media Backend is running!");
});

router.use("/auth", authRoutes);
router.use("/posts", postRoutes);
router.use("/users", userRoutes);
router.use("/likes", likeRoutes);
router.use("/follows", followRoutes);
router.use("/comments", commentRoutes);

export default router;
