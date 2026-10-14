import { Response } from 'express';
import { DataService } from '../services/dataService.ts';
import { EmailService } from '../services/emailService.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { IUser, TaskStatus } from '../types/index.ts';

export class TaskController {
  /**
   * GET /api/tasks
   * List tasks with server-side pagination, search, status, and priority filtering
   * Admins can view all; Employees strictly view tasks assigned to their account
   */
  static async getTasks(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const search = (req.query.search as string) || '';
      const status = (req.query.status as string) || '';
      const priority = (req.query.priority as string) || '';
      const employeeId = (req.query.employeeId as string) || '';

      // Enforce Role Restriction:
      // An employee can NEVER query tasks outside their own assignment
      let assignedToFilter = employeeId;
      if (user.role === 'EMPLOYEE') {
        assignedToFilter = user.id;
      }

      const result = await DataService.findTasks({
        page,
        limit,
        search,
        status,
        priority,
        assignedTo: assignedToFilter,
      });

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve tasks.',
      });
    }
  }

  /**
   * GET /api/tasks/:id
   * Get single task details
   */
  static async getTaskById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user!;
      const task = await DataService.findTaskById(id);

      if (!task) {
        res.status(404).json({
          success: false,
          message: 'Task not found.',
        });
        return;
      }

      // Check authorization if Employee
      if (user.role === 'EMPLOYEE') {
        const assignedId =
          typeof task.assignedTo === 'object' && task.assignedTo !== null
            ? (task.assignedTo as IUser)._id.toString()
            : task.assignedTo.toString();

        if (assignedId !== user.id) {
          res.status(403).json({
            success: false,
            message: 'Access denied. You do not have permission to view tasks assigned to other employees.',
          });
          return;
        }
      }

      res.status(200).json({
        success: true,
        data: task,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch task details.',
      });
    }
  }

  /**
   * POST /api/tasks
   * Admin only: Create a new task and notify assigned employee
   */
  static async createTask(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { title, description, assignedTo, priority, status, dueDate } = req.body;

      // Validate assigned employee exists and is active
      const employee = await DataService.findUserById(assignedTo);
      if (!employee || employee.role !== 'EMPLOYEE') {
        res.status(400).json({
          success: false,
          message: 'The assigned user must be a registered employee.',
        });
        return;
      }

      if (!employee.isActive) {
        res.status(400).json({
          success: false,
          message: `Cannot assign task to ${employee.name} because their account is currently deactivated.`,
        });
        return;
      }

      const newTask = await DataService.createTask({
        title,
        description,
        assignedTo,
        createdBy: user.id,
        priority: priority || 'MEDIUM',
        status: status || 'NOT_STARTED',
        dueDate,
      });

      // Email notification dispatch (gracefully isolated)
      let emailNotice = '';
      try {
        const emailResult = await EmailService.sendTaskAssignmentEmail({
          employee,
          task: newTask,
        });
        emailNotice = emailResult.message;
      } catch (err: any) {
        console.warn('Email dispatch warning:', err.message);
        emailNotice = 'Task saved. Email notification logged in queue.';
      }

      res.status(201).json({
        success: true,
        message: `Task ${newTask.taskIdentifier} created successfully. ${emailNotice}`,
        data: newTask,
      });
    } catch (error: any) {
      console.error('Error creating task:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create task.',
      });
    }
  }

  /**
   * PUT /api/tasks/:id
   * Admin only: Update task metadata, reassign employee, or adjust priority
   */
  static async updateTask(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user!;
      const { title, description, assignedTo, priority, status, dueDate } = req.body;

      const existingTask = await DataService.findTaskById(id);
      if (!existingTask) {
        res.status(404).json({
          success: false,
          message: 'Task not found.',
        });
        return;
      }

      // If assigning to a different employee, validate employee
      let newEmployee: IUser | null = null;
      if (assignedTo) {
        newEmployee = await DataService.findUserById(assignedTo);
        if (!newEmployee || newEmployee.role !== 'EMPLOYEE') {
          res.status(400).json({
            success: false,
            message: 'Invalid employee selected for task assignment.',
          });
          return;
        }
        if (!newEmployee.isActive) {
          res.status(400).json({
            success: false,
            message: `Employee ${newEmployee.name} is deactivated and cannot receive new tasks.`,
          });
          return;
        }
      }

      const updateResult = await DataService.updateTask(
        id,
        {
          title,
          description,
          assignedTo,
          priority,
          status,
          dueDate,
        },
        user.id
      );

      if (!updateResult) {
        res.status(404).json({
          success: false,
          message: 'Task could not be updated.',
        });
        return;
      }

      let emailNotice = '';
      // If assignment changed, send notification to newly assigned employee
      if (updateResult.assignmentChanged && newEmployee) {
        try {
          const emailRes = await EmailService.sendTaskAssignmentEmail({
            employee: newEmployee,
            task: updateResult.task,
          });
          emailNotice = ` ${emailRes.message}`;
        } catch (e: any) {
          console.warn('Reassignment email notification notice:', e.message);
        }
      }

      res.status(200).json({
        success: true,
        message: `Task ${updateResult.task.taskIdentifier} updated successfully.${emailNotice}`,
        data: updateResult.task,
      });
    } catch (error: any) {
      console.error('Error updating task:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update task.',
      });
    }
  }

  /**
   * PATCH /api/tasks/:id/status
   * Employee (assigned to task) or Admin updates status
   * Triggers audit log and admin email notification
   */
  static async updateTaskStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user!;
      const { status, notes } = req.body;

      const existingTask = await DataService.findTaskById(id);
      if (!existingTask) {
        res.status(404).json({
          success: false,
          message: 'Task not found.',
        });
        return;
      }

      // Security check: If Employee, must be assigned to this task
      const assignedId =
        typeof existingTask.assignedTo === 'object' && existingTask.assignedTo !== null
          ? (existingTask.assignedTo as IUser)._id.toString()
          : existingTask.assignedTo.toString();

      if (user.role === 'EMPLOYEE' && assignedId !== user.id) {
        res.status(403).json({
          success: false,
          message: 'Unauthorized. You can only update the status of tasks assigned to your account.',
        });
        return;
      }

      const updateResult = await DataService.updateTaskStatus(
        id,
        status as TaskStatus,
        user.id,
        notes
      );

      if (!updateResult) {
        res.status(404).json({
          success: false,
          message: 'Task update failed.',
        });
        return;
      }

      let emailNotice = '';
      // Send notification to Admin only if status actually changed
      if (updateResult.statusChanged) {
        try {
          const employeeUser = await DataService.findUserById(user.id);
          if (employeeUser) {
            const emailRes = await EmailService.sendStatusUpdateEmail({
              employee: employeeUser,
              task: updateResult.task,
              previousStatus: updateResult.previousStatus,
              newStatus: status,
              notes,
            });
            emailNotice = ` ${emailRes.message}`;
          }
        } catch (e: any) {
          console.warn('Status notification notice:', e.message);
        }
      }

      res.status(200).json({
        success: true,
        message: updateResult.statusChanged
          ? `Status updated to ${status}.${emailNotice}`
          : 'Task status remained unchanged.',
        data: updateResult.task,
      });
    } catch (error: any) {
      console.error('Error updating task status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update task status.',
      });
    }
  }

  /**
   * DELETE /api/tasks/:id
   * Admin only: Delete a task
   */
  static async deleteTask(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user!;

      const existing = await DataService.findTaskById(id);
      if (!existing) {
        res.status(404).json({
          success: false,
          message: 'Task not found.',
        });
        return;
      }

      const deleted = await DataService.deleteTask(id, user.id);
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Task could not be deleted.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: `Task ${existing.taskIdentifier} has been deleted.`,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete task.',
      });
    }
  }

  /**
   * GET /api/tasks/:id/activity
   * Retrieve audit logs and status history for a task
   */
  static async getTaskActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user!;

      const task = await DataService.findTaskById(id);
      if (!task) {
        res.status(404).json({
          success: false,
          message: 'Task not found.',
        });
        return;
      }

      // If employee, verify access
      if (user.role === 'EMPLOYEE') {
        const assignedId =
          typeof task.assignedTo === 'object' && task.assignedTo !== null
            ? (task.assignedTo as IUser)._id.toString()
            : task.assignedTo.toString();

        if (assignedId !== user.id) {
          res.status(403).json({
            success: false,
            message: 'Unauthorized to view activity history for this task.',
          });
          return;
        }
      }

      const activities = await DataService.getTaskActivities(id);

      res.status(200).json({
        success: true,
        data: activities,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve task activity log.',
      });
    }
  }
}
