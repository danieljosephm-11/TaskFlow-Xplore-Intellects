import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.ts';
import { UserModel } from '../src/models/User.ts';
import { TaskModel } from '../src/models/Task.ts';
import { TaskActivityModel } from '../src/models/TaskActivity.ts';
import { NotificationModel } from '../src/models/Notification.ts';
import { inMemoryDB, DataService } from '../src/services/dataService.ts';

export const seedDatabase = async (forceClean = false) => {
  console.log('--- Initializing TaskFlow Seed Data ---');

  const isMongo = mongoose.connection.readyState === 1;

  // Check if data already exists
  if (isMongo) {
    const existingAdmin = await UserModel.findOne({ email: 'admin@xploreintellects.com' }).exec();
    if (existingAdmin && !forceClean) {
      console.log('Seed check: Database already contains seed records. Skipping duplication.');
      return;
    }
    if (forceClean) {
      await Promise.all([
        UserModel.deleteMany({}),
        TaskModel.deleteMany({}),
        TaskActivityModel.deleteMany({}),
        NotificationModel.deleteMany({}),
      ]);
      console.log('Cleaned existing MongoDB collections.');
    }
  } else {
    const existingAdmin = inMemoryDB.users.find((u) => u.email === 'admin@xploreintellects.com');
    if (existingAdmin && !forceClean) {
      console.log('In-memory store already seeded.');
      return;
    }
    if (forceClean) {
      inMemoryDB.users = [];
      inMemoryDB.tasks = [];
      inMemoryDB.activities = [];
      inMemoryDB.notifications = [];
    }
  }

  // 1. Create Admin & Employees
  console.log('Creating demo users...');
  const salt = await bcrypt.genSalt(10);
  const adminPassHash = await bcrypt.hash('Admin@12345', salt);
  const empPassHash = await bcrypt.hash('Employee@12345', salt);

  const adminData = {
    name: 'Eleanor Vance',
    email: 'admin@xploreintellects.com',
    passwordHash: adminPassHash,
    role: 'ADMIN' as const,
    department: 'Engineering Leadership',
    isActive: true,
  };

  const employeeDataList = [
    {
      name: 'John Doe',
      email: 'john.doe@xploreintellects.com',
      passwordHash: empPassHash,
      role: 'EMPLOYEE' as const,
      department: 'Frontend Engineering',
      isActive: true,
    },
    {
      name: 'Jane Smith',
      email: 'jane.smith@xploreintellects.com',
      passwordHash: empPassHash,
      role: 'EMPLOYEE' as const,
      department: 'Backend Architecture',
      isActive: true,
    },
    {
      name: 'Robert Chen',
      email: 'robert.chen@xploreintellects.com',
      passwordHash: empPassHash,
      role: 'EMPLOYEE' as const,
      department: 'Quality Assurance & DevOps',
      isActive: true,
    },
  ];

  let adminUser: any;
  let employeeUsers: any[] = [];

  if (isMongo) {
    adminUser = await UserModel.create(adminData);
    for (const emp of employeeDataList) {
      const created = await UserModel.create(emp);
      employeeUsers.push(created);
    }
  } else {
    adminUser = {
      _id: inMemoryDB.generateId(),
      ...adminData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryDB.users.push(adminUser);

    for (const emp of employeeDataList) {
      const created = {
        _id: inMemoryDB.generateId(),
        ...emp,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryDB.users.push(created);
      employeeUsers.push(created);
    }
  }

  console.log(`Users seeded: 1 Admin, ${employeeUsers.length} Employees.`);

  // 2. Create 14 realistic sample tasks with mixed priorities & statuses
  console.log('Creating sample tasks...');
  const now = new Date();
  const makeDate = (daysFromNow: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + daysFromNow);
    return d;
  };

  const tasksSeed = [
    {
      taskIdentifier: 'TASK-101',
      title: 'Design Responsive Navigation Bar & Global Sidebar',
      description: 'Implement the collapsible desktop sidebar and responsive mobile bottom sheet drawer following the Xplore Intellects design constitution. Ensure WCAG AA contrast compliance and smooth transitions.',
      assignedIndex: 0, // John Doe (Frontend)
      priority: 'HIGH' as const,
      status: 'COMPLETED' as const,
      dueDate: makeDate(-2), // overdue/completed
    },
    {
      taskIdentifier: 'TASK-102',
      title: 'Implement JWT Cookie Authentication & RBAC Middleware',
      description: 'Develop HTTP-only JWT cookie issuance and role-based authorization middleware protecting all Admin and Employee endpoints against unauthorized access.',
      assignedIndex: 1, // Jane Smith (Backend)
      priority: 'HIGH' as const,
      status: 'COMPLETED' as const,
      dueDate: makeDate(-1),
    },
    {
      taskIdentifier: 'TASK-103',
      title: 'Setup Nodemailer SMTP Service & HTML Notification Templates',
      description: 'Construct the modular notification dispatcher for task assignments and status updates with sanitized error handling, retry capabilities, and professional email layouts.',
      assignedIndex: 1, // Jane Smith (Backend)
      priority: 'HIGH' as const,
      status: 'IN_PROGRESS' as const,
      dueDate: makeDate(2),
    },
    {
      taskIdentifier: 'TASK-104',
      title: 'End-to-End API Integration Testing for Employee Endpoints',
      description: 'Perform boundary testing on all employee CRUD operations, duplicate email validations, deactivation guards, and unauthorized role tampering.',
      assignedIndex: 2, // Robert Chen (QA)
      priority: 'MEDIUM' as const,
      status: 'IN_PROGRESS' as const,
      dueDate: makeDate(3),
    },
    {
      taskIdentifier: 'TASK-105',
      title: 'Build Interactive Dashboard Analytics & Distribution Charts',
      description: 'Integrate SVG/Canvas charts for task status distribution and priority breakdowns on both Admin and Employee dashboards without layout jitter.',
      assignedIndex: 0, // John Doe (Frontend)
      priority: 'HIGH' as const,
      status: 'IN_PROGRESS' as const,
      dueDate: makeDate(1),
    },
    {
      taskIdentifier: 'TASK-106',
      title: 'Database Schema Optimization & Query Indexing',
      description: 'Audit MongoDB collection indices for email, assignedTo, status, and createdAt. Verify execution speed under concurrent filter queries.',
      assignedIndex: 1, // Jane Smith (Backend)
      priority: 'MEDIUM' as const,
      status: 'PENDING' as const,
      dueDate: makeDate(5),
    },
    {
      taskIdentifier: 'TASK-107',
      title: 'Regression Suite for Server-Side Search and Pagination',
      description: 'Validate edge conditions: empty search queries, high limit parameters, out-of-bounds page requests, and debounced input synchronization.',
      assignedIndex: 2, // Robert Chen (QA)
      priority: 'LOW' as const,
      status: 'PENDING' as const,
      dueDate: makeDate(7),
    },
    {
      taskIdentifier: 'TASK-108',
      title: 'Implement Employee Account Activation & Deactivation Modal',
      description: 'Create interactive toggle controls with confirmation modals that prevent deactivated users from logging in or querying protected APIs.',
      assignedIndex: 0, // John Doe (Frontend)
      priority: 'MEDIUM' as const,
      status: 'COMPLETED' as const,
      dueDate: makeDate(-3),
    },
    {
      taskIdentifier: 'TASK-109',
      title: 'Audit Password Hashing Security & Salt Round Calibrations',
      description: 'Review bcryptjs salt rounds, sanitize sensitive credentials from API serialization, and ensure zero plaintext passwords reach logs.',
      assignedIndex: 1, // Jane Smith (Backend)
      priority: 'HIGH' as const,
      status: 'NOT_STARTED' as const,
      dueDate: makeDate(6),
    },
    {
      taskIdentifier: 'TASK-110',
      title: 'Cross-Device Responsive Form Testing on Mobile Viewports',
      description: 'Test all task forms and dialogs on 375px mobile, 768px tablet, and 1440px desktop screens. Verify touch target compliance.',
      assignedIndex: 2, // Robert Chen (QA)
      priority: 'MEDIUM' as const,
      status: 'NOT_STARTED' as const,
      dueDate: makeDate(8),
    },
    {
      taskIdentifier: 'TASK-111',
      title: 'Client-Side Form Validation using React Hook Form',
      description: 'Integrate real-time inline validation with accessible error messages on task assignment and employee creation forms.',
      assignedIndex: 0, // John Doe (Frontend)
      priority: 'MEDIUM' as const,
      status: 'NOT_STARTED' as const,
      dueDate: makeDate(9),
    },
    {
      taskIdentifier: 'TASK-112',
      title: 'Notification Delivery Failure Retry Queue Implementation',
      description: 'Implement retry endpoint and administration dashboard action to re-attempt delivery of failed email notifications.',
      assignedIndex: 1, // Jane Smith (Backend)
      priority: 'LOW' as const,
      status: 'NOT_STARTED' as const,
      dueDate: makeDate(12),
    },
    {
      taskIdentifier: 'TASK-113',
      title: 'Simulate Load Conditions on Express Middleware Pipeline',
      description: 'Verify error boundary behavior when database connectivity experiences latency spikes or network timeouts.',
      assignedIndex: 2, // Robert Chen (QA)
      priority: 'LOW' as const,
      status: 'PENDING' as const,
      dueDate: makeDate(4),
    },
    {
      taskIdentifier: 'TASK-114',
      title: 'Final Technical Assessment Package & Documentation Audit',
      description: 'Compile comprehensive setup instructions, API contracts, deployment instructions, and test credentials into the project README.',
      assignedIndex: 0, // John Doe (Frontend)
      priority: 'HIGH' as const,
      status: 'NOT_STARTED' as const,
      dueDate: makeDate(10),
    },
  ];

  for (const t of tasksSeed) {
    const assignedEmp = employeeUsers[t.assignedIndex];
    const createdByAdminId = isMongo ? adminUser._id : adminUser._id;

    if (isMongo) {
      const taskDoc = await TaskModel.create({
        taskIdentifier: t.taskIdentifier,
        title: t.title,
        description: t.description,
        assignedTo: assignedEmp._id,
        createdBy: createdByAdminId,
        priority: t.priority,
        status: t.status,
        dueDate: t.dueDate,
      });

      // Seed Activity
      await TaskActivityModel.create({
        task: taskDoc._id,
        actor: createdByAdminId,
        action: 'CREATED',
        previousStatus: null,
        newStatus: t.status,
        notes: 'Task created during initial project bootstrap.',
        timestamp: new Date(Date.now() - 3600000 * 24 * 3),
      });

      if (t.status === 'COMPLETED') {
        await TaskActivityModel.create({
          task: taskDoc._id,
          actor: assignedEmp._id,
          action: 'STATUS_UPDATED',
          previousStatus: 'IN_PROGRESS',
          newStatus: 'COMPLETED',
          notes: 'Completed task deliverables and verified testing criteria.',
          timestamp: new Date(Date.now() - 3600000 * 4),
        });
      }
    } else {
      const taskItem = {
        _id: inMemoryDB.generateId(),
        taskIdentifier: t.taskIdentifier,
        title: t.title,
        description: t.description,
        assignedTo: assignedEmp._id,
        createdBy: createdByAdminId,
        priority: t.priority,
        status: t.status,
        dueDate: t.dueDate,
        createdAt: new Date(Date.now() - 3600000 * 24 * 3),
        updatedAt: new Date(),
      };
      inMemoryDB.tasks.push(taskItem);

      inMemoryDB.activities.push({
        _id: inMemoryDB.generateId(),
        task: taskItem._id,
        actor: createdByAdminId,
        action: 'CREATED',
        previousStatus: null,
        newStatus: t.status,
        notes: 'Task created during initial project bootstrap.',
        timestamp: new Date(Date.now() - 3600000 * 24 * 3),
      });

      if (t.status === 'COMPLETED') {
        inMemoryDB.activities.push({
          _id: inMemoryDB.generateId(),
          task: taskItem._id,
          actor: assignedEmp._id,
          action: 'STATUS_UPDATED',
          previousStatus: 'IN_PROGRESS',
          newStatus: 'COMPLETED',
          notes: 'Completed task deliverables and verified testing criteria.',
          timestamp: new Date(Date.now() - 3600000 * 4),
        });
      }
    }
  }

  // Seed sample initial notification records
  console.log('Seeding sample notification audit logs...');
  const sampleNotifs = [
    {
      recipient: 'john.doe@xploreintellects.com',
      type: 'TASK_ASSIGNED' as const,
      subject: '[TaskFlow] New Task Assigned: Design Responsive Navigation Bar (TASK-101)',
      content: '<p>You have been assigned TASK-101.</p>',
      deliveryStatus: 'SENT' as const,
      attempts: 1,
      lastError: null,
    },
    {
      recipient: 'admin@xploreintellects.com',
      type: 'TASK_STATUS_UPDATED' as const,
      subject: '[Status Update] Task TASK-101 marked COMPLETED by John Doe',
      content: '<p>Status changed to COMPLETED.</p>',
      deliveryStatus: 'SENT' as const,
      attempts: 1,
      lastError: null,
    },
    {
      recipient: 'robert.chen@xploreintellects.com',
      type: 'TASK_ASSIGNED' as const,
      subject: '[TaskFlow] New Task Assigned: End-to-End API Integration Testing (TASK-104)',
      content: '<p>You have been assigned TASK-104.</p>',
      deliveryStatus: 'SENT' as const,
      attempts: 1,
      lastError: null,
    },
  ];

  for (const n of sampleNotifs) {
    if (isMongo) {
      await NotificationModel.create(n);
    } else {
      inMemoryDB.notifications.push({
        _id: inMemoryDB.generateId(),
        ...n,
        createdAt: new Date(Date.now() - 3600000 * 12),
        updatedAt: new Date(),
      });
    }
  }

  console.log('Seed completed successfully: 1 Admin, 3 Employees, 14 Tasks, Activities, and Notifications ready.');
};

// If run directly via node/tsx
if (import.meta.url.endsWith(process.argv[1] || '')) {
  (async () => {
    await connectDB();
    await seedDatabase(true);
    process.exit(0);
  })();
}
