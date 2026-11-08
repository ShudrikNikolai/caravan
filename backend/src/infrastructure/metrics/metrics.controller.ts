import { Public } from '@/modules/auth/decorators/public.decorator';
import { Controller, Get, Res } from '@nestjs/common';
import { PrometheusController } from '@willsoto/nestjs-prometheus';
import type { Response } from 'express';

@Controller()
export class MetricsController extends PrometheusController {
  @Get()
  @Public()
  index(@Res({ passthrough: true }) response: Response) {
    return super.index(response);
  }
}
