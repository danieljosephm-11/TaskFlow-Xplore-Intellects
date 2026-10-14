import mongoose, { Schema, Document } from 'mongoose';
import { ITaskActivity } from '../types/index.ts';

export interface ITaskActivityDocument extends Omit<ITaskActivity, '_id'>, Document {}

const TaskActivitySchema = new Schema<ITaskActivityDocument>(
  {
    task: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    actor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    previousStatus: {
      type: String,
      enum: ['NOT_STARTED', 'PENDING', 'IN_PROGRESS', 'COMPLETED', null],
      default: null,
    },
    newStatus: {
      type: String,
      enum: ['NOT_STARTED', 'PENDING', 'IN_PROGRESS', 'COMPLETED', null],
      default: null,
    },
    action: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

TaskActivitySchema.index({ task: 1, timestamp: -1 });
TaskActivitySchema.index({ actor: 1 });

export const TaskActivityModel = mongoose.models.TaskActivity || mongoose.model<ITaskActivityDocument>('TaskActivity', TaskActivitySchema);
