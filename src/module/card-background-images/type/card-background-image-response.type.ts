import { ApiProperty } from '@nestjs/swagger';
import { CardBackgroundImage } from '@/prisma/client';
import { FormattedDate } from '@/common/type/formatted-date.type';

export class CardBackgroundImageResponse {
  @ApiProperty()
  id: number;

  @ApiProperty({
    description: 'base URL (뒤에 /origin.webp · /282x400.webp 붙여 접근)',
  })
  imageUrl: string;

  @ApiProperty()
  createdAt: FormattedDate;

  static fromCardBackgroundImage(
    item: CardBackgroundImage,
  ): CardBackgroundImageResponse {
    return {
      id: item.id,
      imageUrl: item.imageUrl,
      createdAt: FormattedDate.fromDate(item.createdAt),
    };
  }
}
