import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
// import QRCode from 'qrcode';

import { IPayload, IToken } from "../interfaces/authInterface";
import { tokenInfo } from "../config/secrets";
import prisma from "../models/prisma-client";
import CustomError from "./CustomError";
import { Response } from "express";

/*  Password Utilities */
export const hashPassword = (password: string): string => {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
};

export const comparePassword = (password: string, hashPassword: string): boolean => {
    return bcrypt.compareSync(password, hashPassword);
};

/*  OTP / Random Number Generators */
export const generateOtp = (): string => {
    return crypto.randomInt(100000, 999999).toString();
};

export const generateRandomNumbers = (min: number, max: number): number => {
    return crypto.randomInt(min, max);
};

/*  Token Hashing */
export const hashToken = (token: string): string => {
    return crypto.createHash("sha256").update(token).digest("hex");
};

/*  JWT Token Generator & DB Storer */
export const generateTokensAndStoreHashedRefreshToken = async (payload: IPayload): Promise<IToken> => {
    // Validate that userId  and email are provided
    if (!payload.id || !payload.email) throw new Error("valid info is required to generate tokens");

    const accessTokenExp = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour
    const refreshTokenExp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 5; // 5 days

    const accessToken = jwt.sign({ ...payload, exp: accessTokenExp }, tokenInfo.accessTokenSecret);
    const refreshToken = jwt.sign({ ...payload, exp: refreshTokenExp }, tokenInfo.refreshTokenSecret);

    const hashedRefreshToken = hashToken(refreshToken);
    const expiresAt = new Date(refreshTokenExp * 1000);

    // Delete existing refresh tokens for this user
    await prisma.refreshToken.deleteMany({ where: { userId: payload.id } });

    // Create new refresh token
    await prisma.refreshToken.create({
        data: {
            userId: payload.id,
            token: hashedRefreshToken,
            expiresAt,
        },
    });

    return { accessToken, refreshToken, accessTokenExp, refreshTokenExp };
};

export const verifyRefreshToken = async (token: string) => {
    const decoded = jwt.verify(token, tokenInfo.refreshTokenSecret) as { id: string, email: string; };
    if (!decoded) throw new CustomError("Invalid refresh token", 401);

    const hashed = hashToken(token);

    const storedToken = await prisma.refreshToken.findFirst({
        where: {
            userId: decoded.id,
            token: hashed,
            expiresAt: { gt: new Date() },
        },
    });

    if (!storedToken) throw new CustomError("Invalid refresh token", 401);

    return decoded;
};

export const revokeRefreshToken = async (token: string) => {
    const hashed = hashToken(token);
    await prisma.refreshToken.deleteMany({ where: { token: hashed } });
};

/*  Token Verifier */
export const verifyToken = (token: string, secretKey: string): any => {
    return jwt.verify(token, secretKey);
};

export const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "strict" as const,
    path: "/",
};

/*  Set Cookies */
export const setCookie = (res: any, tokensObj: IToken): void => {
    const now = Math.floor(Date.now() / 1000);
    const accessTokenMaxAge = (tokensObj.accessTokenExp - now) * 1000;
    const refreshTokenMaxAge = (tokensObj.refreshTokenExp - now) * 1000;

    res.cookie("accessToken", tokensObj.accessToken, {
        ...cookieOptions,
        maxAge: accessTokenMaxAge,
    });

    res.cookie("refreshToken", tokensObj.refreshToken, {
        ...cookieOptions,
        maxAge: refreshTokenMaxAge,
    });
};


/*  CLEAR Cookies */
export const clearAuthCookies = (res: Response): void => {
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);
};


/*  Check Token Expiry (soft check without verifying) */
export const isTokenExpired = (token: string): boolean => {
    if (!token) return true;
    const decodedToken: any = jwt.decode(token);
    const currentTime = Date.now() / 1000;
    return !decodedToken || decodedToken.exp < currentTime;
};

/*  Password Generator */
export const createPassword = (name: string): string => {
    const sixDigit = generateRandomNumbers(100000, 999999);
    return name.substring(0, 3) + sixDigit + sixDigit;
};

// export const generateQRCodeFromObject = async (data: Record<string, any>): Promise<string> => {
//   const jsonString = JSON.stringify(data);
//   return await QRCode.toDataURL(jsonString);
// };
