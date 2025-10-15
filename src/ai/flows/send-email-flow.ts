
'use server';
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as nodemailer from 'nodemailer';

const SendEmailInputSchema = z.object({
    smtpConfig: z.object({
        host: z.string(),
        port: z.number(),
        secure: z.boolean(),
        auth: z.object({
            user: z.string(),
            pass: z.string(),
        }),
        senderEmail: z.string().email(),
    }),
    to: z.string().email(),
    subject: z.string(),
    text: z.string(),
    html: z.string().optional(),
});
export type SendEmailInput = z.infer<typeof SendEmailInputSchema>;

export async function sendEmail(input: SendEmailInput): Promise<{ success: boolean; message: string }> {
    return sendEmailFlow(input);
}

const sendEmailFlow = ai.defineFlow(
  {
    name: 'sendEmailFlow',
    inputSchema: SendEmailInputSchema,
    outputSchema: z.object({ success: z.boolean(), message: z.string() }),
  },
  async (input) => {
    const transporter = nodemailer.createTransport({
        host: input.smtpConfig.host,
        port: input.smtpConfig.port,
        secure: input.smtpConfig.secure,
        auth: input.smtpConfig.auth,
    });

    try {
        await transporter.verify();
    } catch (error: any) {
        console.error("SMTP connection error:", error);
        return { success: false, message: `Erreur de connexion SMTP : ${error.message}` };
    }

    try {
        const info = await transporter.sendMail({
            from: `"${input.smtpConfig.senderEmail}" <${input.smtpConfig.senderEmail}>`,
            to: input.to,
            subject: input.subject,
            text: input.text,
            html: input.html,
        });
        console.log("Message sent: %s", info.messageId);
        return { success: true, message: `E-mail envoyé avec succès à ${input.to}` };
    } catch (error: any) {
        console.error("Error sending email:", error);
        return { success: false, message: `Échec de l'envoi de l'e-mail : ${error.message}` };
    }
  }
);
