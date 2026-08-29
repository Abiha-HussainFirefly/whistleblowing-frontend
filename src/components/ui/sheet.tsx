import { type ReactElement, type ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@lib/utils';

const WIDTH_CLASSES = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
} as const;

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  ariaLabel?: string;
  description?: string;
  closeLabel?: string;
  headerExtra?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: keyof typeof WIDTH_CLASSES;
  /** Optional override for the modal content gutter. */
  contentClassName?: string;
  /** Render the same editor chrome inside a normal route instead of a modal sheet. */
  embedded?: boolean;
}

export function Sheet({
  isOpen,
  onClose,
  title,
  ariaLabel,
  description,
  closeLabel = 'Close',
  headerExtra,
  children,
  footer,
  width = '2xl',
  contentClassName,
  embedded = false,
}: SheetProps): ReactElement | null {
  const [render, setRender] = useState(isOpen);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (embedded) {
      return;
    }
    if (isOpen) {
      setRender(true);
      const id = requestAnimationFrame(() => {
        setShow(true);
      });
      return () => {
        cancelAnimationFrame(id);
      };
    }
    setShow(false);
    const id = setTimeout(() => {
      setRender(false);
    }, 250);
    return () => {
      clearTimeout(id);
    };
  }, [embedded, isOpen]);

  useEffect(() => {
    if (embedded || !render) {
      return;
    }
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [embedded, render, onClose]);

  if (!embedded && !render) {
    return null;
  }
  const dialogLabel = ariaLabel ?? (typeof title === 'string' ? title : undefined);

  const editorHeader = (
    <div className="shrink-0 border-b border-border bg-white px-4 py-4 dark:border-white/10 dark:bg-[#0f1c2e] sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground dark:text-white">{title}</h2>
          {description !== undefined && (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
          aria-label={closeLabel}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      {headerExtra}
    </div>
  );

  if (embedded) {
    return (
      <section className="overflow-visible rounded-xl border border-border bg-white shadow-sm dark:border-white/10 dark:bg-[#0f1c2e] dark:text-white">
        {editorHeader}
        <div className="min-h-0 px-4 py-5 sm:px-6">{children}</div>
        {footer !== undefined && (
          <div className="sticky bottom-0 z-10 shrink-0 border-t border-border bg-muted/50 px-4 py-4 dark:border-white/10 dark:bg-[#0f1c2e] sm:px-6">
            {footer}
          </div>
        )}
      </section>
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      <div
        className={cn(
          'absolute inset-0 bg-black/40 transition-opacity duration-200',
          show ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={dialogLabel}
        style={{ height: '100dvh', transitionDuration: '250ms' }}
        className={cn(
          'form-sheet-surface fixed bottom-0 right-0 top-0 flex w-full max-w-[100vw] flex-col bg-white shadow-2xl transition-transform ease-out dark:bg-[#0f1c2e] dark:text-white',
          // eslint-disable-next-line security/detect-object-injection
          WIDTH_CLASSES[width],
          show ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {editorHeader}
        <div
          className={cn(
            'flex min-h-0 flex-1 flex-col overflow-visible px-4 py-0 sm:px-6',
            contentClassName,
          )}
        >
          <div className="flex flex-1 flex-col overflow-y-auto overflow-x-visible py-5">
            {children}
          </div>
        </div>
        {footer !== undefined && (
          <div className="shrink-0 border-t border-border bg-muted/50 px-4 py-4 dark:border-white/10 dark:bg-white/5 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
