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
import { AffiliationStatusesService } from '@/module/affiliation-statuses/affiliation-statuses.service';
import { AffiliationStatus } from '@/prisma/client';
import { ApiResponseSuccess } from '@/common/decorator/api-response-success.decorator';
import { ApiResponsePagination } from '@/common/decorator/api-response-pagination.decorator';
import { Auth } from '@/common/decorator/auth.decorator';
import { UserRole } from '@/common/enum/user-role.enum';
import { CreateAffiliationStatusDto } from '@/module/affiliation-statuses/dto/create-affiliation-status.dto';
import { UpdateAffiliationStatusDto } from '@/module/affiliation-statuses/dto/update-affiliation-status.dto';
import { AffiliationStatusResponse } from '@/module/affiliation-statuses/type/affiliation-status-response.type';
import { PaginationType } from '@/common/type/pagination.type';
import { FindAffiliationStatusDto } from '@/module/affiliation-statuses/dto/find-affiliation-status.dto';

@Controller('affiliation-statuses')
export class AffiliationStatusesController {
  constructor(
    private readonly affiliationStatusesService: AffiliationStatusesService,
  ) {}

  /**
   * 모든 affiliation-statuses 를 조회합니다.
   *
   * @remarks
   * affiliation-status 는 createdAt 이 없어 sort 는 id·name 만 허용하며 기본값은 name 입니다.
   * @param dto
   */
  @Get()
  @ApiResponsePagination(AffiliationStatusResponse)
  async findAll(
    @Query() dto: FindAffiliationStatusDto,
  ): Promise<PaginationType<AffiliationStatusResponse>> {
    const { items, total } =
      await this.affiliationStatusesService.findMany(dto);
    return {
      items: items.map((item) =>
        AffiliationStatusResponse.fromAffiliationStatus(item),
      ),
      metadata: {
        ...dto,
        total,
      },
    };
  }

  /**
   * affiliation-statuses 생성 (ADMIN)
   * @param dto
   */
  @Post()
  @Auth(UserRole.ADMIN)
  @ApiResponseSuccess(AffiliationStatusResponse)
  async create(
    @Body() dto: CreateAffiliationStatusDto,
  ): Promise<AffiliationStatusResponse> {
    const data: AffiliationStatus =
      await this.affiliationStatusesService.create(dto);
    return AffiliationStatusResponse.fromAffiliationStatus(data);
  }

  /**
   * affiliation-statuses 수정 (ADMIN)
   * @param id
   * @param dto
   */
  @Patch(':id')
  @Auth(UserRole.ADMIN)
  @ApiResponseSuccess(AffiliationStatusResponse)
  @ApiBadRequestResponse({ description: 'id 는 숫자입니다.' })
  @ApiNotFoundResponse({ description: '소속 상태 를 찾을 수 없습니다.' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAffiliationStatusDto,
  ): Promise<AffiliationStatusResponse> {
    const targetId: number = Number(id);
    if (Number.isNaN(targetId))
      throw new BadRequestException('id 는 숫자입니다.');
    const data: AffiliationStatus =
      await this.affiliationStatusesService.update(targetId, dto);
    return AffiliationStatusResponse.fromAffiliationStatus(data);
  }

  /**
   * affiliation-statuses 삭제 (ADMIN)
   * @param id
   */
  @Delete(':id')
  @Auth(UserRole.ADMIN)
  @ApiResponseSuccess(AffiliationStatusResponse)
  @ApiBadRequestResponse({ description: 'id 는 숫자입니다.' })
  @ApiNotFoundResponse({ description: '소속 상태 를 찾을 수 없습니다.' })
  async delete(@Param('id') id: string): Promise<AffiliationStatusResponse> {
    const targetId: number = Number(id);
    if (Number.isNaN(targetId))
      throw new BadRequestException('id 는 숫자입니다.');
    const data: AffiliationStatus =
      await this.affiliationStatusesService.delete(targetId);
    return AffiliationStatusResponse.fromAffiliationStatus(data);
  }
}
