import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { TemplateItemDto } from '@/module/profile-card-templates/dto/template-item.dto';

export class UpdateProfileCardTemplateDto {
  // items 전체 교체 → 활성 버전이면 새 버전으로 발행된다
  @ApiProperty({ type: [TemplateItemDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => TemplateItemDto)
  items: TemplateItemDto[];
}
