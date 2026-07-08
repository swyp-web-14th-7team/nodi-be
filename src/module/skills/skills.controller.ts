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
   * categoryId 를 넘기면 해당 카테고리의 skill 만, search 를 넘기면 name 부분 일치로 필터링합니다. (생략 시 전체)
   *
   * sort 는 id·name 만 허용하며 기본값은 name 입니다.
   */
  @Get()
  @Auth(UserRole.USER, UserRole.ADMIN)
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
   * skill 단건 조회
   */
  @Get(':id')
  @Auth(UserRole.USER, UserRole.ADMIN)
  @ApiResponseSuccess(SkillResponse)
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<SkillResponse> {
    const skill = await this.skillsService.findById(id);
    return SkillResponse.fromSkill(skill);
  }

  /**
   * skill 생성 (ADMIN)
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
