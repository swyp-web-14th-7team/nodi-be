import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBadRequestResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import { PersonalitiesService } from '@/module/personalities/personalities.service';
import { Personality } from '@/prisma/client';
import { ApiResponseSuccess } from '@/common/decorator/api-response-success.decorator';
import { ApiResponsePagination } from '@/common/decorator/api-response-pagination.decorator';
import { Auth } from '@/common/decorator/auth.decorator';
import { UserRole } from '@/common/enum/user-role.enum';
import { CreatePersonalityDto } from '@/module/personalities/dto/create-personality.dto';
import { UpdatePersonalityDto } from '@/module/personalities/dto/update-personality.dto';
import { PersonalityResponse } from '@/module/personalities/type/personality-response.type';
import { PaginationType } from '@/common/type/pagination.type';
import { FindPersonalityDto } from '@/module/personalities/dto/find-personality.dto';

@Controller('personalities')
export class PersonalitiesController {
  constructor(private readonly personalitiesService: PersonalitiesService) {}

  /**
   * 모든 personalities 를 조회합니다.
   *
   * @remarks
   * personality 는 createdAt 이 없어 sort 는 id·name 만 허용하며 기본값은 name 입니다.
   * @param dto
   */
  @Get()
  @ApiResponsePagination(PersonalityResponse)
  async findAll(
    @Query() dto: FindPersonalityDto,
  ): Promise<PaginationType<PersonalityResponse>> {
    const { items, total } = await this.personalitiesService.findMany(dto);
    return {
      items: items.map((item) => PersonalityResponse.fromPersonality(item)),
      metadata: {
        ...dto,
        total,
      },
    };
  }

  /**
   * personalities 생성 (ADMIN)
   * @param dto
   */
  @Post()
  @Auth(UserRole.ADMIN)
  @ApiResponseSuccess(PersonalityResponse)
  async create(
    @Body() dto: CreatePersonalityDto,
  ): Promise<PersonalityResponse> {
    const data: Personality = await this.personalitiesService.create(dto);
    return PersonalityResponse.fromPersonality(data);
  }

  /**
   * personalities 수정 (ADMIN)
   * @param id
   * @param dto
   */
  @Patch(':id')
  @Auth(UserRole.ADMIN)
  @ApiResponseSuccess(PersonalityResponse)
  @ApiBadRequestResponse({ description: 'id 는 숫자입니다.' })
  @ApiNotFoundResponse({ description: '개성 을 찾을 수 없습니다.' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePersonalityDto,
  ): Promise<PersonalityResponse> {
    const targetId: number = Number(id);
    if (Number.isNaN(targetId))
      throw new BadRequestException('id 는 숫자입니다.');
    const data: Personality = await this.personalitiesService.update(
      targetId,
      dto,
    );
    return PersonalityResponse.fromPersonality(data);
  }

  /**
   * personalities 삭제 (ADMIN)
   * @param id
   */
  @Delete(':id')
  @Auth(UserRole.ADMIN)
  @ApiResponseSuccess(PersonalityResponse)
  @ApiBadRequestResponse({ description: 'id 는 숫자입니다.' })
  @ApiNotFoundResponse({ description: '개성 을 찾을 수 없습니다.' })
  async delete(@Param('id') id: string): Promise<PersonalityResponse> {
    const targetId: number = Number(id);
    if (Number.isNaN(targetId))
      throw new BadRequestException('id 는 숫자입니다.');
    const data: Personality = await this.personalitiesService.delete(targetId);
    return PersonalityResponse.fromPersonality(data);
  }
}
