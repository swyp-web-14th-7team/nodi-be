import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { SkillCategoriesService } from '@/module/skill-categories/skill-categories.service';
import { Auth } from '@/common/decorator/auth.decorator';
import { UserRole } from '@/common/enum/user-role.enum';
import { ApiResponseSuccess } from '@/common/decorator/api-response-success.decorator';
import { ApiConflictResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import { CreateSkillCategoryDto } from '@/module/skill-categories/dto/create-skill-category.dto';
import { UpdateSkillCategoryDto } from '@/module/skill-categories/dto/update-skill-category.dto';
import { SkillCategoryResponse } from '@/module/skill-categories/type/skill-category-response.type';

@Controller('skill-categories')
export class SkillCategoriesController {
  constructor(
    private readonly skillCategoriesService: SkillCategoriesService,
  ) {}

  /**
   * 스킬 카테고리 전체 조회
   */
  @Get()
  @ApiResponseSuccess(SkillCategoryResponse, { isArray: true })
  async findAll(): Promise<SkillCategoryResponse[]> {
    const categories = await this.skillCategoriesService.findAll();
    return categories.map((category) =>
      SkillCategoryResponse.fromCategory(category),
    );
  }

  /**
   * 스킬 카테고리 생성 (ADMIN)
   */
  @Post()
  @Auth(UserRole.ADMIN)
  @ApiResponseSuccess(SkillCategoryResponse)
  @ApiConflictResponse({ description: '이미 존재하는 카테고리 이름입니다.' })
  async create(
    @Body() dto: CreateSkillCategoryDto,
  ): Promise<SkillCategoryResponse> {
    const category = await this.skillCategoriesService.create(dto);
    return SkillCategoryResponse.fromCategory(category);
  }

  /**
   * 스킬 카테고리 수정 (ADMIN)
   */
  @Patch(':id')
  @Auth(UserRole.ADMIN)
  @ApiResponseSuccess(SkillCategoryResponse)
  @ApiNotFoundResponse({ description: '카테고리를 찾을 수 없습니다.' })
  @ApiConflictResponse({ description: '이미 존재하는 카테고리 이름입니다.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSkillCategoryDto,
  ): Promise<SkillCategoryResponse> {
    const category = await this.skillCategoriesService.update(id, dto);
    return SkillCategoryResponse.fromCategory(category);
  }

  /**
   * 스킬 카테고리 삭제 (ADMIN)
   * @remarks 해당 카테고리에 속한 스킬이 있으면 삭제할 수 없습니다. (409)
   */
  @Delete(':id')
  @Auth(UserRole.ADMIN)
  @ApiResponseSuccess()
  @ApiNotFoundResponse({ description: '카테고리를 찾을 수 없습니다.' })
  @ApiConflictResponse({
    description: '카테고리에 속한 스킬이 있어 삭제할 수 없습니다.',
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ id: number }> {
    await this.skillCategoriesService.delete(id);
    return { id };
  }
}
