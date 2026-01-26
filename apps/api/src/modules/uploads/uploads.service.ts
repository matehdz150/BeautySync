import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class UploadsService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  /* ---------------------------------------------------- */
  /* Upload image (memory → Cloudinary)                   */
  /* ---------------------------------------------------- */
  async uploadImage(
    file: Express.Multer.File,
    options?: {
      folder?: string;
      publicId?: string;
      tags?: string[];
    },
  ): Promise<UploadApiResponse> {
    if (!file) {
      throw new InternalServerErrorException('No file provided');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options?.folder ?? 'temp',
          public_id: options?.publicId,
          tags: options?.tags,
          resource_type: 'image',
        },
        (error, result) => {
          if (error || !result) {
            return reject(
              new InternalServerErrorException(
                error?.message || 'Cloudinary upload failed',
              ),
            );
          }

          resolve(result);
        },
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  /* ---------------------------------------------------- */
  /* Delete image                                         */
  /* ---------------------------------------------------- */
  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to delete image from Cloudinary',
      );
    }
  }

  /* ---------------------------------------------------- */
  /* Move image (temp → final folder)                     */
  /* ---------------------------------------------------- */
  async moveImage(
    publicId: string,
    newFolder: string,
  ): Promise<UploadApiResponse> {
    try {
      const filename = publicId.split('/').pop();

      const newPublicId = `${newFolder}/${filename}`;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return await cloudinary.uploader.rename(publicId, newPublicId, {
        overwrite: true,
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to move image in Cloudinary',
      );
    }
  }
}
