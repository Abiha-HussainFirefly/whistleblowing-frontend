import { type HTMLAttributes, type ReactElement } from 'react';
import { cn } from '@lib/utils';

export interface PageTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Preserve the page's existing semantic heading level. */
  as?: 'h1' | 'h2';
}

/**
 * Route-level title shared by every authenticated and public portal.
 *
 * Page-specific classes may continue to control color, wrapping, spacing,
 * and dark mode. The scoped `.app-page-title` rule owns only the consistent
 * title typography so translated content and surrounding layouts are intact.
 */
export function PageTitle({
  as: Component = 'h1',
  className,
  ...props
}: PageTitleProps): ReactElement {
  return <Component className={cn('break-words app-page-title', className)} {...props} />;
}
