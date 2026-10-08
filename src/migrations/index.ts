import * as migration_20261006_061451_initial from './20261006_061451_initial';
import * as migration_20261008_050836_manual_order from './20261008_050836_manual_order';

export const migrations = [
  {
    up: migration_20261006_061451_initial.up,
    down: migration_20261006_061451_initial.down,
    name: '20261006_061451_initial',
  },
  {
    up: migration_20261008_050836_manual_order.up,
    down: migration_20261008_050836_manual_order.down,
    name: '20261008_050836_manual_order'
  },
];
