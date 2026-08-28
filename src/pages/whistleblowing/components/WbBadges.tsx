import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@components/ui/badge';
import { wbPriorityVariant, wbStatusVariant } from '@features/whistleblowing/utils/format';
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

export function WbStatusBadge({ status }: { status: WhistleblowingStatus }): ReactElement {
  const { t } = useTranslation('whistleblowing');
  return <Badge variant={wbStatusVariant(status)}>{wbStatusLabelT(status, t)}</Badge>;
}

export function WbPriorityBadge({ priority }: { priority: InvestigationPriority }): ReactElement {
  const { t } = useTranslation('whistleblowing');
  return <Badge variant={wbPriorityVariant(priority)}>{wbPriorityLabelT(priority, t)}</Badge>;
}

export function WbCategoryBadge({ category }: { category: WhistleblowingCategory }): ReactElement {
  const { t } = useTranslation('whistleblowing');
  return <Badge variant="default">{wbCategoryLabelT(category, t)}</Badge>;
}
