import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthCheck, HttpHealthIndicator } from '@nestjs/terminus';
import { PinoLogger } from 'nestjs-pino';

@ApiTags('HEALTH')
@Controller('health')
export class HealthController {
  constructor(
    private http: HttpHealthIndicator,
    private readonly logger: PinoLogger,
  ) {}
  @Get('ping')
  @HealthCheck()
  checkMe() {
    this.logger.info('Checking me');
    return 'ok';
  }

  @Get('network')
  @HealthCheck()
  async checkNetwork() {
    this.logger.info('Checking network');
    return this.http.pingCheck('google', 'https://google.com', {
      timeout: 8000,
    });
  }
}
