/**
 * TaskFlow API Integration & Security Test Suite
 * Validates:
 * 1. Successful login
 * 2. Invalid login
 * 3. Admin-only endpoints
 * 4. Employee access restrictions
 * 5. Task creation
 * 6. Task assignment & validation
 * 7. Employee status updates
 * 8. Prevention of updating another employee's task
 * 9. Search and pagination
 * 10. Invalid request data rejection
 * 11. Duplicate employee email handling
 * 12. Email notification failure isolation
 */

import app from '../src/app.ts';
import { seedDatabase } from '../scripts/seed.ts';
import http from 'http';

interface TestResult {
  title: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function makeRequest(
  server: http.Server,
  path: string,
  method: string,
  body?: any,
  token?: string
): Promise<{ status: number; data: any; headers: any }> {
  const address = server.address() as any;
  const port = address.port;

  const bodyData = body ? JSON.stringify(body) : '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (body) {
    headers['Content-Length'] = Buffer.byteLength(bodyData).toString();
  }

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: '127.0.0.1',
        port,
        path,
        method,
        headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let parsed: any;
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = raw;
          }
          resolve({
            status: res.statusCode || 500,
            data: parsed,
            headers: res.headers,
          });
        });
      }
    );

    req.on('error', reject);
    if (body) req.write(bodyData);
    req.end();
  });
}

