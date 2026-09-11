import { Toaster as SonnerToaster, toast, type ToasterProps } from 'sonner';

export { toast };

/**
 * Sonner toaster, themed from the @trout/ui tokens via the .trout-toaster
 * scope in tokens.css. Mount once per app; call `toast` from anywhere.
 */
export function Toaster(props: ToasterProps) {
  return <SonnerToaster position="top-center" className="trout-toaster" {...props} />;
}
