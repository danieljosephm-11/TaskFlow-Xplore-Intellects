import { Response } from 'express';
import { DataService } from '../services/dataService.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';

export class EmployeeController {
  /**
   * GET /api/employees
   * Admin only: List all employees with pagination, search, and department filter
   */
  static async getEmployees(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const search = (req.query.search as string) || '';
      const department = (req.query.department as string) || '';
      const isActive = req.query.isActive as string;

      const result = await DataService.findEmployees({
        page,
        limit,
        search,
        department,
        isActive,
      });

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve employee directory.',
      });
    }
  }

  /**
   * GET /api/employees/active
   * Retrieve list of active employees for task assignment selectors
   */
  static async getActiveEmployees(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const employees = await DataService.getActiveEmployees();
      res.status(200).json({
        success: true,
        data: employees,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve active employees.',
      });
    }
  }

  /**
   * GET /api/employees/:id
   * Admin only: Get employee profile and their assigned tasks
   */
  static async getEmployeeById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const employee = await DataService.findUserById(id);

      if (!employee || employee.role !== 'EMPLOYEE') {
        res.status(404).json({
          success: false,
          message: 'Employee record not found.',
        });
        return;
      }

      // Fetch employee's tasks
      const tasksResult = await DataService.findTasks({
        assignedTo: id,
        limit: 50,
      });

      res.status(200).json({
        success: true,
        data: {
          employee,
          tasks: tasksResult.data,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve employee details.',
      });
    }
  }

  /**
   * POST /api/employees
   * Admin only: Create a new employee account
   */
  static async createEmployee(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name, email, password, department, isActive } = req.body;

      // Check if email already in use
      const existing = await DataService.findUserByEmail(email);
      if (existing) {
        res.status(409).json({
          success: false,
          message: `An account with the email "${email}" already exists.`,
        });
        return;
      }

      const newEmployee = await DataService.createUser({
        name,
        email,
        password,
        role: 'EMPLOYEE',
        department: department || 'Engineering',
        isActive: isActive !== undefined ? isActive : true,
      });

      res.status(201).json({
        success: true,
        message: `Employee "${newEmployee.name}" successfully created.`,
        data: newEmployee,
      });
    } catch (error: any) {
      console.error('Error creating employee:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create employee account.',
      });
    }
  }

  /**
   * PUT /api/employees/:id
   * Admin only: Update employee details
   */
  static async updateEmployee(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, email, department, isActive, password } = req.body;

      const employee = await DataService.findUserById(id);
      if (!employee) {
        res.status(404).json({
          success: false,
          message: 'Employee not found.',
        });
        return;
      }

      // If email is changing, verify not taken
      if (email && email.toLowerCase().trim() !== employee.email.toLowerCase()) {
        const taken = await DataService.findUserByEmail(email);
        if (taken && taken._id.toString() !== id.toString()) {
          res.status(409).json({
            success: false,
            message: `Email address "${email}" is already used by another account.`,
          });
          return;
        }
      }

      const updated = await DataService.updateUser(id, {
        name,
        email,
        department,
        isActive,
        password,
      });

      res.status(200).json({
        success: true,
        message: 'Employee updated successfully.',
        data: updated,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to update employee details.',
      });
    }
  }

  /**
   * PATCH /api/employees/:id/status
   * Admin only: Toggle employee active / inactive status
   */
  static async toggleStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        res.status(400).json({
          success: false,
          message: 'isActive boolean flag is required.',
        });
        return;
      }

      const updated = await DataService.toggleEmployeeStatus(id, isActive);
      if (!updated) {
        res.status(404).json({
          success: false,
          message: 'Employee not found.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: `Employee account ${isActive ? 'activated' : 'deactivated'} successfully.`,
        data: updated,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to modify employee status.',
      });
    }
  }
}
