import { Controller, Get, Post } from '@nestjs/common';

@Controller('collection-groups')
export class CollectionGroupsController {
  @Post()
  async createCollectionGroup() {}

  @Get()
  async getCollectionGroups() {}
}
