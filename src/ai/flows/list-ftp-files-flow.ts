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

const ListFtpFilesInputSchema = z.object({
  ftpConfig: FtpConfigSchema,
  path: z.string(),
});
export type ListFtpFilesInput = z.infer<typeof ListFtpFilesInputSchema>;

const FileInfoSchema = z.object({
    name: z.string(),
    type: z.number(), // 1 for file, 2 for directory
    size: z.number(),
    modifiedAt: z.string(),
});

const ListFtpFilesOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  files: z.array(FileInfoSchema).optional(),
});
export type ListFtpFilesOutput = z.infer<typeof ListFtpFilesOutputSchema>;


export async function listFtpFiles(input: ListFtpFilesInput): Promise<ListFtpFilesOutput> {
    return listFtpFilesFlow(input);
}

const listFtpFilesFlow = ai.defineFlow(
  {
    name: 'listFtpFilesFlow',
    inputSchema: ListFtpFilesInputSchema,
    outputSchema: ListFtpFilesOutputSchema,
  },
  async ({ ftpConfig, path }) => {
    const client = new ftp.Client();
    try {
        await client.access({
            host: ftpConfig.host,
            port: ftpConfig.port,
            user: ftpConfig.user,
            password: ftpConfig.password,
            secure: ftpConfig.secure,
        });

        const files = await client.list(path);
        
        return { 
            success: true, 
            message: 'Fichiers listés avec succès.',
            files: files.map(f => ({
                name: f.name,
                type: f.type,
                size: f.size,
                modifiedAt: f.modifiedAt?.toISOString() || new Date(0).toISOString(),
            })),
        };
    } catch (error: any) {
        console.error("FTP list error:", error);
        return { success: false, message: `Erreur FTP : ${error.message}` };
    } finally {
        if (!client.closed) {
            client.close();
        }
    }
  }
);
