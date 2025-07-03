import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import passport from "passport";
import { corsUrl } from "./secrets";
import errorMiddleware from "./core/errorMiddleware";
import "./config/passport-Jwt-Statergy"; // Initialize passport JWT strategy


const app: Application = express();

app.use(cors({ origin: corsUrl, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

//test route
app.get('/', (_req: Request, res: Response) => {
    res.json({ message: 'Inventory Management API' });
});

// Import routes
import router from "./routes";


// Use routes
app.use("/api/v1/", router);


// Error handling middleware
app.use(errorMiddleware);


export default app;
