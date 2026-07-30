import {
  BadRequestException,
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
   * purpose 는 createdAt 이 없어 sort 는 id·name·sortOrder 만 허용하며
   * 기본값은 sortOrder 오름차순입니다.
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
   *
   * @remarks
   * `sortOrder`를 변경하면 이동 방향에 따라 사이에 있는 목적들의 순서가 자동으로 조정됩니다.
   *
   * 예를 들어 `A: 0, B: 1, C: 2, D: 3`인 상태에서 D를 `sortOrder: 1`로 수정하면
   * `A: 0, D: 1, B: 2, C: 3`이 됩니다.
   * 반대로 A를 `sortOrder: 2`로 수정하면 `B: 0, C: 1, A: 2, D: 3`이 됩니다.
   * @param id
   * @param dto
   */
  @Patch(':id')
  @Auth(UserRole.ADMIN)
  @ApiResponseSuccess(PurposeResponse)
  @ApiBadRequestResponse({ description: 'id 는 숫자입니다.' })
  @ApiNotFoundResponse({ description: '목적 을 찾을 수 없습니다.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePurposeDto,
  ): Promise<PurposeResponse> {
    const data: Purpose = await this.purposesService.update(id, dto);
    return PurposeResponse.fromPurpose(data);
  }

  /**
   * purposes 삭제 (ADMIN)
   * @param id
   */
  @Delete(':id')
  @Auth(UserRole.ADMIN)
  @ApiResponseSuccess(PurposeResponse)
  @ApiBadRequestResponse({
    description: 'id = 1 인 목적은 삭제가 불가능합니다.',
  })
  @ApiNotFoundResponse({ description: '목적 을 찾을 수 없습니다.' })
  async delete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PurposeResponse> {
    if (id === 1)
      throw new BadRequestException('id = 1 인 목적은 삭제가 불가능합니다.');
    const data: Purpose = await this.purposesService.delete(id);
    return PurposeResponse.fromPurpose(data);
  }
}
