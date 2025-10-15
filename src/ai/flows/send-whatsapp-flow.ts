
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import twilio from 'twilio';

const SendWhatsAppInputSchema = z.object({
    twilioConfig: z.object({
        accountSid: z.string(),
        authToken: z.string(),
        from: z.string(),
    }),
    to: z.string(),
    body: z.string(),
});
export type SendWhatsAppInput = z.infer<typeof SendWhatsAppInputSchema>;

export async function sendWhatsApp(input: SendWhatsAppInput): Promise<{ success: boolean; message: string }> {
    return sendWhatsAppFlow(input);
}

const sendWhatsAppFlow = ai.defineFlow(
    {
        name: 'sendWhatsAppFlow',
        inputSchema: SendWhatsAppInputSchema,
        outputSchema: z.object({ success: z.boolean(), message: z.string() }),
    },
    async (input) => {
        const { accountSid, authToken, from } = input.twilioConfig;
        
        if (!accountSid || !authToken) {
            const errorMessage = 'Les identifiants Twilio (Account SID et Auth Token) sont requis.';
            console.error(errorMessage);
            return { success: false, message: errorMessage };
        }

        const client = twilio(accountSid, authToken);

        try {
            const message = await client.messages.create({
                from: from,
                to: input.to,
                body: input.body,
            });
            console.log('WhatsApp message sent:', message.sid);
            return { success: true, message: `Message envoyé avec succès à ${input.to}` };
        } catch (error: any) {
            console.error('Error sending WhatsApp message:', error);
            return { success: false, message: `Échec de l'envoi du message : ${error.message}` };
        }
    }
);