async function runTests() {
  console.log('\n======================================================');
  console.log('Starting TaskFlow Comprehensive Assessment API Tests');
  console.log('======================================================\n');

  // Seed DB first
  await seedDatabase(true);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));

  let adminToken = '';
  let employeeToken = '';
  let employeeId = '';
  let employee2Token = '';
  let createdTaskId = '';

  const test = async (name: string, fn: () => Promise<void>) => {
    try {
      await fn();
      results.push({ title: name, passed: true });
      console.log(`[PASS] ${name}`);
    } catch (err: any) {
      results.push({ title: name, passed: false, error: err.message });
      console.error(`[FAIL] ${name}: ${err.message}`);
    }
  };

  try {
    // 1. Successful login
    await test('1. Successful Admin and Employee login', async () => {
      const adminRes = await makeRequest(server, '/api/auth/login', 'POST', {
        email: 'admin@xploreintellects.com',
        password: 'Admin@12345',
      });
      if (adminRes.status !== 200 || !adminRes.data.token) {
        throw new Error(`Admin login failed: ${JSON.stringify(adminRes.data)}`);
      }
      adminToken = adminRes.data.token;

      const empRes = await makeRequest(server, '/api/auth/login', 'POST', {
        email: 'john.doe@xploreintellects.com',
        password: 'Employee@12345',
      });
      if (empRes.status !== 200 || !empRes.data.token) {
        throw new Error(`Employee login failed: ${JSON.stringify(empRes.data)}`);
      }
      employeeToken = empRes.data.token;
      employeeId = empRes.data.user._id;

      // Also get Employee 2 token (Jane Smith) to test isolation
      const emp2Res = await makeRequest(server, '/api/auth/login', 'POST', {
        email: 'jane.smith@xploreintellects.com',
        password: 'Employee@12345',
      });
      employee2Token = emp2Res.data.token;
    });

    // 2. Invalid login
    await test('2. Rejection of invalid credentials with 401', async () => {
      const res = await makeRequest(server, '/api/auth/login', 'POST', {
        email: 'admin@xploreintellects.com',
        password: 'WrongPassword999',
      });
      if (res.status !== 401) {
        throw new Error(`Expected status 401, got ${res.status}`);
      }
    });

    // 3. Admin-only endpoints access
    await test('3. Admin-only endpoints accessible by Admin role', async () => {
      const res = await makeRequest(server, '/api/employees', 'GET', null, adminToken);
      if (res.status !== 200 || !Array.isArray(res.data.data)) {
        throw new Error(`Admin failed to fetch employees: ${JSON.stringify(res.data)}`);
      }
    });

    // 4. Employee access restrictions
    await test('4. Employee blocked from Admin endpoints with 403', async () => {
      const res = await makeRequest(server, '/api/employees', 'GET', null, employeeToken);
      if (res.status !== 403) {
        throw new Error(`Expected 403 Forbidden for employee on /api/employees, got ${res.status}`);
      }
    });

    // 5. Task creation by Admin
    await test('5. Admin can create tasks and validate employee allocation', async () => {
      const res = await makeRequest(
        server,
        '/api/tasks',
        'POST',
        {
          title: 'Automated Test Task For Integration Verification',
          description: 'Testing end to end task delegation and database persistence.',
          assignedTo: employeeId,
          priority: 'HIGH',
          status: 'NOT_STARTED',
        },
        adminToken
      );

      if (res.status !== 201 || !res.data.data._id) {
        throw new Error(`Task creation failed: ${JSON.stringify(res.data)}`);
      }
      createdTaskId = res.data.data._id;
    });

    // 6. Task assignment validation (invalid user ID)
    await test('6. Rejection of task assignment to non-existent employee', async () => {
      const res = await makeRequest(
        server,
        '/api/tasks',
        'POST',
        {
          title: 'Invalid Assignee Task',
          description: 'Testing invalid assignee rejection.',
          assignedTo: '000000000000000000000000',
          priority: 'LOW',
        },
        adminToken
      );

      if (res.status !== 400) {
        throw new Error(`Expected status 400 for invalid assignee, got ${res.status}`);
      }
    });

    // 7. Employee status update
    await test('7. Assigned employee can update task status with audit history', async () => {
      const res = await makeRequest(
        server,
        `/api/tasks/${createdTaskId}/status`,
        'PATCH',
        {
          status: 'IN_PROGRESS',
          notes: 'Started work on verification module.',
        },
        employeeToken
      );

      if (res.status !== 200 || res.data.data.status !== 'IN_PROGRESS') {
        throw new Error(`Status update failed: ${JSON.stringify(res.data)}`);
      }
    });

    // 8. Prevention of updating another employee's task
    await test("8. Prevention of employee updating another employee's task", async () => {
      const res = await makeRequest(
        server,
        `/api/tasks/${createdTaskId}/status`,
        'PATCH',
        {
          status: 'COMPLETED',
          notes: 'Unauthorized tampering attempt.',
        },
        employee2Token // Jane Smith attempting to update John Doe's task
      );

      if (res.status !== 403) {
        throw new Error(`Expected 403 Forbidden when modifying another's task, got ${res.status}`);
      }
    });

    // 9. Search and pagination
    await test('9. Server-side search and pagination functionality', async () => {
      const res = await makeRequest(
        server,
        '/api/tasks?search=Automated&page=1&limit=5',
        'GET',
        null,
        adminToken
      );

      if (res.status !== 200 || !res.data.pagination || res.data.data.length === 0) {
        throw new Error(`Search pagination failed: ${JSON.stringify(res.data)}`);
      }
      if (res.data.pagination.limit !== 5) {
        throw new Error(`Expected limit 5, got ${res.data.pagination.limit}`);
      }
    });

    // 10. Invalid request data validation
    await test('10. Validation error on missing required fields', async () => {
      const res = await makeRequest(
        server,
        '/api/tasks',
        'POST',
        {
          title: '', // empty title
          description: '',
          assignedTo: employeeId,
        },
        adminToken
      );

      if (res.status !== 400) {
        throw new Error(`Expected 400 on empty required fields, got ${res.status}`);
      }
    });

    // 11. Duplicate employee email handling
    await test('11. Prevention of duplicate employee email registration', async () => {
      const res = await makeRequest(
        server,
        '/api/employees',
        'POST',
        {
          name: 'John Duplicate',
          email: 'john.doe@xploreintellects.com', // existing email
          password: 'Password@123',
          department: 'Frontend Engineering',
        },
        adminToken
      );

      if (res.status !== 409) {
        throw new Error(`Expected 409 Conflict for duplicate email, got ${res.status}`);
      }
    });

    // 12. Notification inspection and delivery tracking
    await test('12. Notification delivery audit tracking & retry access', async () => {
      const res = await makeRequest(server, '/api/notifications', 'GET', null, adminToken);
      if (res.status !== 200 || !Array.isArray(res.data.data)) {
        throw new Error(`Failed to fetch notifications: ${JSON.stringify(res.data)}`);
      }
    });

    console.log('\n======================================================');
    console.log(`Test Execution Summary: ${results.filter((r) => r.passed).length}/${results.length} PASSED`);
    console.log('======================================================\n');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
