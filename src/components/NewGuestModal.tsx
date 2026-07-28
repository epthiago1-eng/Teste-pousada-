import { useState } from 'react';
import { toast } from 'sonner';
import { Button, Field, Input, Modal, Select } from './ui';
import type { Client } from '../types';
import { DOCUMENT_TYPE_LABELS, NATIONALITIES, formatCPF, formatPhoneBR } from '../lib/utils';

interface Props {
  open: boolean;
  initialName?: string;
  onClose: () => void;
  onCreate: (data: Omit<Client, 'id'>) => Promise<void> | void;
}

/** Modal de cadastro rápido de hóspede, aberto a partir do "+" ao lado da busca. */
export default function NewGuestModal({ open, initialName, onClose, onCreate }: Props) {
  const [f, setF] = useState({
    name: initialName ?? '',
    phone: '',
    email: '',
    nationality: 'Brasileira',
    documentType: 'cpf' as NonNullable<Client['documentType']>,
    document: '',
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (f.name.trim().length < 2) return toast.error('Informe o nome do hóspede.');
    if (f.phone.replace(/\D/g, '').length < 10) return toast.error('Informe um telefone válido.');
    setSaving(true);
    try {
      await onCreate({
        name: f.name.trim(),
        phone: f.phone.trim(),
        email: f.email.trim() || undefined,
        nationality: f.nationality,
        documentType: f.documentType,
        document: f.document.trim() || undefined,
        createdAt: new Date().toISOString(),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Novo Hóspede">
      <div className="space-y-4">
        <Field label="Nome" required>
          <Input value={f.name} onChange={(e) => setF((s) => ({ ...s, name: e.target.value }))} placeholder="Nome completo" autoFocus />
        </Field>
        <Field label="Número de telefone">
          <div className="flex items-center gap-2">
            <span className="flex h-10 shrink-0 items-center gap-1 rounded-xl border border-slate-300 bg-slate-50 px-2.5 text-sm">🇧🇷</span>
            <Input
              value={f.phone}
              onChange={(e) => setF((s) => ({ ...s, phone: formatPhoneBR(e.target.value) }))}
              placeholder="(11) 96123-4567"
              inputMode="tel"
              className="flex-1"
            />
          </div>
        </Field>
        <Field label="E-mail">
          <Input value={f.email} onChange={(e) => setF((s) => ({ ...s, email: e.target.value }))} placeholder="hospede@email.com" inputMode="email" />
        </Field>
        <Field label="Nacionalidade">
          <Select value={f.nationality} onChange={(e) => setF((s) => ({ ...s, nationality: e.target.value }))}>
            {NATIONALITIES.map((n) => <option key={n} value={n}>{n}</option>)}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Identificação">
            <Select value={f.documentType} onChange={(e) => setF((s) => ({ ...s, documentType: e.target.value as NonNullable<Client['documentType']> }))}>
              {(Object.keys(DOCUMENT_TYPE_LABELS) as (keyof typeof DOCUMENT_TYPE_LABELS)[]).map((k) => (
                <option key={k} value={k}>{DOCUMENT_TYPE_LABELS[k]}</option>
              ))}
            </Select>
          </Field>
          <Field label="Número">
            <Input
              value={f.document}
              onChange={(e) => setF((s) => ({ ...s, document: s.documentType === 'cpf' ? formatCPF(e.target.value) : e.target.value }))}
              placeholder={f.documentType === 'cpf' ? '000.000.000-00' : ''}
            />
          </Field>
        </div>

        <div className="flex gap-2 pt-1">
          <Button onClick={submit} disabled={saving} className="flex-1">{saving ? 'Enviando…' : 'Enviar'}</Button>
          <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
        </div>
      </div>
    </Modal>
  );
}
