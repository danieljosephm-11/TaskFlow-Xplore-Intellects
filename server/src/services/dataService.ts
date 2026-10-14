import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/User.ts';
import { TaskModel } from '../models/Task.ts';
import { TaskActivityModel } from '../models/TaskActivity.ts';
import { NotificationModel } from '../models/Notification.ts';
import {
  IUser,
  ITask,
  ITaskActivity,
  INotification,
  TaskStatus,
  TaskPriority,
  UserRole,
} from '../types/index.ts';

// In-Memory persistent data store for zero-config preview and dev testing
class InMemoryStore {
  users: IUser[] = [];
  tasks: ITask[] = [];
  activities: ITaskActivity[] = [];
  notifications: INotification[] = [];
  private taskSeq: number = 100;

  generateId(): string {
    return new mongoose.Types.ObjectId().toString();
  }

  getNextTaskIdentifier(): string {
    this.taskSeq += 1;
    return `TASK-${this.taskSeq}`;
  }
}

export const inMemoryDB = new InMemoryStore();

const isMongoActive = () => mongoose.connection.readyState === 1;

export class DataService {
  // =================== USERS ===================
  static async findUserByEmail(email: string, includePassword = false): Promise<IUser | null> {
    const cleanEmail = email.trim().toLowerCase();
    if (isMongoActive()) {
      const q = UserModel.findOne({ email: cleanEmail });
      if (includePassword) q.select('+passwordHash');
      const doc = await q.exec();
      return doc ? (doc.toObject() as IUser) : null;
    }
    const user = inMemoryDB.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) return null;
    if (includePassword) return { ...user };
    const { passwordHash, ...rest } = user;
    return rest as IUser;
  }

  static async findUserById(id: string): Promise<IUser | null> {
    if (isMongoActive()) {
      const doc = await UserModel.findById(id).exec();
      return doc ? (doc.toObject() as IUser) : null;
    }
    const user = inMemoryDB.users.find((u) => u._id.toString() === id.toString());
    if (!user) return null;
    const { passwordHash, ...rest } = user;
    return rest as IUser;
  }

  static async findEmployees(params: {
    search?: string;
    department?: string;
    isActive?: boolean | string;
    page?: number;
    limit?: number;
  }) {
    const { search, department, isActive, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    if (isMongoActive()) {
      const filter: any = { role: 'EMPLOYEE' };
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { department: { $regex: search, $options: 'i' } },
        ];
      }
      if (department && department !== 'ALL') {
        filter.department = department;
      }
      if (isActive !== undefined && isActive !== 'ALL') {
        filter.isActive = String(isActive) === 'true';
      }

      const [docs, total] = await Promise.all([
        UserModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
        UserModel.countDocuments(filter).exec(),
      ]);

      // Count tasks for each employee
      const employeesWithStats = await Promise.all(
        docs.map(async (doc) => {
          const emp = doc.toObject() as IUser;
          const assignedCount = await TaskModel.countDocuments({ assignedTo: emp._id }).exec();
          const completedCount = await TaskModel.countDocuments({
            assignedTo: emp._id,
            status: 'COMPLETED',
          }).exec();
          return {
            ...emp,
            assignedTasksCount: assignedCount,
            completedTasksCount: completedCount,
          };
        })
      );

      return {
        data: employeesWithStats,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    }

    // In-memory implementation
    let list = inMemoryDB.users.filter((u) => u.role === 'EMPLOYEE');

    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(s) ||
          u.email.toLowerCase().includes(s) ||
          (u.department && u.department.toLowerCase().includes(s))
      );
    }
    if (department && department !== 'ALL') {
      list = list.filter((u) => u.department === department);
    }
    if (isActive !== undefined && isActive !== 'ALL') {
      const activeBool = String(isActive) === 'true';
      list = list.filter((u) => u.isActive === activeBool);
    }

    const total = list.length;
    const paged = list.slice(skip, skip + limit);

    const data = paged.map((emp) => {
      const assigned = inMemoryDB.tasks.filter((t) => t.assignedTo.toString() === emp._id.toString());
      const completed = assigned.filter((t) => t.status === 'COMPLETED').length;
      const { passwordHash, ...safe } = emp;
      return {
        ...safe,
        assignedTasksCount: assigned.length,
        completedTasksCount: completed,
      };
    });

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async getActiveEmployees(): Promise<IUser[]> {
    if (isMongoActive()) {
      const docs = await UserModel.find({ role: 'EMPLOYEE', isActive: true })
        .sort({ name: 1 })
        .exec();
      return docs.map((d) => d.toObject() as IUser);
    }
    return inMemoryDB.users
      .filter((u) => u.role === 'EMPLOYEE' && u.isActive)
      .map(({ passwordHash, ...rest }) => rest as IUser);
  }

  static async createUser(userData: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
    department?: string;
    isActive?: boolean;
  }): Promise<IUser> {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(userData.password, salt);

    if (isMongoActive()) {
      const doc = await UserModel.create({
        name: userData.name.trim(),
        email: userData.email.trim().toLowerCase(),
        passwordHash,
        role: userData.role || 'EMPLOYEE',
        department: userData.department || 'Engineering',
        isActive: userData.isActive !== undefined ? userData.isActive : true,
      });
      const ret = doc.toObject();
      delete ret.passwordHash;
      return ret as IUser;
    }

    const newUser: IUser = {
      _id: inMemoryDB.generateId(),
      name: userData.name.trim(),
      email: userData.email.trim().toLowerCase(),
      passwordHash,
      role: userData.role || 'EMPLOYEE',
      department: userData.department || 'Engineering',
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryDB.users.push(newUser);
    const { passwordHash: _, ...safe } = newUser;
    return safe as IUser;
  }

  static async updateUser(
    id: string,
    updates: Partial<{
      name: string;
      email: string;
      department: string;
      isActive: boolean;
      password?: string;
    }>
  ): Promise<IUser | null> {
    let passwordHash: string | undefined;
    if (updates.password && updates.password.trim().length >= 6) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(updates.password, salt);
    }

    if (isMongoActive()) {
      const doc = await UserModel.findById(id).exec();
      if (!doc) return null;
      if (updates.name) doc.name = updates.name.trim();
      if (updates.email) doc.email = updates.email.trim().toLowerCase();
      if (updates.department) doc.department = updates.department.trim();
      if (updates.isActive !== undefined) doc.isActive = updates.isActive;
      if (passwordHash) doc.passwordHash = passwordHash;
      await doc.save();
      const obj = doc.toObject();
      delete obj.passwordHash;
      return obj as IUser;
    }

    const idx = inMemoryDB.users.findIndex((u) => u._id.toString() === id.toString());
    if (idx === -1) return null;
    const existing = inMemoryDB.users[idx];
    const updated: IUser = {
      ...existing,
      name: updates.name ? updates.name.trim() : existing.name,
      email: updates.email ? updates.email.trim().toLowerCase() : existing.email,
      department: updates.department !== undefined ? updates.department.trim() : existing.department,
      isActive: updates.isActive !== undefined ? updates.isActive : existing.isActive,
      passwordHash: passwordHash || existing.passwordHash,
      updatedAt: new Date(),
    };
    inMemoryDB.users[idx] = updated;
    const { passwordHash: _, ...safe } = updated;
    return safe as IUser;
  }

  static async toggleEmployeeStatus(id: string, isActive: boolean): Promise<IUser | null> {
    return this.updateUser(id, { isActive });
  }

  // =================== TASKS ===================
  static async findTasks(params: {
    search?: string;
    status?: string;
    priority?: string;
    assignedTo?: string;
    createdBy?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      search,
      status,
      priority,
      assignedTo,
      createdBy,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;

    if (isMongoActive()) {
      const filter: any = {};
      if (status && status !== 'ALL') {
        filter.status = status;
      }
      if (priority && priority !== 'ALL') {
        filter.priority = priority;
      }
      if (assignedTo && assignedTo !== 'ALL') {
        filter.assignedTo = assignedTo;
      }
      if (createdBy) {
        filter.createdBy = createdBy;
      }
      if (search && search.trim()) {
        const s = search.trim();
        // find matching users for assigned employee search
        const matchedUsers = await UserModel.find({
          $or: [
            { name: { $regex: s, $options: 'i' } },
            { email: { $regex: s, $options: 'i' } },
          ],
        }).select('_id');
        const matchedUserIds = matchedUsers.map((u) => u._id);

        filter.$or = [
          { title: { $regex: s, $options: 'i' } },
          { description: { $regex: s, $options: 'i' } },
          { taskIdentifier: { $regex: s, $options: 'i' } },
          { assignedTo: { $in: matchedUserIds } },
        ];
      }

      const sortDir = sortOrder === 'asc' ? 1 : -1;
      const sortObj: any = { [sortBy]: sortDir };

      const [docs, total] = await Promise.all([
        TaskModel.find(filter)
          .populate('assignedTo', 'name email department isActive')
          .populate('createdBy', 'name email role')
          .sort(sortObj)
          .skip(skip)
          .limit(limit)
          .exec(),
        TaskModel.countDocuments(filter).exec(),
      ]);

      return {
        data: docs.map((d) => d.toObject() as ITask),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    }

    // In-memory implementation
    let list = [...inMemoryDB.tasks];

    if (status && status !== 'ALL') {
      list = list.filter((t) => t.status === status);
    }
    if (priority && priority !== 'ALL') {
      list = list.filter((t) => t.priority === priority);
    }
    if (assignedTo && assignedTo !== 'ALL') {
      list = list.filter((t) => t.assignedTo.toString() === assignedTo.toString());
    }
    if (createdBy) {
      list = list.filter((t) => t.createdBy.toString() === createdBy.toString());
    }

    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      list = list.filter((t) => {
        const assignedEmp = inMemoryDB.users.find(
          (u) => u._id.toString() === t.assignedTo.toString()
        );
        const titleMatch = t.title.toLowerCase().includes(s);
        const descMatch = t.description.toLowerCase().includes(s);
        const idMatch = t.taskIdentifier.toLowerCase().includes(s);
        const empMatch =
          assignedEmp &&
          (assignedEmp.name.toLowerCase().includes(s) ||
            assignedEmp.email.toLowerCase().includes(s));
        return titleMatch || descMatch || idMatch || empMatch;
      });
    }

    // Sort
    list.sort((a: any, b: any) => {
      const valA = a[sortBy] || '';
      const valB = b[sortBy] || '';
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = list.length;
    const paged = list.slice(skip, skip + limit);

    // Populate references
    const populated = paged.map((t) => {
      const emp = inMemoryDB.users.find((u) => u._id.toString() === t.assignedTo.toString());
      const creator = inMemoryDB.users.find((u) => u._id.toString() === t.createdBy.toString());
      return {
        ...t,
        assignedTo: emp
          ? {
              _id: emp._id,
              name: emp.name,
              email: emp.email,
              department: emp.department,
              isActive: emp.isActive,
            }
          : t.assignedTo,
        createdBy: creator
          ? {
              _id: creator._id,
              name: creator.name,
              email: creator.email,
              role: creator.role,
            }
          : t.createdBy,
      };
    });

    return {
      data: populated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async findTaskById(id: string): Promise<ITask | null> {
    if (isMongoActive()) {
      const doc = await TaskModel.findById(id)
        .populate('assignedTo', 'name email department isActive')
        .populate('createdBy', 'name email role')
        .exec();
      return doc ? (doc.toObject() as ITask) : null;
    }
    const t = inMemoryDB.tasks.find((task) => task._id.toString() === id.toString());
    if (!t) return null;
    const emp = inMemoryDB.users.find((u) => u._id.toString() === t.assignedTo.toString());
    const creator = inMemoryDB.users.find((u) => u._id.toString() === t.createdBy.toString());
    return {
      ...t,
      assignedTo: emp
        ? {
            _id: emp._id,
            name: emp.name,
            email: emp.email,
            department: emp.department,
            isActive: emp.isActive,
          }
        : t.assignedTo,
      createdBy: creator
        ? {
            _id: creator._id,
            name: creator.name,
            email: creator.email,
            role: creator.role,
          }
        : t.createdBy,
    };
  }

  static async createTask(data: {
    title: string;
    description: string;
    assignedTo: string;
    createdBy: string;
    priority?: TaskPriority;
    status?: TaskStatus;
    dueDate?: Date | string | null;
  }): Promise<ITask> {
    const taskCount = isMongoActive()
      ? (await TaskModel.countDocuments().exec()) + 101
      : inMemoryDB.tasks.length + 101;
    const taskIdentifier = `TASK-${taskCount}`;

    if (isMongoActive()) {
      const doc = await TaskModel.create({
        taskIdentifier,
        title: data.title.trim(),
        description: data.description.trim(),
        assignedTo: data.assignedTo,
        createdBy: data.createdBy,
        priority: data.priority || 'MEDIUM',
        status: data.status || 'NOT_STARTED',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      });

      // Log initial activity
      await this.logActivity({
        task: doc._id.toString(),
        actor: data.createdBy,
        newStatus: data.status || 'NOT_STARTED',
        action: 'CREATED',
        notes: `Task created and assigned.`,
      });

      const populated = await TaskModel.findById(doc._id)
        .populate('assignedTo', 'name email department isActive')
        .populate('createdBy', 'name email role')
        .exec();

      return populated!.toObject() as ITask;
    }

    const newTask: ITask = {
      _id: inMemoryDB.generateId(),
      taskIdentifier: inMemoryDB.getNextTaskIdentifier(),
      title: data.title.trim(),
      description: data.description.trim(),
      assignedTo: data.assignedTo,
      createdBy: data.createdBy,
      priority: data.priority || 'MEDIUM',
      status: data.status || 'NOT_STARTED',
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryDB.tasks.unshift(newTask);

    await this.logActivity({
      task: newTask._id,
      actor: data.createdBy,
      newStatus: newTask.status,
      action: 'CREATED',
      notes: `Task created and assigned.`,
    });

    return (await this.findTaskById(newTask._id))!;
  }

  static async updateTask(
    id: string,
    updates: Partial<{
      title: string;
      description: string;
      assignedTo: string;
      priority: TaskPriority;
      status: TaskStatus;
      dueDate: Date | string | null;
    }>,
    actorId: string
  ): Promise<{ task: ITask; assignmentChanged: boolean; previousAssignedTo?: string } | null> {
    const existing = await this.findTaskById(id);
    if (!existing) return null;

    const previousAssignedId =
      typeof existing.assignedTo === 'object' && existing.assignedTo !== null
        ? (existing.assignedTo as IUser)._id.toString()
        : existing.assignedTo.toString();

    const previousStatus = existing.status;
    const assignmentChanged =
      updates.assignedTo !== undefined && updates.assignedTo.toString() !== previousAssignedId;

    if (isMongoActive()) {
      const doc = await TaskModel.findById(id).exec();
      if (!doc) return null;

      if (updates.title) doc.title = updates.title.trim();
      if (updates.description) doc.description = updates.description.trim();
      if (updates.priority) doc.priority = updates.priority;
      if (updates.status) doc.status = updates.status;
      if (updates.assignedTo) doc.assignedTo = updates.assignedTo as any;
      if (updates.dueDate !== undefined) {
        doc.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;
      }
      await doc.save();

      // Log activity
      let action = 'DETAILS_UPDATED';
      let notes = 'Task details updated by Admin.';
      if (assignmentChanged) {
        action = 'REASSIGNED';
        notes = `Task reassigned to new employee.`;
      } else if (updates.status && updates.status !== previousStatus) {
        action = 'STATUS_UPDATED';
        notes = `Status changed from ${previousStatus} to ${updates.status}.`;
      }

      await this.logActivity({
        task: doc._id.toString(),
        actor: actorId,
        previousStatus,
        newStatus: doc.status,
        action,
        notes,
      });

      const updatedDoc = await TaskModel.findById(doc._id)
        .populate('assignedTo', 'name email department isActive')
        .populate('createdBy', 'name email role')
        .exec();

      return {
        task: updatedDoc!.toObject() as ITask,
        assignmentChanged,
        previousAssignedTo: previousAssignedId,
      };
    }

    const idx = inMemoryDB.tasks.findIndex((t) => t._id.toString() === id.toString());
    if (idx === -1) return null;
    const current = inMemoryDB.tasks[idx];

    const updatedTask: ITask = {
      ...current,
      title: updates.title !== undefined ? updates.title.trim() : current.title,
      description: updates.description !== undefined ? updates.description.trim() : current.description,
      priority: updates.priority || current.priority,
      status: updates.status || current.status,
      assignedTo: updates.assignedTo || current.assignedTo,
      dueDate: updates.dueDate !== undefined ? (updates.dueDate ? new Date(updates.dueDate) : null) : current.dueDate,
      updatedAt: new Date(),
    };
    inMemoryDB.tasks[idx] = updatedTask;

    let action = 'DETAILS_UPDATED';
    let notes = 'Task details updated by Admin.';
    if (assignmentChanged) {
      action = 'REASSIGNED';
      notes = `Task reassigned to new employee.`;
    } else if (updates.status && updates.status !== previousStatus) {
      action = 'STATUS_UPDATED';
      notes = `Status changed from ${previousStatus} to ${updates.status}.`;
    }

    await this.logActivity({
      task: updatedTask._id,
      actor: actorId,
      previousStatus,
      newStatus: updatedTask.status,
      action,
      notes,
    });

    const populated = await this.findTaskById(updatedTask._id);
    return {
      task: populated!,
      assignmentChanged,
      previousAssignedTo: previousAssignedId,
    };
  }

  static async updateTaskStatus(
    id: string,
    newStatus: TaskStatus,
    actorId: string,
    notes?: string
  ): Promise<{ task: ITask; statusChanged: boolean; previousStatus: TaskStatus } | null> {
    const existing = await this.findTaskById(id);
    if (!existing) return null;

    const previousStatus = existing.status;
    const statusChanged = previousStatus !== newStatus;

    if (!statusChanged) {
      return { task: existing, statusChanged: false, previousStatus };
    }

    if (isMongoActive()) {
      const doc = await TaskModel.findById(id).exec();
      if (!doc) return null;
      doc.status = newStatus;
      await doc.save();

      await this.logActivity({
        task: doc._id.toString(),
        actor: actorId,
        previousStatus,
        newStatus,
        action: 'STATUS_UPDATED',
        notes: notes || `Status updated to ${newStatus}.`,
      });

      const updated = await TaskModel.findById(doc._id)
        .populate('assignedTo', 'name email department isActive')
        .populate('createdBy', 'name email role')
        .exec();

      return {
        task: updated!.toObject() as ITask,
        statusChanged: true,
        previousStatus,
      };
    }

    const idx = inMemoryDB.tasks.findIndex((t) => t._id.toString() === id.toString());
    if (idx === -1) return null;

    inMemoryDB.tasks[idx].status = newStatus;
    inMemoryDB.tasks[idx].updatedAt = new Date();

    await this.logActivity({
      task: inMemoryDB.tasks[idx]._id,
      actor: actorId,
      previousStatus,
      newStatus,
      action: 'STATUS_UPDATED',
      notes: notes || `Status updated to ${newStatus}.`,
    });

    const populated = await this.findTaskById(inMemoryDB.tasks[idx]._id);
    return {
      task: populated!,
      statusChanged: true,
      previousStatus,
    };
  }

  static async deleteTask(id: string, actorId: string): Promise<boolean> {
    if (isMongoActive()) {
      const doc = await TaskModel.findById(id).exec();
      if (!doc) return false;
      await this.logActivity({
        task: id,
        actor: actorId,
        action: 'DELETED',
        notes: `Task deleted.`,
      });
      await TaskModel.findByIdAndDelete(id).exec();
      return true;
    }

    const idx = inMemoryDB.tasks.findIndex((t) => t._id.toString() === id.toString());
    if (idx === -1) return false;

    await this.logActivity({
      task: id,
      actor: actorId,
      action: 'DELETED',
      notes: `Task deleted.`,
    });

    inMemoryDB.tasks.splice(idx, 1);
    return true;
  }

  // =================== TASK ACTIVITIES ===================
  static async logActivity(data: {
    task: string;
    actor: string;
    previousStatus?: TaskStatus | null;
    newStatus?: TaskStatus | null;
    action: string;
    notes?: string;
  }): Promise<ITaskActivity> {
    if (isMongoActive()) {
      const doc = await TaskActivityModel.create({
        task: data.task,
        actor: data.actor,
        previousStatus: data.previousStatus || null,
        newStatus: data.newStatus || null,
        action: data.action,
        notes: data.notes || '',
        timestamp: new Date(),
      });
      return doc.toObject() as ITaskActivity;
    }

    const newAct: ITaskActivity = {
      _id: inMemoryDB.generateId(),
      task: data.task,
      actor: data.actor,
      previousStatus: data.previousStatus || null,
      newStatus: data.newStatus || null,
      action: data.action as any,
      notes: data.notes,
      timestamp: new Date(),
    };
    inMemoryDB.activities.unshift(newAct);
    return newAct;
  }

  static async getTaskActivities(taskId: string): Promise<any[]> {
    if (isMongoActive()) {
      const docs = await TaskActivityModel.find({ task: taskId })
        .populate('actor', 'name email role')
        .sort({ timestamp: -1 })
        .exec();
      return docs.map((d) => d.toObject());
    }

    return inMemoryDB.activities
      .filter((a) => a.task.toString() === taskId.toString())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .map((a) => {
        const actorUser = inMemoryDB.users.find((u) => u._id.toString() === a.actor.toString());
        return {
          ...a,
          actor: actorUser
            ? {
                _id: actorUser._id,
                name: actorUser.name,
                email: actorUser.email,
                role: actorUser.role,
              }
            : a.actor,
        };
      });
  }

  // =================== NOTIFICATIONS ===================
  static async createNotification(data: {
    recipient: string;
    recipientUser?: string;
    task?: string;
    type: 'TASK_ASSIGNED' | 'TASK_STATUS_UPDATED';
    subject: string;
    content: string;
    deliveryStatus?: 'PENDING' | 'SENT' | 'FAILED';
    attempts?: number;
    lastError?: string | null;
  }): Promise<INotification> {
    if (isMongoActive()) {
      const doc = await NotificationModel.create({
        recipient: data.recipient.toLowerCase().trim(),
        recipientUser: data.recipientUser || null,
        task: data.task || null,
        type: data.type,
        subject: data.subject,
        content: data.content,
        deliveryStatus: data.deliveryStatus || 'PENDING',
        attempts: data.attempts || 0,
        lastError: data.lastError || null,
      });
      return doc.toObject() as INotification;
    }

    const notif: INotification = {
      _id: inMemoryDB.generateId(),
      recipient: data.recipient.toLowerCase().trim(),
      recipientUser: data.recipientUser,
      task: data.task,
      type: data.type,
      subject: data.subject,
      content: data.content,
      deliveryStatus: data.deliveryStatus || 'PENDING',
      attempts: data.attempts || 0,
      lastError: data.lastError || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryDB.notifications.unshift(notif);
    return notif;
  }

  static async updateNotification(
    id: string,
    updates: Partial<{
      deliveryStatus: 'PENDING' | 'SENT' | 'FAILED';
      attempts: number;
      lastError: string | null;
    }>
  ): Promise<INotification | null> {
    if (isMongoActive()) {
      const doc = await NotificationModel.findByIdAndUpdate(id, updates, { new: true }).exec();
      return doc ? (doc.toObject() as INotification) : null;
    }

    const idx = inMemoryDB.notifications.findIndex((n) => n._id.toString() === id.toString());
    if (idx === -1) return null;
    inMemoryDB.notifications[idx] = {
      ...inMemoryDB.notifications[idx],
      ...updates,
      updatedAt: new Date(),
    };
    return inMemoryDB.notifications[idx];
  }

  static async getNotifications(params: {
    status?: string;
    recipient?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, recipient, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    if (isMongoActive()) {
      const filter: any = {};
      if (status && status !== 'ALL') filter.deliveryStatus = status;
      if (recipient) filter.recipient = { $regex: recipient, $options: 'i' };

      const [docs, total] = await Promise.all([
        NotificationModel.find(filter)
          .populate('task', 'title taskIdentifier')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        NotificationModel.countDocuments(filter).exec(),
      ]);

      return {
        data: docs.map((d) => d.toObject() as INotification),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    }

    let list = [...inMemoryDB.notifications];
    if (status && status !== 'ALL') {
      list = list.filter((n) => n.deliveryStatus === status);
    }
    if (recipient) {
      list = list.filter((n) => n.recipient.toLowerCase().includes(recipient.toLowerCase()));
    }

    const total = list.length;
    const paged = list.slice(skip, skip + limit);

    const populated = paged.map((n) => {
      const t = n.task
        ? inMemoryDB.tasks.find((task) => task._id.toString() === n.task!.toString())
        : null;
      return {
        ...n,
        task: t ? { _id: t._id, title: t.title, taskIdentifier: t.taskIdentifier } : n.task,
      };
    });

    return {
      data: populated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  // =================== DASHBOARD STATS ===================
  static async getAdminDashboardStats() {
    let employeesCount = 0;
    let tasks: ITask[] = [];
    let activities: any[] = [];

    if (isMongoActive()) {
      employeesCount = await UserModel.countDocuments({ role: 'EMPLOYEE' }).exec();
      const taskDocs = await TaskModel.find()
        .populate('assignedTo', 'name email department')
        .sort({ updatedAt: -1 })
        .exec();
      tasks = taskDocs.map((d) => d.toObject() as ITask);
      const actDocs = await TaskActivityModel.find()
        .populate('actor', 'name email')
        .populate('task', 'title taskIdentifier')
        .sort({ timestamp: -1 })
        .limit(10)
        .exec();
      activities = actDocs.map((d) => d.toObject());
    } else {
      employeesCount = inMemoryDB.users.filter((u) => u.role === 'EMPLOYEE').length;
      tasks = inMemoryDB.tasks;
      activities = inMemoryDB.activities.slice(0, 10).map((a) => {
        const actor = inMemoryDB.users.find((u) => u._id.toString() === a.actor.toString());
        const t = inMemoryDB.tasks.find((task) => task._id.toString() === a.task.toString());
        return {
          ...a,
          actor: actor ? { name: actor.name, email: actor.email } : a.actor,
          task: t ? { title: t.title, taskIdentifier: t.taskIdentifier } : a.task,
        };
      });
    }

    const totalTasks = tasks.length;
    const notStarted = tasks.filter((t) => t.status === 'NOT_STARTED').length;
    const pending = tasks.filter((t) => t.status === 'PENDING').length;
    const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const completed = tasks.filter((t) => t.status === 'COMPLETED').length;
    const highPriority = tasks.filter((t) => t.priority === 'HIGH').length;
    const mediumPriority = tasks.filter((t) => t.priority === 'MEDIUM').length;
    const lowPriority = tasks.filter((t) => t.priority === 'LOW').length;

    // Overdue tasks
    const now = new Date();
    const overdue = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'COMPLETED'
    ).length;

    // Employee task summary
    let allEmployees: IUser[] = [];
    if (isMongoActive()) {
      const empDocs = await UserModel.find({ role: 'EMPLOYEE' }).exec();
      allEmployees = empDocs.map((d) => d.toObject() as IUser);
    } else {
      allEmployees = inMemoryDB.users.filter((u) => u.role === 'EMPLOYEE');
    }

    const employeeSummary = allEmployees.map((emp) => {
      const empTasks = tasks.filter((t) => {
        const id =
          typeof t.assignedTo === 'object' && t.assignedTo !== null
            ? (t.assignedTo as IUser)._id.toString()
            : t.assignedTo.toString();
        return id === emp._id.toString();
      });
      const empCompleted = empTasks.filter((t) => t.status === 'COMPLETED').length;
      return {
        id: emp._id,
        name: emp.name,
        department: emp.department,
        totalAssigned: empTasks.length,
        completed: empCompleted,
        inProgress: empTasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'PENDING').length,
        completionRate: empTasks.length > 0 ? Math.round((empCompleted / empTasks.length) * 100) : 0,
      };
    });

    return {
      overview: {
        totalEmployees: employeesCount,
        totalTasks,
        notStarted,
        pending,
        inProgress,
        completed,
        highPriority,
        overdue,
      },
      distribution: {
        byStatus: [
          { status: 'Not Started', key: 'NOT_STARTED', count: notStarted, color: '#64748b' },
          { status: 'Pending', key: 'PENDING', count: pending, color: '#f59e0b' },
          { status: 'In Progress', key: 'IN_PROGRESS', count: inProgress, color: '#3b82f6' },
          { status: 'Completed', key: 'COMPLETED', count: completed, color: '#10b981' },
        ],
        byPriority: [
          { priority: 'High', key: 'HIGH', count: highPriority, color: '#ef4444' },
          { priority: 'Medium', key: 'MEDIUM', count: mediumPriority, color: '#f59e0b' },
          { priority: 'Low', key: 'LOW', count: lowPriority, color: '#10b981' },
        ],
      },
      employeeSummary,
      recentActivity: activities,
      recentTasks: tasks.slice(0, 5),
    };
  }

  static async getEmployeeDashboardStats(employeeId: string) {
    let tasks: ITask[] = [];
    let activities: any[] = [];

    if (isMongoActive()) {
      const taskDocs = await TaskModel.find({ assignedTo: employeeId })
        .sort({ updatedAt: -1 })
        .exec();
      tasks = taskDocs.map((d) => d.toObject() as ITask);
      const actDocs = await TaskActivityModel.find({
        $or: [{ actor: employeeId }, { task: { $in: tasks.map((t) => t._id) } }],
      })
        .populate('actor', 'name email')
        .populate('task', 'title taskIdentifier')
        .sort({ timestamp: -1 })
        .limit(8)
        .exec();
      activities = actDocs.map((d) => d.toObject());
    } else {
      tasks = inMemoryDB.tasks.filter((t) => t.assignedTo.toString() === employeeId.toString());
      activities = inMemoryDB.activities
        .filter(
          (a) =>
            a.actor.toString() === employeeId.toString() ||
            tasks.some((t) => t._id.toString() === a.task.toString())
        )
        .slice(0, 8)
        .map((a) => {
          const actor = inMemoryDB.users.find((u) => u._id.toString() === a.actor.toString());
          const t = inMemoryDB.tasks.find((task) => task._id.toString() === a.task.toString());
          return {
            ...a,
            actor: actor ? { name: actor.name, email: actor.email } : a.actor,
            task: t ? { title: t.title, taskIdentifier: t.taskIdentifier } : a.task,
          };
        });
    }

    const totalAssigned = tasks.length;
    const notStarted = tasks.filter((t) => t.status === 'NOT_STARTED').length;
    const pending = tasks.filter((t) => t.status === 'PENDING').length;
    const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const completed = tasks.filter((t) => t.status === 'COMPLETED').length;
    const highPriority = tasks.filter((t) => t.priority === 'HIGH').length;
    const mediumPriority = tasks.filter((t) => t.priority === 'MEDIUM').length;
    const lowPriority = tasks.filter((t) => t.priority === 'LOW').length;

    const now = new Date();
    const overdue = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'COMPLETED'
    ).length;

    // Due soon: within next 3 days
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);
    const dueSoonTasks = tasks
      .filter((t) => {
        if (!t.dueDate || t.status === 'COMPLETED') return false;
        const d = new Date(t.dueDate);
        return d >= now && d <= threeDaysFromNow;
      })
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

    const completionRate = totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0;

    return {
      overview: {
        totalAssigned,
        notStarted,
        pending,
        inProgress,
        completed,
        overdue,
        completionRate,
      },
      distribution: {
        byStatus: [
          { status: 'Not Started', key: 'NOT_STARTED', count: notStarted, color: '#64748b' },
          { status: 'Pending', key: 'PENDING', count: pending, color: '#f59e0b' },
          { status: 'In Progress', key: 'IN_PROGRESS', count: inProgress, color: '#3b82f6' },
          { status: 'Completed', key: 'COMPLETED', count: completed, color: '#10b981' },
        ],
        byPriority: [
          { priority: 'High', key: 'HIGH', count: highPriority, color: '#ef4444' },
          { priority: 'Medium', key: 'MEDIUM', count: mediumPriority, color: '#f59e0b' },
          { priority: 'Low', key: 'LOW', count: lowPriority, color: '#10b981' },
        ],
      },
      dueSoonTasks,
      recentTasks: tasks.slice(0, 5),
      recentActivity: activities,
    };
  }
}
