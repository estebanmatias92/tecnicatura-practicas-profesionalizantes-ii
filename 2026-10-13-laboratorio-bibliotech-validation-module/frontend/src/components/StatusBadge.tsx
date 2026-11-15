import type { Material } from '../api/types';
import { materialStatus } from '../lib/format';

export function StatusBadge({ material }: { material: Pick<Material, 'deletedAt' | 'isDraft' | 'visibility'> }) {
  const status = materialStatus(material);
  return <span className={`badge badge-${status.tone}`}>{status.label}</span>;
}
