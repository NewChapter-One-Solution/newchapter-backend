import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import passport from 'passport';
// import { IUser, UserModel } from '../models/user.model';
import prisma from '../models/prisma-client';
import { User } from '../../generated/prisma';
import { tokenInfo } from './secrets';
import { UserPayload } from '../types/jwtInterface';

const opts: StrategyOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: tokenInfo.accessTokenSecret as string
};

passport.use(new JwtStrategy(opts, async (jwt_payload: any, done: (error: any, user?: UserPayload | false | null) => void) => {
    try {
        const user: User | UserPayload | null = await prisma.user.findUnique({
            where: { id: jwt_payload.id },
            select: {
                id: true,
                email: true,
                role: true
            }
        });

        if (user) {
            return done(null, user);
        } else {
            return done(null, false);
        }
    } catch (error) {
        return done(error, false);
    }
}));
