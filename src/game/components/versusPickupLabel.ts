import type { VersusItem } from '../versus/types';

type RenderedVersusItem = Pick<VersusItem, 'id' | 'point' | 'kind'>;

export function versusPickupCoordinateLabel(item: RenderedVersusItem): string {
  return `(${item.point.x}, ${item.point.y})`;
}
