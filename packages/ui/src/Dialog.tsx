import type { ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  /** Action row (typically Button components), right-aligned. */
  footer?: ReactNode;
}

/**
 * Modal dialog on Radix primitives. Behavior (focus, Escape, scroll lock,
 * ARIA wiring) comes from the library; every pixel is styled from the
 * @trout/ui tokens (.trout-dialog* in tokens.css).
 */
export function Dialog({ open, onOpenChange, title, description, children, footer }: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="trout-dialog-overlay" />
        <DialogPrimitive.Content className="trout-dialog">
          <div className="trout-dialog__body">
            <DialogPrimitive.Title className="trout-dialog__title">{title}</DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="trout-dialog__desc">
                {description}
              </DialogPrimitive.Description>
            ) : null}
            {children}
          </div>
          {footer ? <div className="trout-dialog__actions">{footer}</div> : null}
          <DialogPrimitive.Close className="trout-dialog__close" aria-label="Close dialog">
            ×
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
