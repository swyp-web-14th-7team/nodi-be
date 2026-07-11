import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiConflictResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import { ProfileCardTemplatesService } from '@/module/profile-card-templates/profile-card-templates.service';
import { Auth } from '@/common/decorator/auth.decorator';
import { UserRole } from '@/common/enum/user-role.enum';
import { ApiResponseSuccess } from '@/common/decorator/api-response-success.decorator';
import { ApiResponsePagination } from '@/common/decorator/api-response-pagination.decorator';
import { CreateProfileCardTemplateDto } from '@/module/profile-card-templates/dto/create-profile-card-template.dto';
import { UpdateProfileCardTemplateDto } from '@/module/profile-card-templates/dto/update-profile-card-template.dto';
import { FindProfileCardTemplateDto } from '@/module/profile-card-templates/dto/find-profile-card-template.dto';
import { ProfileCardTemplateResponse } from '@/module/profile-card-templates/type/profile-card-templates-response.type';
import { PaginationType } from '@/common/type/pagination.type';

@Controller('profile-card-templates')
export class ProfileCardTemplatesController {
  constructor(
    private readonly profileCardTemplatesService: ProfileCardTemplatesService,
  ) {}

  /**
   * 프로필 카드 템플릿 목록 조회 (public)
   * @remarks
   * jobTypeId 를 넘기면 해당 직군의 템플릿만 조회합니다. (생략 시 전체)
   * 템플릿은 createdAt 이 없어 sort 는 id·version 만 허용하며 기본값은 id 입니다.
   */
  @Get()
  @ApiResponsePagination(ProfileCardTemplateResponse)
  async findAll(
    @Query() dto: FindProfileCardTemplateDto,
  ): Promise<PaginationType<ProfileCardTemplateResponse>> {
    const { items, total } =
      await this.profileCardTemplatesService.findMany(dto);
    return {
      items: items.map((item) =>
        ProfileCardTemplateResponse.fromTemplate(item),
      ),
      metadata: {
        ...dto,
        total,
      },
    };
  }

  /**
   * 프로필 카드 템플릿 단건 조회 (public)
   */
  @Get(':id')
  @ApiResponseSuccess(ProfileCardTemplateResponse)
  @ApiNotFoundResponse({ description: '템플릿을 찾을 수 없습니다.' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ProfileCardTemplateResponse> {
    const template = await this.profileCardTemplatesService.findById(id);
    return ProfileCardTemplateResponse.fromTemplate(template);
  }

  /**
   * 프로필 카드 템플릿 발행 (ADMIN)
   * @remarks 해당 직군의 새 활성 버전으로 발행됩니다. 기존 활성 버전은 과거 버전으로 강등됩니다.
   */
  @Post()
  @Auth(UserRole.ADMIN)
  @ApiResponseSuccess(ProfileCardTemplateResponse)
  async create(
    @Body() dto: CreateProfileCardTemplateDto,
  ): Promise<ProfileCardTemplateResponse> {
    const data = await this.profileCardTemplatesService.create(dto);
    return ProfileCardTemplateResponse.fromTemplate(data);
  }

  /**
   * 프로필 카드 템플릿 수정 (ADMIN)
   * @remarks
   * 활성 템플릿은 수정 불가하므로, 수정 시 version 을 증가시켜 새 활성 버전을 발행합니다.
   * 기존 버전은 불변으로 남아 이미 사용중인 카드에 영향이 없습니다.
   */
  @Patch(':id')
  @Auth(UserRole.ADMIN)
  @ApiResponseSuccess(ProfileCardTemplateResponse)
  @ApiNotFoundResponse({ description: '템플릿을 찾을 수 없습니다.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProfileCardTemplateDto,
  ): Promise<ProfileCardTemplateResponse> {
    const data = await this.profileCardTemplatesService.update(id, dto);
    return ProfileCardTemplateResponse.fromTemplate(data);
  }

  /**
   * 프로필 카드 템플릿 삭제 (ADMIN)
   * @remarks
   * 이 템플릿에 연결된 프로필 카드가 하나라도 있으면 삭제가 제한됩니다(409).
   * 사용중인 카드의 무결성을 보호하기 위함이며, 템플릿의 항목(items)은 함께 삭제됩니다.
   */
  @Delete(':id')
  @Auth(UserRole.ADMIN)
  @ApiResponseSuccess()
  @ApiNotFoundResponse({ description: '템플릿을 찾을 수 없습니다.' })
  @ApiConflictResponse({
    description: '연결된 프로필 카드가 있어 삭제할 수 없습니다.',
  })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.profileCardTemplatesService.delete(id);
  }
}
