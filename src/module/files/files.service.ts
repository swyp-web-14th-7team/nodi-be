import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { S3Service } from '@/lib/s3/s3.service';
import { UploadImageResponse } from '@/module/files/type/upload-image-response.type';

@Injectable()
export class FilesService {
  // 프로필 이미지 파생 사이즈(정사각, px). 원본은 {uuid} 로 별도 저장
  private static readonly PROFILE_IMAGE_SIZES = [72, 60, 48];

  // 개성 이미지 파생 사이즈(정사각, px)
  private static readonly PERSONALITY_IMAGE_SIZES = [36];

  constructor(private readonly s3Service: S3Service) {}

  async uploadProfileImage(
    file: Express.Multer.File,
  ): Promise<UploadImageResponse> {
    // profile/{YYYY}/{mm}/{uuid} 를 base prefix 로 사용
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const basePrefix = `profile/${yyyy}/${mm}/${randomUUID()}`;

    // 원본은 리사이즈 없이 webp 로 변환해 origin.webp 로 저장
    const origin = await sharp(file.buffer).webp().toBuffer();
    const uploads: Promise<string>[] = [
      this.s3Service.uploadFile(
        origin,
        `${basePrefix}/origin.webp`,
        'image/webp',
      ),
    ];

    // 파생 사이즈: {size}.webp 로 리사이즈+크롭 후 업로드
    for (const size of FilesService.PROFILE_IMAGE_SIZES) {
      const resized = await this.resizeImage(file.buffer, size, size);
      uploads.push(
        this.s3Service.uploadFile(
          resized,
          `${basePrefix}/${size}.webp`,
          'image/webp',
        ),
      );
    }
    await Promise.all(uploads);

    // uuid 까지의 base URL 반환 → 소비 시 `${url}/72.webp` 처럼 접근
    return { url: this.s3Service.getPublicUrl(basePrefix) };
  }

  async uploadPersonalityImage(
    file: Express.Multer.File,
  ): Promise<UploadImageResponse> {
    // personality/{YYYY}/{mm}/{uuid} 를 base prefix 로 사용
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const basePrefix = `personality/${yyyy}/${mm}/${randomUUID()}`;

    // 원본은 리사이즈 없이 webp 로 변환해 origin.webp 로 저장
    const origin = await sharp(file.buffer).webp().toBuffer();
    const uploads: Promise<string>[] = [
      this.s3Service.uploadFile(
        origin,
        `${basePrefix}/origin.webp`,
        'image/webp',
      ),
    ];

    // 파생 사이즈: {size}.webp 로 리사이즈+크롭 후 업로드 (36x36)
    for (const size of FilesService.PERSONALITY_IMAGE_SIZES) {
      const resized = await this.resizeImage(file.buffer, size, size);
      uploads.push(
        this.s3Service.uploadFile(
          resized,
          `${basePrefix}/${size}.webp`,
          'image/webp',
        ),
      );
    }
    await Promise.all(uploads);

    // uuid 까지의 base URL 반환 → 소비 시 `${url}/36.webp` 처럼 접근
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
