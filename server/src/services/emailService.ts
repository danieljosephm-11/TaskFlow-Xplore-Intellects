import nodemailer from 'nodemailer';
import { DataService } from './dataService.ts';
import { ITask, IUser } from '../types/index.ts';

// Email transporter singleton
let transporter: any = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    try {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      });
      return transporter;
    } catch (e: any) {
      console.warn('Could not initialize SMTP transport:', e.message);
      return null;
    }
  }

  return null;
};

export class EmailService {
  /**
   * Send Task Assignment Email to Employee
   */
  static async sendTaskAssignmentEmail(params: {
    employee: IUser;
    task: ITask;
  }): Promise<{ success: boolean; notificationId: string; status: 'SENT' | 'FAILED' | 'PENDING'; message: string }> {
    const { employee, task } = params;
    const appUrl = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
    const loginLink = `${appUrl}/login/employee`;
    const fromAddress = process.env.EMAIL_FROM || 'noreply@taskflow.xploreintellects.com';

    const formattedDueDate = task.dueDate
      ? new Date(task.dueDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : 'Not Specified';

    const subject = `[TaskFlow] New Task Assigned: ${task.title} (${task.taskIdentifier})`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .header { border-bottom: 1px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 24px; }
    .brand { font-size: 18px; font-weight: 700; color: #1e1b4b; letter-spacing: -0.025em; }
    .brand-sub { font-size: 13px; color: #64748b; margin-top: 4px; }
    .title { font-size: 20px; font-weight: 600; color: #0f172a; margin-top: 0; }
    .meta-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .meta-table td { padding: 8px 0; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
    .meta-label { color: #64748b; font-weight: 500; width: 130px; }
    .meta-value { color: #0f172a; font-weight: 600; }
    .priority-high { color: #dc2626; }
    .priority-med { color: #d97706; }
    .priority-low { color: #16a34a; }
    .desc-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; font-size: 14px; line-height: 1.6; color: #334155; margin: 16px 0; }
    .btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 6px; margin-top: 20px; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="brand">TaskFlow — Xplore Intellects</div>
      <div class="brand-sub">Enterprise Task Management Notification</div>
    </div>
    <h2 class="title">New Task Assigned to You</h2>
    <p style="font-size: 14px; color: #475569;">Hello <strong>${employee.name}</strong>,</p>
    <p style="font-size: 14px; color: #475569;">You have been assigned a new task by the administration team.</p>

    <table class="meta-table">
      <tr>
        <td class="meta-label">Task Identifier:</td>
        <td class="meta-value">${task.taskIdentifier}</td>
      </tr>
      <tr>
        <td class="meta-label">Title:</td>
        <td class="meta-value">${task.title}</td>
      </tr>
      <tr>
        <td class="meta-label">Priority:</td>
        <td class="meta-value priority-${task.priority.toLowerCase().slice(0, 4)}">${task.priority}</td>
      </tr>
      <tr>
        <td class="meta-label">Due Date:</td>
        <td class="meta-value">${formattedDueDate}</td>
      </tr>
    </table>

    <div style="font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 6px;">Description:</div>
    <div class="desc-box">
      ${task.description.replace(/\n/g, '<br>')}
    </div>

    <div>
      <a href="${loginLink}" class="btn">View Task on Portal</a>
    </div>

    <div class="footer">
      Xplore Intellects Internal Platform &bull; Automated System Dispatch
    </div>
  </div>
</body>
</html>
    `;

    // 1. First record notification in DB as PENDING
    const notif = await DataService.createNotification({
      recipient: employee.email,
      recipientUser: employee._id,
      task: task._id,
      type: 'TASK_ASSIGNED',
      subject,
      content: htmlContent,
      deliveryStatus: 'PENDING',
      attempts: 1,
    });

    const mailer = getTransporter();

    if (!mailer) {
      // In sandbox/development without live SMTP, we mark as SENT (simulated test mode)
      // or if SMTP was partially configured, record gracefully.
      const simulatedMsg = 'SMTP not configured in environment. Notification logged and recorded successfully in database.';
      console.log(`[Email Dispatch - Sim Mode] To: ${employee.email} | Subject: ${subject}`);
      await DataService.updateNotification(notif._id, {
        deliveryStatus: 'SENT',
        lastError: null,
      });
      return {
        success: true,
        notificationId: notif._id,
        status: 'SENT',
        message: simulatedMsg,
      };
    }

    try {
      await mailer.sendMail({
        from: `"${process.env.EMAIL_SENDER_NAME || 'TaskFlow Support'}" <${fromAddress}>`,
        to: employee.email,
        subject,
        html: htmlContent,
      });

      await DataService.updateNotification(notif._id, {
        deliveryStatus: 'SENT',
        lastError: null,
      });

      return {
        success: true,
        notificationId: notif._id,
        status: 'SENT',
        message: `Email dispatched successfully to ${employee.email}.`,
      };
    } catch (err: any) {
      const sanitizedError = err.message || 'SMTP Connection Error';
      console.warn(`[Email Delivery Failure] To: ${employee.email}:`, sanitizedError);
      await DataService.updateNotification(notif._id, {
        deliveryStatus: 'FAILED',
        lastError: sanitizedError,
      });

      return {
        success: false,
        notificationId: notif._id,
        status: 'FAILED',
        message: `Email delivery to ${employee.email} failed: ${sanitizedError}. Retries available in Notification Center.`,
      };
    }
  }

  /**
   * Send Task Status Update Email to Admin
   */
  static async sendStatusUpdateEmail(params: {
    employee: IUser;
    task: ITask;
    previousStatus: string;
    newStatus: string;
    notes?: string;
  }): Promise<{ success: boolean; notificationId: string; status: 'SENT' | 'FAILED' | 'PENDING'; message: string }> {
    const { employee, task, previousStatus, newStatus, notes } = params;
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@xploreintellects.com';
    const fromAddress = process.env.EMAIL_FROM || 'noreply@taskflow.xploreintellects.com';
    const timestampStr = new Date().toLocaleString('en-US', {
      timeZone: 'UTC',
      dateStyle: 'medium',
      timeStyle: 'short',
    }) + ' UTC';

    const subject = `[Status Update] Task ${task.taskIdentifier}: ${task.title} changed to ${newStatus}`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .header { border-bottom: 1px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 24px; }
    .brand { font-size: 18px; font-weight: 700; color: #1e1b4b; }
    .title { font-size: 20px; font-weight: 600; color: #0f172a; margin-top: 0; }
    .meta-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .meta-table td { padding: 8px 0; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
    .meta-label { color: #64748b; font-weight: 500; width: 140px; }
    .meta-value { color: #0f172a; font-weight: 600; }
    .status-change { display: inline-flex; align-items: center; gap: 8px; font-weight: 600; font-size: 14px; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="brand">TaskFlow — Xplore Intellects</div>
      <div style="font-size: 13px; color: #64748b; margin-top: 4px;">Task Status Modification Notice</div>
    </div>
    <h2 class="title">Task Status Updated</h2>
    <p style="font-size: 14px; color: #475569;">
      Employee <strong>${employee.name}</strong> (${employee.email}) has updated the progress status on a task.
    </p>

    <table class="meta-table">
      <tr>
        <td class="meta-label">Task Identifier:</td>
        <td class="meta-value">${task.taskIdentifier}</td>
      </tr>
      <tr>
        <td class="meta-label">Task Title:</td>
        <td class="meta-value">${task.title}</td>
      </tr>
      <tr>
        <td class="meta-label">Status Change:</td>
        <td class="meta-value status-change">
          <span style="color: #64748b;">${previousStatus}</span>
          &rarr;
          <span style="color: #4f46e5;">${newStatus}</span>
        </td>
      </tr>
      <tr>
        <td class="meta-label">Timestamp:</td>
        <td class="meta-value">${timestampStr}</td>
      </tr>
      ${notes ? `<tr><td class="meta-label">Update Notes:</td><td class="meta-value">${notes}</td></tr>` : ''}
    </table>

    <div class="footer">
      Xplore Intellects Admin Alert System &bull; Internal Transmission
    </div>
  </div>
</body>
</html>
    `;

    const notif = await DataService.createNotification({
      recipient: adminEmail,
      recipientUser: undefined,
      task: task._id,
      type: 'TASK_STATUS_UPDATED',
      subject,
      content: htmlContent,
      deliveryStatus: 'PENDING',
      attempts: 1,
    });

    const mailer = getTransporter();

    if (!mailer) {
      console.log(`[Email Dispatch - Sim Mode] To: ${adminEmail} | Subject: ${subject}`);
      await DataService.updateNotification(notif._id, {
        deliveryStatus: 'SENT',
        lastError: null,
      });
      return {
        success: true,
        notificationId: notif._id,
        status: 'SENT',
        message: 'Notification logged and stored successfully (SMTP simulated).',
      };
    }

    try {
      await mailer.sendMail({
        from: `"${process.env.EMAIL_SENDER_NAME || 'TaskFlow Support'}" <${fromAddress}>`,
        to: adminEmail,
        subject,
        html: htmlContent,
      });

      await DataService.updateNotification(notif._id, {
        deliveryStatus: 'SENT',
        lastError: null,
      });

      return {
        success: true,
        notificationId: notif._id,
        status: 'SENT',
        message: `Admin notification dispatched to ${adminEmail}.`,
      };
    } catch (err: any) {
      const sanitized = err.message || 'SMTP Connection Error';
      console.warn(`[Admin Email Delivery Failure] To: ${adminEmail}:`, sanitized);
      await DataService.updateNotification(notif._id, {
        deliveryStatus: 'FAILED',
        lastError: sanitized,
      });

      return {
        success: false,
        notificationId: notif._id,
        status: 'FAILED',
        message: `Notification failure: ${sanitized}`,
      };
    }
  }

  /**
   * Retry sending a failed notification
   */
  static async retryNotification(notificationId: string): Promise<{ success: boolean; message: string }> {
    const list = await DataService.getNotifications({ limit: 100 });
    const target = list.data.find((n) => n._id.toString() === notificationId.toString());

    if (!target) {
      return { success: false, message: 'Notification record not found' };
    }

    const mailer = getTransporter();
    const newAttempts = (target.attempts || 0) + 1;

    if (!mailer) {
      // Re-mark as simulated sent
      await DataService.updateNotification(notificationId, {
        deliveryStatus: 'SENT',
        attempts: newAttempts,
        lastError: null,
      });
      return { success: true, message: 'Notification resend succeeded in development mode.' };
    }

    try {
      const fromAddress = process.env.EMAIL_FROM || 'noreply@taskflow.xploreintellects.com';
      await mailer.sendMail({
        from: `"${process.env.EMAIL_SENDER_NAME || 'TaskFlow Support'}" <${fromAddress}>`,
        to: target.recipient,
        subject: target.subject,
        html: target.content,
      });

      await DataService.updateNotification(notificationId, {
        deliveryStatus: 'SENT',
        attempts: newAttempts,
        lastError: null,
      });

      return { success: true, message: `Notification successfully redelivered to ${target.recipient}.` };
    } catch (err: any) {
      const sanitized = err.message || 'SMTP Delivery Failure';
      await DataService.updateNotification(notificationId, {
        deliveryStatus: 'FAILED',
        attempts: newAttempts,
        lastError: sanitized,
      });
      return { success: false, message: `Retry failed: ${sanitized}` };
    }
  }
}
