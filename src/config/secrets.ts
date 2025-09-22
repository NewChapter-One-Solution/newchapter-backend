import dotenv from "dotenv";

dotenv.config();

export const environment = process.env.NODE_ENV;

export const port = parseInt(process.env.PORT ?? "8001");
export const host = process.env.HOST || "localhost";

export const logDirectory = process.env.LOG_DIR;

export const db = {
  name: process.env.DB_NAME || "",
  host: process.env.DB_HOST || "",
  port: process.env.DB_PORT || "",
  user: process.env.DB_USER || "",
  password: process.env.DB_USER_PWD || "",
  minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE ?? "5"),
  maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE ?? "10"),
};
export const dbUrl = process.env.DATABASE_URL || "";

export const corsUrl = process.env.CORS_URL;

export const tokenInfo = {
  accessTokenSecret: process.env.JWT_ACCESS_TOKEN_SECRET ?? "",
  refreshTokenSecret: process.env.JWT_REFRESH_TOKEN_SECRET ?? "",
};

export const mailConfig = {
  host: process.env.MAIL_HOST ?? "",
  port: parseInt(process.env.MAIL_PORT ?? "587"),
  user: process.env.MAIL_USER ?? "",
  password: process.env.MAIL_PASSWORD ?? "",
  secure: process.env.MAIL_SECURE === "true",
};

export const cloudinary_config = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
};

export const stripeSecretKey = process.env.STRIPE_SECRET_KEY ?? "";
export const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY ?? "";
export const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
