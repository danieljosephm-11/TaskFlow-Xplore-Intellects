import { Request, Response, NextFunction } from 'express';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    res.status(400).json({
      success: false,
      message: 'Please provide a valid email address.',
    });
    return;
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    res.status(400).json({
      success: false,
      message: 'Password is required.',
    });
    return;
  }

  next();
};

export const validateEmployeeCreate = (req: Request, res: Response, next: NextFunction): void => {
  const { name, email, password, department } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    res.status(400).json({
      success: false,
      message: 'Name is required and must be between 2 and 100 characters.',
    });
    return;
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    res.status(400).json({
      success: false,
      message: 'A valid email address is required.',
    });
    return;
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long.',
    });
    return;
  }

  if (department && (typeof department !== 'string' || department.length > 50)) {
    res.status(400).json({
      success: false,
      message: 'Department cannot exceed 50 characters.',
    });
    return;
  }

  next();
};

export const validateTaskCreate = (req: Request, res: Response, next: NextFunction): void => {
  const { title, description, assignedTo, priority, status } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0 || title.trim().length > 120) {
    res.status(400).json({
      success: false,
      message: 'Task title is required and cannot exceed 120 characters.',
    });
    return;
  }

  if (!description || typeof description !== 'string' || description.trim().length === 0 || description.trim().length > 2000) {
    res.status(400).json({
      success: false,
      message: 'Task description is required and cannot exceed 2000 characters.',
    });
    return;
  }

  if (!assignedTo || typeof assignedTo !== 'string' || assignedTo.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: 'An assigned employee is required.',
    });
    return;
  }

  const validPriorities = ['HIGH', 'MEDIUM', 'LOW'];
  if (priority && !validPriorities.includes(priority)) {
    res.status(400).json({
      success: false,
      message: `Priority must be one of: ${validPriorities.join(', ')}`,
    });
    return;
  }

  const validStatuses = ['NOT_STARTED', 'PENDING', 'IN_PROGRESS', 'COMPLETED'];
  if (status && !validStatuses.includes(status)) {
    res.status(400).json({
      success: false,
      message: `Status must be one of: ${validStatuses.join(', ')}`,
    });
    return;
  }

  next();
};

export const validateTaskStatusUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const { status } = req.body;
  const validStatuses = ['NOT_STARTED', 'PENDING', 'IN_PROGRESS', 'COMPLETED'];

  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
    });
    return;
  }

  next();
};
