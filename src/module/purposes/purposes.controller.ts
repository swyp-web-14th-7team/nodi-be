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
import { PurposesService } from '@/module/purposes/purposes.service';
import { Purpose } from '@/prisma/client';
import { ApiResponseSuccess } from '@/common/decorator/api-response-success.decorator';
import { ApiResponsePagination } from '@/common/decorator/api-response-pagination.decorator';
import { Auth } from '@/common/decorator/auth.decorator';
import { UserRole } from '@/common/enum/user-role.enum';
import { CreatePurposeDto } from '@/module/purposes/dto/create-purpose.dto';
import { UpdatePurposeDto } from '@/module/purposes/dto/update-purpose.dto';
import { PurposeResponse } from '@/module/purposes/type/purpose-response.type';
import { PaginationType } from '@/common/type/pagination.type';
import { FindPurposeDto } from '@/module/purposes/dto/find-purpose.dto';

@Controller('purposes')
export class PurposesController {
  constructor(private readonly purposesService: PurposesService) {}

  /**
   * 모든 purposes 를 조회합니다.
   *
   * @remarks
   * purpose 는 createdAt 이 없어 sort 는 id·name 만 허용하며 기본값은 name 입니다.
   * @param dto
   */
  @Get()
  @ApiResponsePagination(PurposeResponse)
  async findAll(
    @Query() dto: FindPurposeDto,
  ): Promise<PaginationType<PurposeResponse>> {
    const { items, total } = await this.purposesService.findMany(dto);
    return {
      items: items.map((item) => PurposeResponse.fromPurpose(item)),
      metadata: {
        ...dto,
        total,
      },
    };
  }

  /**
   * purposes 생성 (ADMIN)
   * @param dto
   */
  @Post()
  @Auth(UserRole.ADMIN)
  @ApiResponseSuccess(PurposeResponse)
  async create(@Body() dto: CreatePurposeDto): Promise<PurposeResponse> {
    const data: Purpose = await this.purposesService.create(dto);
    return PurposeResponse.fromPurpose(data);
  }

  /**
   * purposes 수정 (ADMIN)
   * @param id
   * @param dto
   */
  @Patch(':id')
  @Auth(UserRole.ADMIN)
  @ApiResponseSuccess(PurposeResponse)
  @ApiBadRequestResponse({ description: 'id 는 숫자입니다.' })
  @ApiNotFoundResponse({ description: '목적 을 찾을 수 없습니다.' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePurposeDto,
  ): Promise<PurposeResponse> {
    const targetId: number = Number(id);
    if (Number.isNaN(targetId))
      throw new BadRequestException('id 는 숫자입니다.');
    const data: Purpose = await this.purposesService.update(targetId, dto);
    return PurposeResponse.fromPurpose(data);
  }

  /**
   * purposes 삭제 (ADMIN)
   * @param id
   */
  @Delete(':id')
  @Auth(UserRole.ADMIN)
  @ApiResponseSuccess(PurposeResponse)
  @ApiBadRequestResponse({ description: 'id 는 숫자입니다.' })
  @ApiNotFoundResponse({ description: '목적 을 찾을 수 없습니다.' })
  async delete(@Param('id') id: string): Promise<PurposeResponse> {
    const targetId: number = Number(id);
    if (Number.isNaN(targetId))
      throw new BadRequestException('id 는 숫자입니다.');
    const data: Purpose = await this.purposesService.delete(targetId);
    return PurposeResponse.fromPurpose(data);
  }
}
