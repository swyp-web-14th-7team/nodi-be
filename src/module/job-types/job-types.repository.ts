import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { JobType, Prisma } from '@/prisma/client';
import { FindAllJobTypesDto } from '@/module/job-types/dto/find-all-job-types.dto';
import { PaginationResult } from '@/common/type/pagination-result.type';
import { UpdateJobTypeDto } from '@/module/job-types/dto/update-job-type.dto';

@Injectable()
export class JobTypesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findMany(dto: FindAllJobTypesDto): Promise<PaginationResult<JobType>> {
    const { skip, limit, sort, order, search } = dto;
    const where: Prisma.JobTypeWhereInput = search
      ? { name: { contains: search } }
      : {};
    const [items, total] = await Promise.all([
      this.prismaService.jobType.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sort]: order },
      }),
      this.prismaService.jobType.count({ where }),
    ]);
    return { items, total };
  }

  async createJobType(params: Prisma.JobTypeCreateInput): Promise<JobType> {
    return this.prismaService.jobType.create({ data: params });
  }

  async findUnique(id: number) {
    return this.prismaService.jobType.findUnique({ where: { id } });
  }

  async updateJobType(
    id: number,
    { name, imageUrl }: UpdateJobTypeDto,
  ): Promise<JobType> {
    return this.prismaService.jobType.update({
      where: { id },
      data: {
        name,
        ...(imageUrl !== undefined && { imageUrl }),
      },
    });
  }

  async deleteJobType(id: number) {
    return this.prismaService.jobType.delete({ where: { id } });
  }
}
