import { Injectable } from '@nestjs/common';
import { createAuthGuard } from '@/common/guards/base-auth.guard';

import CONSTS from '../consts';

@Injectable()
export class LocalAuthGuard extends createAuthGuard(CONSTS.LOCAL) {}
