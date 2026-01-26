import {
  Controller,
  Post,
  Delete,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { FileInterceptor } from '@nestjs/platform-express/multer';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const result = await this.uploadsService.uploadImage(file, {
      folder: folder ?? 'temp',
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    };
  }

  /* ---------------------------------------------------- */
  /* Delete image                                         */
  /* DELETE /uploads/image?publicId=xxx                   */
  /* ---------------------------------------------------- */
  @Delete('image')
  async deleteImage(@Query('publicId') publicId: string) {
    if (!publicId) {
      throw new BadRequestException('publicId is required');
    }

    await this.uploadsService.deleteImage(publicId);

    return { ok: true };
  }
}
