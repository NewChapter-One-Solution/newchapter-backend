import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { UserPayload } from '../interfaces/jwtInterface';

const jwtAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('jwt', { session: false }, (err: any, user: UserPayload | false | null, info: any) => {
        if (err) {
            return res.status(500).json({ message: 'Internal server error', error: err.message });
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                status: 401,
                message: 'Unauthorized access',
                error: info?.message || 'Invalid or missing token',
            });
        }

        req.user = user;
        next();
    })(req, res, next);
};

export default jwtAuthMiddleware;
