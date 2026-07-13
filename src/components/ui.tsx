import { type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes, useEffect, useRef, useState } from 'react';
import { X, Inbox, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase, PHOTOS_BUCKET } from '../lib/supabase';
import { cn } from '../lib/utils';

/* ---------- Botão ---------- */
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: 'sm' | 'md' | 'lg' }) {
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-brand-700 text-white hover:bg-brand-800 shadow-sm',
    secondary: 'bg-brand-50 text-brand-800 hover:bg-brand-100 border border-brand-200',
    outline: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
    ghost: 'text-slate-600 hover:bg-slate-100',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  };
  const sizes = { sm: 'h-8 px-3 text-xs', md: 'h-10 px-4 text-sm', lg: 'h-12 px-6 text-base' };
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}

/* ---------- Inputs ---------- */
const inputBase =
  'w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputBase, className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(inputBase, 'cursor-pointer', className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputBase, 'h-auto min-h-24 py-2', className)} {...props} />;
}

export function Field({ label, children, required, hint }: { label: string; children: ReactNode; required?: boolean; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

/* ---------- Upload de imagem para o Supabase Storage (celular/computador) ---------- */
const MAX_UPLOAD_MB = 8;

export function useImageUpload(tenantId: string | undefined, folder: string) {
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!tenantId) {
      toast.error('Aguarde o carregamento dos dados e tente novamente.');
      return null;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem.');
      return null;
    }
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      toast.error(`Imagem muito grande — máximo ${MAX_UPLOAD_MB}MB.`);
      return null;
    }
    setUploading(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_').slice(-60);
      const path = `tenants/${tenantId}/${folder}/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage.from(PHOTOS_BUCKET).upload(path, file, {
        cacheControl: '31536000',
        contentType: file.type,
      });
      if (error) throw error;
      const { data } = supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(path);
      return data.publicUrl;
    } catch {
      toast.error('Não foi possível enviar a foto. Verifique sua conexão e tente novamente.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploadFile, uploading };
}

/** Botão "Enviar do celular" — abre a câmera/galeria e envia a foto pro Storage. */
export function UploadPhotoButton({ tenantId, folder, onUploaded, className }: {
  tenantId: string | undefined;
  folder: string;
  onUploaded: (url: string) => void;
  className?: string;
}) {
  const { uploadFile, uploading } = useImageUpload(tenantId, folder);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
        className={cn('shrink-0', className)}
      >
        {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
        {uploading ? 'Enviando…' : 'Enviar do celular'}
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          const url = await uploadFile(file);
          if (url) onUploaded(url);
        }}
      />
    </>
  );
}

/** Campo de imagem: cola um link OU envia direto do celular/computador (valor único). */
export function ImageUrlField({ value, onChange, tenantId, folder, placeholder }: {
  value: string;
  onChange: (url: string) => void;
  tenantId: string | undefined;
  folder: string;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <div className="relative flex-1">
        <ImageIcon size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder ?? 'Cole o link de uma imagem…'} className="pl-9" />
      </div>
      <UploadPhotoButton tenantId={tenantId} folder={folder} onUploaded={onChange} />
    </div>
  );
}

/* ---------- Card ---------- */
export function Card({ className, children, onClick }: { className?: string; children: ReactNode; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'anim-card rounded-2xl border border-slate-200 bg-white shadow-sm',
        onClick && 'cursor-pointer transition hover:border-brand-300 hover:shadow-md',
        className
      )}
    >
      {children}
    </div>
  );
}

/* ---------- Badge ---------- */
const badgeColors: Record<string, string> = {
  green: 'bg-emerald-100 text-emerald-800',
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-amber-100 text-amber-800',
  blue: 'bg-sky-100 text-sky-800',
  purple: 'bg-violet-100 text-violet-800',
  gray: 'bg-slate-100 text-slate-600',
  teal: 'bg-brand-100 text-brand-800',
  orange: 'bg-orange-100 text-orange-800',
};
export function Badge({ color = 'gray', children, className }: { color?: keyof typeof badgeColors; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', badgeColors[color], className)}>
      {children}
    </span>
  );
}

/* ---------- Modal (fullscreen no mobile, centrado no desktop) ---------- */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'flex max-h-[92dvh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl',
          wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2.5 border-t border-slate-100 px-5 py-4 safe-bottom">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------- Estado vazio ---------- */
export function EmptyState({ icon: Icon = Inbox, title, subtitle, action }: { icon?: LucideIcon; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-14 text-center">
      <div className="mb-3 rounded-2xl bg-white p-3 shadow-sm">
        <Icon size={28} className="text-slate-400" />
      </div>
      <p className="font-semibold text-slate-700">{title}</p>
      {subtitle && <p className="mt-1 max-w-sm text-sm text-slate-500">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ---------- Cabeçalho de página ---------- */
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ---------- Stat ---------- */
export function Stat({ label, value, icon: Icon, tone = 'teal', sub }: { label: string; value: ReactNode; icon: LucideIcon; tone?: 'teal' | 'blue' | 'amber' | 'red' | 'emerald' | 'violet'; sub?: string }) {
  const tones = {
    teal: 'bg-brand-50 text-brand-700',
    blue: 'bg-sky-50 text-sky-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
  };
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
        </div>
        <div className={cn('rounded-xl p-2.5', tones[tone])}>
          <Icon size={20} />
        </div>
      </div>
    </Card>
  );
}

/* ---------- Confirmação ---------- */
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirmar', danger }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmLabel?: string; danger?: boolean }) {
  return (
    <Modal open={open} onClose={onClose} title={title} footer={
      <>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
      </>
    }>
      <p className="text-sm text-slate-600">{message}</p>
    </Modal>
  );
}
