import { PassThrough } from 'stream';
import wav from 'wav';

export async function saveWaveFile(
   filename: string,
   pcmData: any,
   channels = 1,
   rate = 24000,
   sampleWidth = 2,
) {
   return new Promise((resolve, reject) => {
      const writer = new wav.FileWriter(filename, {
        channels,
        sampleRate: rate,
        bitDepth: sampleWidth * 8,
      });

      writer.on('finish', resolve);
      writer.on('error', reject);

      writer.write(pcmData);
      writer.end();
   });
}

export async function getWaveBuffer(
   pcmData: Buffer,
   channels = 1,
   rate = 24000,
   sampleWidth = 2,
): Promise<Buffer> {
   return new Promise((resolve, reject) => {
      const passThrough = new PassThrough();
      const chunks: Buffer[] = [];

      passThrough.on('data', (chunk) => chunks.push(chunk));
      passThrough.on('end', () => resolve(Buffer.concat(chunks)));
      passThrough.on('error', reject);

      const writer = new wav.Writer({
         channels,
         sampleRate: rate,
         bitDepth: sampleWidth * 8,
      });

      writer.on('error', reject);

      writer.pipe(passThrough);
      writer.write(pcmData);
      writer.end();
   });
}
