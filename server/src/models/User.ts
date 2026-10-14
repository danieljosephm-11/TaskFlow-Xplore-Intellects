import mongoose, { Schema, Document } from 'mongoose';
import { IUser, UserRole } from '../types/index.ts';

export interface IUserDocument extends Omit<IUser, '_id'>, Document {}

const UserSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ['ADMIN', 'EMPLOYEE'],
        message: '{VALUE} is not a valid role',
      },
      default: 'EMPLOYEE',
      required: true,
    },
    department: {
      type: String,
      trim: true,
      default: 'Engineering',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret: any) => {
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });

export const UserModel = mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);
