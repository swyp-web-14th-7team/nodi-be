import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { Personality, Prisma } from '@/prisma/client';
import { FindPersonalityDto } from '@/module/personalities/dto/find-personality.dto';
import { CreatePersonalityDto } from '@/module/personalities/dto/create-personality.dto';
import { UpdatePersonalityDto } from '@/module/personalities/dto/update-personality.dto';
import { PaginationResult } from '@/common/type/pagination-result.type';

@Injectable()
export class PersonalitiesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findMany(
    dto: FindPersonalityDto,
  ): Promise<PaginationResult<Personality>> {
    const { skip, limit, sort, order, search, jobTypeId } = dto;
    const where: Prisma.PersonalityWhereInput = {
      ...(search ? { name: { contains: search } } : {}),
      ...(jobTypeId != null ? { jobTypeId } : {}),
    };
    const [items, total] = await Promise.all([
      this.prismaService.personality.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sort]: order },
      }),
      this.prismaService.personality.count({ where }),
    ]);
    return { items, total };
  }

  async createPersonality(dto: CreatePersonalityDto): Promise<Personality> {
    const { name, description, jobTypeId, imageUrl } = dto;
    const data: Prisma.PersonalityCreateInput = {
      name,
      description,
      imageUrl,
      ...(jobTypeId != null ? { jobType: { connect: { id: jobTypeId } } } : {}),
    };
    return this.prismaService.personality.create({ data });
  }

  async findUnique(id: number) {
    return this.prismaService.personality.findUnique({ where: { id } });
  }

  async updatePersonality(id: number, dto: UpdatePersonalityDto) {
    const { name, description, jobTypeId, imageUrl } = dto;
    const data: Prisma.PersonalityUpdateInput = {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(imageUrl !== undefined ? { imageUrl } : {}),
      ...(jobTypeId !== undefined
        ? { jobType: { connect: { id: jobTypeId } } }
        : {}),
    };
    return this.prismaService.personality.update({ where: { id }, data });
  }

  async deletePersonality(id: number) {
    return this.prismaService.personality.delete({ where: { id } });
  }
}
