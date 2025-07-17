import { Router } from "express";
import { withTransaction, generateId } from "../utils/storage";

const router = Router();

// POST /api/friendships
router.post("/", async (req, res) => {
  const { userId1, userId2, requestedBy } = req.body;
  if (!userId1 || !userId2 || !requestedBy) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const newFriendship = await withTransaction(db => {
      const friendship = {
        id: generateId(),
        userId1,
        userId2,
        status: "pending" as const,
        requestedBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.friendships.push(friendship);
      return friendship;
    });
    res.status(201).json(newFriendship);
  } catch (err) {
    console.error("Error creating friendship:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
