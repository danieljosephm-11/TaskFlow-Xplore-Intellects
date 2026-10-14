import mongoose, { Schema, Document } from 'mongoose';
import { INotification, NotificationType, DeliveryStatus } from '../types/index.ts';

export interface INotificationDocument extends Omit<INotification, '_id'>, Document {}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    recipient: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    recipientUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    type: {
      type: String,
      enum: ['TASK_ASSIGNED', 'TASK_STATUS_UPDATED'],
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    deliveryStatus: {
      type: String,
      enum: ['PENDING', 'SENT', 'FAILED'],
      default: 'PENDING',
    },
    attempts: {
      type: Number,
      default: 0,
    },
    lastError: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ recipient: 1 });
NotificationSchema.index({ deliveryStatus: 1 });
NotificationSchema.index({ createdAt: -1 });

export const NotificationModel = mongoose.models.Notification || mongoose.model<INotificationDocument>('Notification', NotificationSchema);
