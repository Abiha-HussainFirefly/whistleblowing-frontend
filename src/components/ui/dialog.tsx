import { type ReactNode, type ReactElement, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@lib/utils';

const SIZE_CLASSES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-5xl',
  full: 'max-w-[calc(100vw-2rem)]',
} as const;

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof SIZE_CLASSES;
  panelClassName?: string;
  bodyClassName?: string;
  closeLabel?: string;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  panelClassName,
  bodyClassName,
  closeLabel = 'Close',
}: DialogProps): ReactElement | null {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
      onClick={handleOverlayClick}
    >
      <div
        className={cn(
          'flex max-h-[calc(100vh-2rem)] w-full flex-col rounded-lg border border-border bg-white shadow-xl dark:border-white/15 dark:bg-[#0f1c2e] dark:text-white',
          // eslint-disable-next-line security/detect-object-injection
          SIZE_CLASSES[size],
          panelClassName,
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4 dark:border-white/10">
          <h2 className="text-lg font-semibold text-foreground dark:text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground/70 hover:bg-muted hover:text-foreground dark:hover:bg-white/10 dark:hover:text-white"
            aria-label={closeLabel}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className={cn('min-h-0 flex-1 overflow-y-auto px-6 py-4', bodyClassName)}>
          {children}
        </div>
        {footer !== undefined && (
          <div className="shrink-0 rounded-b-lg border-t border-border bg-muted/50 px-6 py-4 dark:border-white/10 dark:bg-white/5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
