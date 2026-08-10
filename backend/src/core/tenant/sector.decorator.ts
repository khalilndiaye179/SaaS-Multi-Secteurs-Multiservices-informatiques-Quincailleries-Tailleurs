import { SetMetadata } from '@nestjs/common';
import { SectorType } from '../types/tenant.types';

export const SECTOR_KEY = 'sectors';
export const RequireSector = (...sectors: SectorType[]) => SetMetadata(SECTOR_KEY, sectors);
