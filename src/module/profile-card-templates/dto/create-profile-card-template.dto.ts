import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';
import { TemplateItemDto } from '@/module/profile-card-templates/dto/template-item.dto';

export class CreateProfileCardTemplateDto {
  @ApiProperty({ description: '직군 ID' })
  @IsInt()
  @Min(1)
  jobTypeId: number;

  @ApiProperty({ type: [TemplateItemDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => TemplateItemDto)
  items: TemplateItemDto[];
}
