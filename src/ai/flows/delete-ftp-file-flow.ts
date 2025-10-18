'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as ftp from 'basic-ftp';

const FtpConfigSchema = z.object({
  host: z.string(),
  port: z.number(),
  user: z.string(),
  password: z.string(),
  secure: z.union([z.boolean(), z.literal('implicit')]),
});

const DeleteFtpFileInputSchema = z.object({
  ftpConfig: FtpConfigSchema,
  filePath: z.string(),
});
export type DeleteFtpFileInput = z.infer<typeof DeleteFtpFileInputSchema>;

const DeleteFtpFileOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type DeleteFtpFileOutput = z.infer<typeof DeleteFtpFileOutputSchema>;

export async function deleteFtpFile(input: DeleteFtpFileInput): Promise<DeleteFtpFileOutput> {
    return deleteFtpFileFlow(input);
}

const deleteFtpFileFlow = ai.defineFlow(
  {
    name: 'deleteFtpFileFlow',
    inputSchema: DeleteFtpFileInputSchema,
    outputSchema: DeleteFtpFileOutputSchema,
  },
  async ({ ftpConfig, filePath }) => {
    const client = new ftp.Client();
    try {
        await client.access({
            host: ftpConfig.host,
            port: ftpConfig.port,
            user: ftpConfig.user,
            password: ftpConfig.password,
            secure: ftpConfig.secure,
        });

        await client.remove(filePath);
        
        return { 
            success: true, 
            message: 'Fichier supprimé avec succès.',
        };
    } catch (error: any) {
        console.error("FTP delete error:", error);
        return { success: false, message: `Erreur FTP : ${error.message}` };
    } finally {
        if (!client.closed) {
            client.close();
        }
    }
  }
);
