import mongoose, { Schema, Document } from 'mongoose';
import { ITask, TaskPriority, TaskStatus } from '../types/index.ts';

export interface ITaskDocument extends Omit<ITask, '_id'>, Document {}

const TaskSchema = new Schema<ITaskDocument>(
  {
    taskIdentifier: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      maxlength: [120, 'Task title cannot exceed 120 characters'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Task description is required'],
      maxlength: [2000, 'Task description cannot exceed 2000 characters'],
      trim: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned employee is required'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task creator is required'],
    },
    priority: {
      type: String,
      enum: {
        values: ['HIGH', 'MEDIUM', 'LOW'],
        message: '{VALUE} is not a valid priority',
      },
      default: 'MEDIUM',
      required: true,
    },
    status: {
      type: String,
      enum: {
        values: ['NOT_STARTED', 'PENDING', 'IN_PROGRESS', 'COMPLETED'],
        message: '{VALUE} is not a valid status',
      },
      default: 'NOT_STARTED',
      required: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

TaskSchema.index({ assignedTo: 1 });
TaskSchema.index({ createdBy: 1 });
TaskSchema.index({ status: 1 });
TaskSchema.index({ priority: 1 });
TaskSchema.index({ taskIdentifier: 1 });
TaskSchema.index({ createdAt: -1 });

export const TaskModel = mongoose.models.Task || mongoose.model<ITaskDocument>('Task', TaskSchema);
