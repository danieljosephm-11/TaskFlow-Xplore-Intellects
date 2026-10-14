export type UserRole = 'ADMIN' | 'EMPLOYEE';
export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type TaskStatus = 'NOT_STARTED' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  isActive: boolean;
  assignedTasksCount?: number;
  completedTasksCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  _id: string;
  taskIdentifier: string;
  title: string;
  description: string;
  assignedTo: User | string;
  createdBy: User | string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskActivity {
  _id: string;
  task: string;
  actor: {
    _id: string;
    name: string;
    email: string;
    role?: UserRole;
  } | string;
  previousStatus?: TaskStatus | null;
  newStatus?: TaskStatus | null;
  action: string;
  notes?: string;
  timestamp: string;
}

export interface NotificationItem {
  _id: string;
  recipient: string;
  type: 'TASK_ASSIGNED' | 'TASK_STATUS_UPDATED';
  subject: string;
  content: string;
  deliveryStatus: 'PENDING' | 'SENT' | 'FAILED';
  attempts: number;
  lastError?: string | null;
  createdAt: string;
  task?: {
    _id: string;
    title: string;
    taskIdentifier: string;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
