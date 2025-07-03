export interface IPayload {
    id: string | undefined;
    email: string | undefined;
}

export interface IToken {
    accessToken: string;
    refreshToken: string;
    accessTokenExp: number;
    refreshTokenExp: number;
}


export interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string | null;
    hashedPassword?: string;
    role?: string; // Replace with actual enum values if different
    isActive?: boolean | null;
    department?: string; // Replace with actual enum values if different
    createdAt?: Date;
    updatedAt?: Date;
}
