
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as ftp from 'basic-ftp';

const UploadFileFtpInputSchema = z.object({
  ftpConfig: z.object({
    host: z.string(),
    port: z.number(),
    user: z.string(),
    password: z.string(),
    secure: z.union([z.boolean(), z.literal('implicit')]),
    path: z.string(),
  }),
  fileName: z.string(),
  fileContent: z.string(), // Base64 encoded string
});
export type UploadFileFtpInput = z.infer<typeof UploadFileFtpInputSchema>;

export async function uploadFileFtp(input: UploadFileFtpInput): Promise<{ success: boolean; message: string }> {
    return uploadFileFtpFlow(input);
}

const uploadFileFtpFlow = ai.defineFlow(
  {
    name: 'uploadFileFtpFlow',
    inputSchema: UploadFileFtpInputSchema,
    outputSchema: z.object({ success: z.boolean(), message: z.string() }),
  },
  async (input) => {
    const client = new ftp.Client();
    try {
        await client.access({
            host: input.ftpConfig.host,
            port: input.ftpConfig.port,
            user: input.ftpConfig.user,
            password: input.ftpConfig.password,
            secure: input.ftpConfig.secure,
        });

        const buffer = Buffer.from(input.fileContent, 'base64');
        const remotePath = `${input.ftpConfig.path.endsWith('/') ? input.ftpConfig.path : input.ftpConfig.path + '/'}${input.fileName}`;
        
        await client.uploadFrom(buffer, remotePath);
        
        return { success: true, message: 'Fichier envoyé avec succès sur le serveur FTP.' };
    } catch (error: any) {
        console.error("FTP error:", error);
        return { success: false, message: `Erreur FTP : ${error.message}` };
    } finally {
        if (!client.closed) {
            client.close();
        }
    }
  }
);
