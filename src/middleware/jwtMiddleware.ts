import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { UserPayload } from "../types/jwtInterface";

const jwtAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate(
    "jwt",
    { session: false },
    (err: any, user: UserPayload | false | null, info: any) => {
      if (err) {
        res
          .status(500)
          .json({ message: "Internal server error", error: err.message });
        return;
      }

      if (!user) {
        res.status(401).json({
          success: false,
          status: 401,
          message: "Unauthorized access",
          error: info?.message || "Invalid or missing token",
        });
        return;
      }

      req.user = user;
      next();
    }
  )(req, res, next);
};

// Middleware for optional authentication (doesn't fail if no token)
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next(); // No token provided, continue without user
    return;
  }

  jwtAuthMiddleware(req, res, next);
};

export default jwtAuthMiddleware;
