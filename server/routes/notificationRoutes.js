import express from 'express';
import { Notification } from '../models/Notification.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all notifications for logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const notifications = await Notification.find({ receiverId: userId })
      .populate('senderId', 'fullname username profilePicture headline')
      .sort({ createdAt: -1 })
      .limit(50);
    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark notification as read
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, receiverId: userId },
      { readStatus: true, isRead: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ error: 'Notification not found' });
    res.status(200).json(notif);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark all notifications as read
router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    await Notification.updateMany(
      { receiverId: userId, readStatus: false },
      { readStatus: true, isRead: true }
    );
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
