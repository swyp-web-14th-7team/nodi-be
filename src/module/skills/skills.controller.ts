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
import { SkillsService } from '@/module/skills/skills.service';
import { Auth } from '@/common/decorator/auth.decorator';
import { UserRole } from '@/common/enum/user-role.enum';
import { ApiResponseSuccess } from '@/common/decorator/api-response-success.decorator';
import { CreateSkillDto } from '@/module/skills/dto/create-skill.dto';
import { UpdateSkillDto } from '@/module/skills/dto/update-skill.dto';
import { FindSkillsDto } from '@/module/skills/dto/find-skills.dto';
import { SkillResponse } from '@/module/skills/type/skill-response.type';
import { ApiResponsePagination } from '@/common/decorator/api-response-pagination.decorator';
import { PaginationType } from '@/common/type/pagination.type';

@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  /**
   * skill 목록 조회
   * @remarks
   * categoryId 를 넘기면 해당 카테고리의 skill 만, jobTypeId 를 넘기면 해당 직군에 매핑된 skill 만,
   * search 를 넘기면 name 부분 일치로 필터링합니다. (생략 시 전체, 여러 개를 함께 넘기면 AND)
   *
   * sort 는 id·name 만 허용하며 기본값은 name 입니다.
   */
  @Get()
  @ApiResponsePagination(SkillResponse)
  async findAll(
    @Query() dto: FindSkillsDto,
  ): Promise<PaginationType<SkillResponse>> {
    const { items, total } = await this.skillsService.findAll(dto);
    return {
      items: items.map((item) => SkillResponse.fromSkill(item)),
      metadata: {
        ...dto,
        total,
      },
    };
  }

  /**
   * skill 생성 (ADMIN)
   * @remarks
   * jobTypeIds 로 이 스킬이 속한 직군을 함께 지정합니다. 빈 배열은 허용하지 않으며,
   * 전 직군 공통 스킬이면 모든 직군 ID 를 넣습니다.
   */
  @Post()
  @Auth(UserRole.ADMIN)
  @ApiResponseSuccess(SkillResponse)
  async create(@Body() dto: CreateSkillDto): Promise<SkillResponse> {
    const skill = await this.skillsService.create(dto);
    return SkillResponse.fromSkill(skill);
  }

  /**
   * skill 수정 (ADMIN)
   * @remarks
   * 넘긴 필드만 수정합니다. jobTypeIds 를 넘기면 직군 매핑을 그 목록으로 통째로 교체하고,
   * 생략하면 기존 매핑을 그대로 둡니다.
   */
  @Patch(':id')
  @Auth(UserRole.ADMIN)
  @ApiResponseSuccess(SkillResponse)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSkillDto,
  ): Promise<SkillResponse> {
    const skill = await this.skillsService.update(id, dto);
    return SkillResponse.fromSkill(skill);
  }

  /**
   * skill 삭제 (ADMIN)
   */
  @Delete(':id')
  @Auth(UserRole.ADMIN)
  @ApiResponseSuccess()
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ id: number }> {
    await this.skillsService.delete(id);
    return { id };
  }
}
