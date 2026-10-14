export type UserRole = 'ADMIN' | 'EMPLOYEE';

export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export type TaskStatus = 'NOT_STARTED' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export type TaskAction = 'CREATED' | 'ASSIGNED' | 'STATUS_UPDATED' | 'REASSIGNED' | 'DETAILS_UPDATED' | 'DELETED';

export type NotificationType = 'TASK_ASSIGNED' | 'TASK_STATUS_UPDATED';

export type DeliveryStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  department: string;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ITask {
  _id: string;
  taskIdentifier: string;
  title: string;
  description: string;
  assignedTo: string | IUser | any;
  createdBy: string | IUser | any;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ITaskActivity {
  _id: string;
  task: string | ITask;
  actor: string | IUser;
  previousStatus?: TaskStatus | null;
  newStatus?: TaskStatus | null;
  action: TaskAction;
  notes?: string;
  timestamp: string | Date;
}

export interface INotification {
  _id: string;
  recipient: string;
  recipientUser?: string | IUser;
  task?: string | ITask;
  type: NotificationType;
  subject: string;
  content: string;
  deliveryStatus: DeliveryStatus;
  attempts: number;
  lastError?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface AuthUserPayload {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
}
