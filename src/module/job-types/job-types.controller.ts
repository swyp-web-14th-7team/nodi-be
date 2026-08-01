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
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { JobTypesService } from '@/module/job-types/job-types.service';
import { JobType } from '@/prisma/client';
import { ApiResponseSuccess } from '@/common/decorator/api-response-success.decorator';
import { ApiResponsePagination } from '@/common/decorator/api-response-pagination.decorator';
import { Auth } from '@/common/decorator/auth.decorator';
import { UserRole } from '@/common/enum/user-role.enum';
import { CreateJobTypeDto } from '@/module/job-types/dto/create-job-type.dto';
import { UpdateJobTypeDto } from '@/module/job-types/dto/update-job-type.dto';
import { JobTypeResponse } from '@/module/job-types/type/job-type-response.type';
import { PaginationType } from '@/common/type/pagination.type';
import { FindAllJobTypesDto } from '@/module/job-types/dto/find-all-job-types.dto';

@Controller('job-types')
export class JobTypesController {
  constructor(private readonly jobTypesService: JobTypesService) {}

  /**
   * 모든 job type 을 조회합니다. (public)
   *
   * @remarks
   * jobType 은 createdAt 이 없어 sort 는 id·name 만 허용하며 기본값은 name 입니다.
   * @param dto
   */
  @Get()
  @ApiResponsePagination(JobTypeResponse)
  async findAll(
    @Query() dto: FindAllJobTypesDto,
  ): Promise<PaginationType<JobTypeResponse>> {
    const { items, total } = await this.jobTypesService.findMany(dto);
    return {
      items: items.map((item) => JobTypeResponse.fromJobType(item)),
      metadata: {
        ...dto,
        total,
      },
    };
  }

  /**
   * job type 생성 (ADMIN)
   * @param dto
   */
  @Post()
  @Auth(UserRole.ADMIN)
  @ApiResponseSuccess(JobTypeResponse)
  @ApiConflictResponse({ description: '이미 존재하는 job type 이름입니다.' })
  async create(@Body() dto: CreateJobTypeDto): Promise<JobTypeResponse> {
    const data: JobType = await this.jobTypesService.create(dto);
    return JobTypeResponse.fromJobType(data);
  }

  /**
   * job type 수정 (ADMIN)
   * @param id
   * @param dto
   */
  @Patch(':id')
  @Auth(UserRole.ADMIN)
  @ApiResponseSuccess(JobTypeResponse)
  @ApiBadRequestResponse({ description: 'id 는 숫자입니다.' })
  @ApiNotFoundResponse({ description: 'job type 을 찾을 수 없습니다.' })
  @ApiConflictResponse({ description: '이미 존재하는 job type 이름입니다.' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateJobTypeDto,
  ): Promise<JobTypeResponse> {
    const targetId: number = Number(id);
    if (Number.isNaN(targetId))
      throw new BadRequestException('id 는 숫자입니다.');
    const data: JobType = await this.jobTypesService.update(targetId, dto);
    return JobTypeResponse.fromJobType(data);
  }

  /**
   * job type 삭제 (ADMIN)
   * @param id
   */
  @Delete(':id')
  @Auth(UserRole.ADMIN)
  @ApiResponseSuccess(JobTypeResponse)
  @ApiBadRequestResponse({ description: 'id 는 숫자입니다.' })
  @ApiNotFoundResponse({ description: 'job type 을 찾을 수 없습니다.' })
  async delete(@Param('id') id: string): Promise<JobTypeResponse> {
    const targetId: number = Number(id);
    if (Number.isNaN(targetId))
      throw new BadRequestException('id 는 숫자입니다.');
    const data: JobType = await this.jobTypesService.delete(targetId);
    return JobTypeResponse.fromJobType(data);
  }
}
