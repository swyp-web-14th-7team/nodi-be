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
import { InterestsService } from '@/module/interests/Interests.service';
import { Interest } from '@/prisma/client';
import { ApiResponseSuccess } from '@/common/decorator/api-response-success.decorator';
import { ApiResponsePagination } from '@/common/decorator/api-response-pagination.decorator';
import { Auth } from '@/common/decorator/auth.decorator';
import { UserRole } from '@/common/enum/user-role.enum';
import { CreateInterestDto } from '@/module/interests/dto/create-interest.dto';
import { UpdateInterestDto } from '@/module/interests/dto/update-interest.dto';
import { InterestResponse } from '@/module/interests/type/interest-response.type';
import { PaginationType } from '@/common/type/pagination.type';
import { PaginationDto } from '@/common/dto/pagination.dto';

@Controller('interests')
export class InterestsController {
  constructor(private readonly interestsService: InterestsService) {}

  /**
   * 모든 interests 를 조회합니다.
   *
   * @remarks
   * interest 는 createdAt 이 없기에 query 파라메터의 sort 는 name 으로 고정됩니다.
   * @param dto
   */
  @Get()
  @Auth(UserRole.USER, UserRole.ADMIN)
  @ApiResponsePagination(InterestResponse)
  async findAll(
    @Query() dto: PaginationDto,
  ): Promise<PaginationType<InterestResponse>> {
    dto.sort = 'name';
    const { items, total } = await this.interestsService.findMany(dto);
    return {
      items: items.map((item) => InterestResponse.fromInterest(item)),
      metadata: {
        ...dto,
        total,
      },
    };
  }

  /**
   * interests 생성 (ADMIN)
   * @param dto
   */
  @Post()
  @Auth(UserRole.ADMIN)
  @ApiResponseSuccess(InterestResponse)
  async create(@Body() dto: CreateInterestDto): Promise<InterestResponse> {
    const data: Interest = await this.interestsService.create(dto);
    return InterestResponse.fromInterest(data);
  }

  /**
   * interests 수정 (ADMIN)
   * @param id
   * @param dto
   */
  @Patch(':id')
  @Auth(UserRole.ADMIN)
  @ApiResponseSuccess(InterestResponse)
  @ApiBadRequestResponse({ description: 'id 는 숫자입니다.' })
  @ApiNotFoundResponse({ description: 'interest 를 찾을 수 없습니다.' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInterestDto,
  ): Promise<InterestResponse> {
    const targetId: number = Number(id);
    if (Number.isNaN(targetId))
      throw new BadRequestException('id 는 숫자입니다.');
    const data: Interest = await this.interestsService.update(targetId, dto);
    return InterestResponse.fromInterest(data);
  }

  /**
   * interests 삭제 (ADMIN)
   * @param id
   */
  @Delete(':id')
  @Auth(UserRole.ADMIN)
  @ApiResponseSuccess(InterestResponse)
  @ApiBadRequestResponse({ description: 'id 는 숫자입니다.' })
  @ApiNotFoundResponse({ description: 'interest 를 찾을 수 없습니다.' })
  async delete(@Param('id') id: string): Promise<InterestResponse> {
    const targetId: number = Number(id);
    if (Number.isNaN(targetId))
      throw new BadRequestException('id 는 숫자입니다.');
    const data: Interest = await this.interestsService.delete(targetId);
    return InterestResponse.fromInterest(data);
  }
}
