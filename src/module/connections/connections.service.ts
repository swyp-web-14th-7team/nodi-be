import { Injectable } from '@nestjs/common';
import { ConnectionsRepository } from '@/module/connections/connections.repository';

@Injectable()
export class ConnectionsService {
  constructor(private readonly connectionsRepository: ConnectionsRepository) {}
}
