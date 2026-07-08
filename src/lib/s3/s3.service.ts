import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly cdnDomain: string;

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      region: configService.getOrThrow<string>('AWS_REGION'),
      credentials: {
        accessKeyId: configService.getOrThrow('AWS_ACCESS_KEY_ID'),
        secretAccessKey: configService.getOrThrow('AWS_SECRET_ACCESS_KEY'),
      },
    });
    this.bucket = configService.getOrThrow<string>('AWS_BUCKET_NAME');
    // CloudFront 배포 도메인 (예: d1xppzi2esgqfk.cloudfront.net)
    this.cdnDomain = configService.getOrThrow<string>('AWS_CLOUDFRONT_DOMAIN');
  }

  async uploadFile(
    file: Buffer,
    key: string,
    contentType: string,
  ): Promise<string> {
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: contentType,
      }),
    );
    // S3 직접 URL 이 아니라 CloudFront 도메인으로 반환
    return this.getPublicUrl(key);
  }

  /** key(또는 prefix) 를 CloudFront 공개 URL 로 변환 */
  getPublicUrl(key: string): string {
    return `https://${this.cdnDomain}/${key}`;
  }
}
