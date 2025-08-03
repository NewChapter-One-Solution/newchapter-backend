import nodemailer, { Transporter } from 'nodemailer';
import { mailConfig } from './secrets';


export let transporter: Transporter = nodemailer.createTransport({
    host: mailConfig.host as string,
    port: mailConfig.port,
    secure: mailConfig.secure,
    auth: {
        user: mailConfig.user as string,
        pass: mailConfig.password as string
    },
});

export const sendEmail = async (email: string, subject: string, text?: string, html?: string) => {
    try {
        await transporter.sendMail({
            from: mailConfig.user as string,
            to: email,
            subject,
            text,
            html
        });
    } catch (error) {
        console.log(error);
    }
};