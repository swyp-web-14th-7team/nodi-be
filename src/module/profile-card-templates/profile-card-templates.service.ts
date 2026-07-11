import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@/prisma/client';
import { ProfileCardTemplatesRepository } from '@/module/profile-card-templates/profile-card-templates.repository';
import { TemplateType } from '@/module/profile-card-templates/profile-card-templates.type';
import { CreateProfileCardTemplateDto } from '@/module/profile-card-templates/dto/create-profile-card-template.dto';
import { UpdateProfileCardTemplateDto } from '@/module/profile-card-templates/dto/update-profile-card-template.dto';
import { FindProfileCardTemplateDto } from '@/module/profile-card-templates/dto/find-profile-card-template.dto';
import { PaginationResult } from '@/common/type/pagination-result.type';

@Injectable()
export class ProfileCardTemplatesService {
  constructor(
    private readonly templatesRepository: ProfileCardTemplatesRepository,
  ) {}

  /** 템플릿 목록 조회 (pagination) */
  async findMany(
    dto: FindProfileCardTemplateDto,
  ): Promise<PaginationResult<TemplateType>> {
    return this.templatesRepository.findMany(dto);
  }

  /** 템플릿 단건 조회 */
  async findById(id: number): Promise<TemplateType> {
    const template = await this.templatesRepository.findByIdWithItems(id);
    if (!template) throw new NotFoundException('템플릿을 찾을 수 없습니다.');
    return template;
  }

  /** 새 템플릿 발행 (해당 직군의 첫 버전 또는 새 활성 버전) */
  async create(dto: CreateProfileCardTemplateDto): Promise<TemplateType> {
    return this.templatesRepository.publishVersion(dto.jobTypeId, dto.items);
  }

  /**
   * 활성 템플릿 수정 → 새 버전 발행.
   * 기존 버전은 불변으로 남아 이미 사용중인 카드에 영향 없음.
   */
  async update(
    id: number,
    dto: UpdateProfileCardTemplateDto,
  ): Promise<TemplateType> {
    const current = await this.templatesRepository.findByIdWithItems(id);
    if (!current) throw new NotFoundException('템플릿을 찾을 수 없습니다.');
    return this.templatesRepository.publishVersion(
      current.jobTypeId,
      dto.items,
    );
  }

  /**
   * 템플릿 삭제.
   * 연결된 프로필 카드가 있으면 FK(Restrict) 위반(P2003)을 잡아 409 로 변환한다.
   */
  async delete(id: number): Promise<void> {
    const current = await this.templatesRepository.findByIdWithItems(id);
    if (!current) throw new NotFoundException('템플릿을 찾을 수 없습니다.');
    try {
      await this.templatesRepository.deleteTemplate(id);
    } catch (e) {
      this.handleDeleteError(e);
    }
  }

  /** 연결된 프로필 카드로 인한 FK 위반(P2003) → 409 로 변환 */
  private handleDeleteError(e: unknown): never {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003')
      throw new ConflictException(
        '연결된 프로필 카드가 있어 삭제할 수 없습니다.',
      );
    throw e;
  }
}
