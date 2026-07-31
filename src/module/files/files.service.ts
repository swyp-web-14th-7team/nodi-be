import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { S3Service } from '@/lib/s3/s3.service';
import { UploadImageResponse } from '@/module/files/type/upload-image-response.type';

/** 파생 이미지 크기(px). 정사각은 `{size}.webp`, 그 외는 `{width}x{height}.webp` 로 저장된다 */
type ImageSize = { width: number; height: number };

const square = (size: number): ImageSize => ({ width: size, height: size });

@Injectable()
export class FilesService {
  private static readonly PROFILE_IMAGE_SIZES = [72, 56, 48].map(square);

  private static readonly PERSONALITY_IMAGE_SIZES = [square(36)];

  private static readonly JOB_TYPE_IMAGE_SIZES = [square(36)];

  private static readonly CARD_BACKGROUND_SIZES = [{ width: 282, height: 400 }];

  constructor(private readonly s3Service: S3Service) {}

  async uploadProfileImage(
    file: Express.Multer.File,
  ): Promise<UploadImageResponse> {
    return this.uploadImage(file, 'profile', FilesService.PROFILE_IMAGE_SIZES);
  }

  async uploadPersonalityImage(
    file: Express.Multer.File,
  ): Promise<UploadImageResponse> {
    return this.uploadImage(
      file,
      'personality',
      FilesService.PERSONALITY_IMAGE_SIZES,
    );
  }

  async uploadJobTypeImage(
    file: Express.Multer.File,
  ): Promise<UploadImageResponse> {
    return this.uploadImage(
      file,
      'job-type',
      FilesService.JOB_TYPE_IMAGE_SIZES,
    );
  }

  async uploadCardBackgroundImage(
    file: Express.Multer.File,
  ): Promise<UploadImageResponse> {
    return this.uploadImage(
      file,
      'card-background',
      FilesService.CARD_BACKGROUND_SIZES,
    );
  }

  /**
   * `{category}/{YYYY}/{mm}/{uuid}/` 하위에 원본(`origin.webp`)과 파생본을 저장하고,
   * uuid 까지의 base URL 을 반환한다. 소비 시 `${url}/36.webp` 처럼 파일명을 붙여 접근한다.
   */
  private async uploadImage(
    file: Express.Multer.File,
    category: string,
    sizes: ImageSize[],
  ): Promise<UploadImageResponse> {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const basePrefix = `${category}/${yyyy}/${mm}/${randomUUID()}`;

    // 원본은 리사이즈 없이 webp 로 변환해 origin.webp 로 저장
    const origin = await sharp(file.buffer).webp().toBuffer();
    const uploads: Promise<string>[] = [
      this.s3Service.uploadFile(
        origin,
        `${basePrefix}/origin.webp`,
        'image/webp',
      ),
    ];

    for (const { width, height } of sizes) {
      const resized = await this.resizeImage(file.buffer, width, height);
      const fileName =
        width === height ? `${width}.webp` : `${width}x${height}.webp`;
      uploads.push(
        this.s3Service.uploadFile(
          resized,
          `${basePrefix}/${fileName}`,
          'image/webp',
        ),
      );
    }
    await Promise.all(uploads);

    return { url: this.s3Service.getPublicUrl(basePrefix) };
  }

  /**
   * 지정한 width×height 로 리사이즈 + 크롭 후 webp 로 변환한다.
   * fit: 'cover' → 비율 유지하며 영역을 채우고, 넘치는 부분은 가운데 기준으로 잘라냄
   */
  private async resizeImage(
    buffer: Buffer,
    width: number,
    height: number,
  ): Promise<Buffer> {
    return sharp(buffer)
      .resize(width, height, { fit: 'cover', position: 'centre' })
      .webp()
      .toBuffer();
  }
}
