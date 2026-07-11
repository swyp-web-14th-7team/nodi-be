import { ApiProperty } from '@nestjs/swagger';
import { TemplateType } from '@/module/profile-card-templates/profile-card-templates.type';
import { JobTypeResponse } from '@/module/job-type/type/job-type-response.type';

export class TemplateItemResponse {
  @ApiProperty()
  id: number;

  @ApiProperty()
  label: string;

  @ApiProperty()
  description: string;

  @ApiProperty({
    description: '0: SHORT_TEXT, 1: LONG_TEXT, 2: LINK, 3: NUMBER',
  })
  type: number;
}

export class ProfileCardTemplateResponse {
  @ApiProperty()
  id: number;

  @ApiProperty()
  jobType: JobTypeResponse;

  @ApiProperty()
  version: number;

  @ApiProperty({ nullable: true, description: 'true = 현재 활성 버전' })
  isActive: boolean | null;

  @ApiProperty({ type: [TemplateItemResponse] })
  items: TemplateItemResponse[];

  static fromTemplate(item: TemplateType): ProfileCardTemplateResponse {
    return {
      id: item.id,
      jobType: JobTypeResponse.fromJobType(item.jobType),
      version: item.version,
      isActive: item.isActive,
      items: item.profileCardTemplateItems.map((i) => ({
        id: i.id,
        label: i.label,
        description: i.description,
        type: i.type,
      })),
    };
  }
}
