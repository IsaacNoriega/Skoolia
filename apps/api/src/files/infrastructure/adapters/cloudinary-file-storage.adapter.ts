// infrastructure/cloudinary/cloudinary-file-storage.adapter.ts

import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

import type { FileStorage } from 'src/files/core/ports/file-storage.repository';
import type { UploadInput } from '../../core/entities/file.entitiy';

@Injectable()
export class CloudinaryFileStorageAdapter implements FileStorage {
  constructor() {
    const cloudinaryUrl = process.env.CLOUDINARY_URL;

    if (!cloudinaryUrl) {
      throw new Error('Missing CLOUDINARY_URL environment variable');
    }

    process.env.CLOUDINARY_URL = cloudinaryUrl;
    cloudinary.config(true);
  }

  async upload(input: UploadInput): Promise<{
    key: string;
    url: string;
    sizeBytes: number;
  }> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: input.folder ?? 'skoolia',
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            return reject(new Error(error.message));
          }

          if (!result) {
            return reject(new Error('Cloudinary upload failed'));
          }

          const typedResult = result;

          resolve({
            key: typedResult.public_id,
            url: typedResult.secure_url,
            sizeBytes: typedResult.bytes,
          });
        },
      );

      stream.end(input.buffer);
    });
  }

  async delete(key: string): Promise<void> {
    await cloudinary.uploader.destroy(key, {
      resource_type: 'image',
    });
  }
}
