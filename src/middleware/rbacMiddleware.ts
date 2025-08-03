import { Request, Response, NextFunction } from "express";
import { Role } from "../../generated/prisma";
import { UserPayload } from "../types/jwtInterface";

// Define role hierarchy (higher number = more permissions)
const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.STAFF]: 1,
  [Role.MANAGER]: 2,
  [Role.ADMIN]: 3,
};

// Define permissions for different resources
export const PERMISSIONS = {
  // User management
  USER_CREATE: "user:create",
  USER_READ: "user:read",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",

  // Shop management
  SHOP_CREATE: "shop:create",
  SHOP_READ: "shop:read",
  SHOP_UPDATE: "shop:update",
  SHOP_DELETE: "shop:delete",

  // Product management
  PRODUCT_CREATE: "product:create",
  PRODUCT_READ: "product:read",
  PRODUCT_UPDATE: "product:update",
  PRODUCT_DELETE: "product:delete",

  // Inventory management
  INVENTORY_CREATE: "inventory:create",
  INVENTORY_READ: "inventory:read",
  INVENTORY_UPDATE: "inventory:update",
  INVENTORY_DELETE: "inventory:delete",

  // Purchase management
  PURCHASE_CREATE: "purchase:create",
  PURCHASE_READ: "purchase:read",
  PURCHASE_UPDATE: "purchase:update",
  PURCHASE_DELETE: "purchase:delete",

  // Sales management
  SALES_CREATE: "sales:create",
  SALES_READ: "sales:read",
  SALES_UPDATE: "sales:update",
  SALES_DELETE: "sales:delete",

  // Attendance management
  ATTENDANCE_CREATE: "attendance:create",
  ATTENDANCE_READ: "attendance:read",
  ATTENDANCE_UPDATE: "attendance:update",
  ATTENDANCE_DELETE: "attendance:delete",

  // Reports
  REPORTS_VIEW: "reports:view",
  REPORTS_EXPORT: "reports:export",
} as const;

// Define base permissions for each role
const STAFF_PERMISSIONS = [
  PERMISSIONS.PRODUCT_READ,
  PERMISSIONS.INVENTORY_READ,
  PERMISSIONS.SALES_CREATE,
  PERMISSIONS.SALES_READ,
  PERMISSIONS.ATTENDANCE_CREATE,
  PERMISSIONS.ATTENDANCE_READ,
];

const MANAGER_ADDITIONAL_PERMISSIONS = [
  PERMISSIONS.USER_READ,
  PERMISSIONS.SHOP_READ,
  PERMISSIONS.SHOP_UPDATE,
  PERMISSIONS.PRODUCT_CREATE,
  PERMISSIONS.PRODUCT_UPDATE,
  PERMISSIONS.INVENTORY_CREATE,
  PERMISSIONS.INVENTORY_UPDATE,
  PERMISSIONS.PURCHASE_CREATE,
  PERMISSIONS.PURCHASE_READ,
  PERMISSIONS.PURCHASE_UPDATE,
  PERMISSIONS.SALES_UPDATE,
  PERMISSIONS.ATTENDANCE_UPDATE,
  PERMISSIONS.REPORTS_VIEW,
];

// Role-based permissions mapping
const ROLE_PERMISSIONS: Record<Role, string[]> = {
  [Role.STAFF]: STAFF_PERMISSIONS,
  [Role.MANAGER]: [...STAFF_PERMISSIONS, ...MANAGER_ADDITIONAL_PERMISSIONS],
  [Role.ADMIN]: Object.values(PERMISSIONS),
};

export class RBACService {
  static hasPermission(userRole: Role, permission: string): boolean {
    const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
    return rolePermissions.includes(permission);
  }

  static hasMinimumRole(userRole: Role, minimumRole: Role): boolean {
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole];
  }

  static getUserPermissions(userRole: Role): string[] {
    return ROLE_PERMISSIONS[userRole] || [];
  }

  static canAccessResource(
    userRole: Role,
    requiredPermissions: string[]
  ): boolean {
    const userPermissions = this.getUserPermissions(userRole);
    return requiredPermissions.every((permission) =>
      userPermissions.includes(permission)
    );
  }
}

// Middleware to check if user has required permissions
export const requirePermissions = (permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user as UserPayload;

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const userRole = user.role as Role;
    const hasPermission = RBACService.canAccessResource(userRole, permissions);

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        message: "Insufficient permissions",
        required: permissions,
        userRole: userRole,
      });
      return;
    }

    next();
  };
};

// Middleware to check minimum role requirement
export const requireRole = (minimumRole: Role) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user as UserPayload;

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const userRole = user.role as Role;
    const hasMinimumRole = RBACService.hasMinimumRole(userRole, minimumRole);

    if (!hasMinimumRole) {
      res.status(403).json({
        success: false,
        message: `Access denied. Minimum role required: ${minimumRole}`,
        userRole: userRole,
        requiredRole: minimumRole,
      });
      return;
    }

    next();
  };
};

// Middleware for resource ownership check
export const requireOwnership = (
  getResourceOwnerId: (req: Request) => Promise<string>
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = req.user as UserPayload;

      if (!user) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      // Admins can access everything
      if (user.role === Role.ADMIN) {
        next();
        return;
      }

      const resourceOwnerId = await getResourceOwnerId(req);

      if (user.id !== resourceOwnerId) {
        res.status(403).json({
          success: false,
          message: "Access denied. You can only access your own resources.",
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error checking resource ownership",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
};
