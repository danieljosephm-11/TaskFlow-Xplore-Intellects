import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { DataService } from '../services/dataService.ts';
import { generateToken, AuthenticatedRequest } from '../middleware/auth.ts';

export class AuthController {
  /**
   * User Login (Admin or Employee)
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, requiredRole } = req.body;

      // Find user by email including the password hash
      const user = await DataService.findUserByEmail(email, true);

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
        return;
      }

      // Check account status
      if (!user.isActive) {
        res.status(403).json({
          success: false,
          message: 'Your account has been deactivated. Please contact your system administrator.',
        });
        return;
      }

      // If specific portal required (e.g. /login/admin vs /login/employee)
      if (requiredRole && user.role !== requiredRole) {
        res.status(403).json({
          success: false,
          message: `Access denied. This portal is strictly for ${requiredRole.toLowerCase()} accounts.`,
        });
        return;
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
        return;
      }

      // Generate JWT
      const token = generateToken({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      });

      // Set cookie (HTTP-only)
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      const { passwordHash: _, ...safeUser } = user;

      res.status(200).json({
        success: true,
        message: 'Authentication successful.',
        token,
        user: safeUser,
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'An unexpected error occurred during login. Please try again.',
      });
    }
  }

  /**
   * User Logout
   */
  static async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie('token', {
      httpOnly: true,
      sameSite: 'lax',
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  }

  /**
   * Get Current Authenticated User Profile
   */
  static async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
      }

      const user = await DataService.findUserById(req.user.id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Could not fetch user profile.',
      });
    }
  }
}
