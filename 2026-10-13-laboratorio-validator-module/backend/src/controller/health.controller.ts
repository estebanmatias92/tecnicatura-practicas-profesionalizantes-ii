import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { HealthCheckService } from '../infrastructure/persistence/health-check.service';
import { Public } from './decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthCheckService) {}

  @Public()
  @Get()
  async check() {
    try {
      await this.health.check();
      return { status: 'ok' };
    } catch {
      throw new ServiceUnavailableException('Base de datos no disponible');
    }
  }
}
