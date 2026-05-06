import * as migration_20260503_133437 from './20260503_133437';
import * as migration_20260507_multi_tenant from './20260507_multi_tenant';

export const migrations = [
  {
    up: migration_20260503_133437.up,
    down: migration_20260503_133437.down,
    name: '20260503_133437'
  },
  {
    up: migration_20260507_multi_tenant.up,
    down: migration_20260507_multi_tenant.down,
    name: '20260507_multi_tenant'
  },
];
