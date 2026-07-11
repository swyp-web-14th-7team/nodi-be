import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JobTypeRepository } from '@/module/job-type/job-type.repository';
import { JobType, Prisma } from '@/prisma/client';
import { CreateJobTypeDto } from '@/module/job-type/dto/create-job-type.dto';
import { UpdateJobTypeDto } from '@/module/job-type/dto/update-job-type.dto';
import { FindJobTypeDto } from '@/module/job-type/dto/find-job-type.dto';
import { PaginationResult } from '@/common/type/pagination-result.type';

@Injectable()
export class JobTypeService {
  constructor(private readonly jobTypeRepository: JobTypeRepository) {}

  async findMany(dto: FindJobTypeDto): Promise<PaginationResult<JobType>> {
    return this.jobTypeRepository.findMany(dto);
  }

  async create(dto: CreateJobTypeDto): Promise<JobType> {
    try {
      return await this.jobTypeRepository.createJobType(dto);
    } catch (e) {
      this.handleWriteError(e);
    }
  }

  async update(id: number, dto: UpdateJobTypeDto): Promise<JobType> {
    await this.findByIdOrThrow(id);
    try {
      return await this.jobTypeRepository.updateJobType(id, dto);
    } catch (e) {
      this.handleWriteError(e);
    }
  }

  async delete(id: number): Promise<JobType> {
    await this.findByIdOrThrow(id);
    return this.jobTypeRepository.deleteJobType(id);
  }

  private async findByIdOrThrow(id: number): Promise<JobType> {
    const target: JobType | null = await this.jobTypeRepository.findUnique(id);
    if (!target) throw new NotFoundException('job type 을 찾을 수 없습니다.');
    return target;
  }

  /** name 중복(P2002) → 409 로 변환 (create / update 공용) */
  private handleWriteError(e: unknown): never {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')
      throw new ConflictException('이미 존재하는 job type 이름입니다.');
    throw e;
  }
}
