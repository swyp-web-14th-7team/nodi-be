import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { JobType, Prisma } from '@/prisma/client';
import { FindJobTypeDto } from '@/module/job-type/dto/find-job-type.dto';
import { PaginationResult } from '@/common/type/pagination-result.type';

@Injectable()
export class JobTypeRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findMany(dto: FindJobTypeDto): Promise<PaginationResult<JobType>> {
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

  async updateJobType(id: number, params: Prisma.JobTypeUpdateInput) {
    return this.prismaService.jobType.update({ where: { id }, data: params });
  }

  async deleteJobType(id: number) {
    return this.prismaService.jobType.delete({ where: { id } });
  }
}
