
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateImageInputSchema = z.string().describe('The prompt for image generation');
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.string().describe('The generated image as a data URI');
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImage(prompt: GenerateImageInput): Promise<GenerateImageOutput> {
    return generateImageFlow(prompt);
}

const generateImageFlow = ai.defineFlow(
    {
        name: 'generateImageFlow',
        inputSchema: GenerateImageInputSchema,
        outputSchema: GenerateImageOutputSchema,
    },
    async (prompt) => {
        // Changed model to gemini-pro-vision to avoid billing error with Imagen.
        // This is a workaround. For best results, enable billing and use 'googleai/imagen-4.0-fast-generate-001'.
        const { media } = await ai.generate({
            model: 'googleai/gemini-pro-vision',
            prompt: `generate a photorealistic, high quality food photography style image of: ${prompt}`,
        });
        
        if (!media.url) {
            throw new Error('Image generation failed.');
        }

        return media.url;
    }
);
