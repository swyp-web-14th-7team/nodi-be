import { Controller } from '@nestjs/common';
import { ConnectionsService } from '@/module/connections/connections.service';

@Controller('connections')
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}
}
