
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as ftp from 'basic-ftp';
import { Writable } from 'stream';

const FtpConfigSchema = z.object({
  host: z.string(),
  port: z.number(),
  user: z.string(),
  password: z.string(),
  secure: z.union([z.boolean(), z.literal('implicit')]),
});

const DownloadFtpFileInputSchema = z.object({
  ftpConfig: FtpConfigSchema,
  filePath: z.string(),
});
export type DownloadFtpFileInput = z.infer<typeof DownloadFtpFileInputSchema>;

const DownloadFtpFileOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  content: z.string().optional(), // Base64 encoded file content
});
export type DownloadFtpFileOutput = z.infer<typeof DownloadFtpFileOutputSchema>;

export async function downloadFtpFile(input: DownloadFtpFileInput): Promise<DownloadFtpFileOutput> {
    return downloadFtpFileFlow(input);
}

class MemoryStream extends Writable {
    private chunks: Buffer[] = [];
    
    _write(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
        this.chunks.push(Buffer.from(chunk, encoding));
        callback();
    }

    getBuffer(): Buffer {
        return Buffer.concat(this.chunks);
    }
}


const downloadFtpFileFlow = ai.defineFlow(
  {
    name: 'downloadFtpFileFlow',
    inputSchema: DownloadFtpFileInputSchema,
    outputSchema: DownloadFtpFileOutputSchema,
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

        const memoryStream = new MemoryStream();
        await client.downloadTo(memoryStream, filePath);
        
        const fileContent = memoryStream.getBuffer().toString('base64');
        
        return { 
            success: true, 
            message: 'Fichier téléchargé avec succès.',
            content: fileContent,
        };
    } catch (error: any) {
        console.error("FTP download error:", error);
        return { success: false, message: `Erreur FTP : ${error.message}` };
    } finally {
        if (!client.closed) {
            client.close();
        }
    }
  }
);
