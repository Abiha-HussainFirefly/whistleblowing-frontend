import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@components/ui/badge';
import { SeverityMeter, StatusPill } from '@components/ui/status-pill';
import { wbPriorityLevel, wbStatusTone } from '@features/whistleblowing/utils/format';
import {
  wbCategoryLabelT,
  wbPriorityLabelT,
  wbStatusLabelT,
} from '@features/whistleblowing/utils/i18n';
import type {
  InvestigationPriority,
  WhistleblowingCategory,
  WhistleblowingStatus,
} from '@features/whistleblowing/types';

/**
 * Where the case is in the workflow. Rendered as a pill with an icon so the
 * state survives without colour (manual §12).
 */
export function WbStatusBadge({ status }: { status: WhistleblowingStatus }): ReactElement {
  const { t } = useTranslation('whistleblowing');
  return <StatusPill tone={wbStatusTone(status)}>{wbStatusLabelT(status, t)}</StatusPill>;
}

/**
 * How sensitive/urgent the case is. Deliberately a stepped meter rather than a
 * pill, so severity can never be read as workflow status at a glance.
 */
export function WbPriorityBadge({ priority }: { priority: InvestigationPriority }): ReactElement {
  const { t } = useTranslation('whistleblowing');
  return (
    <SeverityMeter level={wbPriorityLevel(priority)} label={wbPriorityLabelT(priority, t)} />
  );
}

/** Neutral metadata — a category is a routing fact, not an allegation. */
export function WbCategoryBadge({ category }: { category: WhistleblowingCategory }): ReactElement {
  const { t } = useTranslation('whistleblowing');
  return <Badge variant="neutral">{wbCategoryLabelT(category, t)}</Badge>;
}
