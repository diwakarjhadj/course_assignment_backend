import Notification from '../models/Notification.js';

export const createNotification = async (io, { recipient, type, title, message, metadata }) => {
  const notification = await Notification.create({
    recipient,
    type,
    title,
    message,
    metadata,
  });

  if (io) {
    io.to(recipient.toString()).emit('notification', {
      _id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      read: notification.read,
      metadata: notification.metadata,
      createdAt: notification.createdAt,
    });
  }

  return notification;
};

export const scheduleDeadlineNotifications = (io) => {
  setInterval(async () => {
    try {
      const Task = (await import('../models/Task.js')).default;
      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const approachingTasks = await Task.find({
        status: 'pending',
        dueDate: { $gte: now, $lte: in24Hours },
      }).populate('assignedTo', 'name email');

      for (const task of approachingTasks) {
        await createNotification(io, {
          recipient: task.assignedTo._id,
          type: 'deadline_approaching',
          title: 'Deadline Approaching',
          message: `Task "${task.title}" is due within 24 hours.`,
          metadata: { taskId: task._id },
        });
      }
    } catch (err) {
      console.error('Deadline notification error:', err.message);
    }
  }, 60 * 60 * 1000);
};
