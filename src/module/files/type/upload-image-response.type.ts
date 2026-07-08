import { ApiProperty } from '@nestjs/swagger';

export class UploadImageResponse {
  @ApiProperty({
    description:
      'uuid 까지의 base URL. `${url}/origin.webp` · `${url}/72.webp` 처럼 접근',
    example: 'https://d1xppzi2esgqfk.cloudfront.net/profile/2026/07/{uuid}',
  })
  url: string;
}
