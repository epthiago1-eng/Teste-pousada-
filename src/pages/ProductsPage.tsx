import { useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Package, Plus, Trash2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Badge, Button, Card, ConfirmDialog, EmptyState, Field, Input, Modal, PageHeader, Select } from '../components/ui';
import type { Product } from '../types';
import { brl } from '../lib/utils';

export default function ProductsPage() {
  const { products, save, remove } = useData();
  const [modal, setModal] = useState<Product | 'new' | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const lowStock = products.filter(
    (p) => p.type === 'product' && typeof p.stockQuantity === 'number' && typeof p.minStockAlert === 'number' && p.stockQuantity <= p.minStockAlert
  );

  return (
    <>
      <PageHeader title="Produtos e serviços" subtitle="Itens para lançar no consumo dos hóspedes" actions={<Button onClick={() => setModal('new')}><Plus size={16} /> Novo item</Button>} />

      {lowStock.length > 0 && (
        <Card className="mb-4 flex items-center gap-2 border-amber-200 bg-amber-50 p-3.5">
          <AlertTriangle size={17} className="shrink-0 text-amber-600" />
          <p className="text-sm font-semibold text-amber-800">
            Estoque baixo: {lowStock.map((p) => p.name).join(', ')}
          </p>
        </Card>
      )}

      {products.length === 0 ? (
        <EmptyState icon={Package} title="Nenhum item cadastrado" subtitle="Cadastre produtos do frigobar, bebidas, serviços de lavanderia etc." action={<Button onClick={() => setModal('new')}>Novo item</Button>} />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {products.slice().sort((a, b) => a.name.localeCompare(b.name)).map((p) => (
            <Card key={p.id} className="p-4" onClick={() => setModal(p)}>
              <div className="flex items-start justify-between">
                <p className="font-bold text-slate-800">{p.name}</p>
                <button onClick={(e) => { e.stopPropagation(); setDeleting(p.id); }} className="p-1 text-slate-300 hover:text-red-500 cursor-pointer"><Trash2 size={14} /></button>
              </div>
              <p className="mt-1 text-lg font-extrabold text-brand-800">{brl(p.price)}</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge color={p.type === 'product' ? 'blue' : 'purple'}>{p.type === 'product' ? 'Produto' : 'Serviço'}</Badge>
                {p.type === 'product' && typeof p.stockQuantity === 'number' && (
                  <Badge color={typeof p.minStockAlert === 'number' && p.stockQuantity <= p.minStockAlert ? 'red' : 'gray'}>
                    {p.stockQuantity} em estoque
                  </Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {modal && (
        <ProductModal
          product={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={async (data) => { await save('products', data); toast.success('Item salvo.'); setModal(null); }}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => { if (deleting) { remove('products', deleting); toast.success('Item excluído.'); } }}
        title="Excluir item"
        message="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        danger
      />
    </>
  );
}

function ProductModal({ product, onClose, onSave }: {
  product: Product | null;
  onClose: () => void;
  onSave: (data: Partial<Product> & { id?: string }) => void;
}) {
  const [f, setF] = useState({
    name: product?.name ?? '',
    type: product?.type ?? ('product' as Product['type']),
    price: product?.price ?? 0,
    stockQuantity: product?.stockQuantity ?? 0,
    minStockAlert: product?.minStockAlert ?? 0,
  });
  return (
    <Modal open onClose={onClose} title={product ? product.name : 'Novo item'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => {
            if (!f.name.trim()) return toast.error('Informe o nome.');
            if (f.price < 0) return toast.error('Preço inválido.');
            onSave({
              id: product?.id,
              name: f.name.trim(),
              type: f.type,
              price: f.price,
              ...(f.type === 'product' ? { stockQuantity: f.stockQuantity, minStockAlert: f.minStockAlert } : {}),
            });
          }}>Salvar</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Nome" required><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Água mineral 500ml" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo">
            <Select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as Product['type'] })}>
              <option value="product">Produto (com estoque)</option>
              <option value="service">Serviço</option>
            </Select>
          </Field>
          <Field label="Preço" required><Input type="number" min={0} step="0.01" value={f.price || ''} onChange={(e) => setF({ ...f, price: Number(e.target.value) })} placeholder="0,00" /></Field>
        </div>
        {f.type === 'product' && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Estoque atual"><Input type="number" min={0} value={f.stockQuantity} onChange={(e) => setF({ ...f, stockQuantity: Number(e.target.value) })} /></Field>
            <Field label="Alerta de estoque mínimo"><Input type="number" min={0} value={f.minStockAlert} onChange={(e) => setF({ ...f, minStockAlert: Number(e.target.value) })} /></Field>
          </div>
        )}
      </div>
    </Modal>
  );
}
