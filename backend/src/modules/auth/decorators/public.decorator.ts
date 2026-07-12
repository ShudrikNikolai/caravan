import { SetMetadata } from '@nestjs/common';
import CONSTS from '../consts';

export const Public = () => SetMetadata(CONSTS.D_IS_PUBLIC_KEY, true);
