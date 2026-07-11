import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { PublicAvailability, RoomCategory, Tenant } from '../../types';

export type PublicCategory = RoomCategory & {
  roomIds: string[];
  beds?: { double: number; single: number };
  pricing?: {
    basePrice: number;
    pricesByDayOfWeek: Record<number, number>;
    dailyOverrides: Record<string, number>;
    minStay: number;
    validFrom: string;
    validTo: string;
  };
};

export function usePublicTenant(slug?: string) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [availability, setAvailability] = useState<PublicAvailability | null>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'not-found'>('loading');

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const slugSnap = await getDoc(doc(db, 'slugs', slug));
        if (!slugSnap.exists()) return setStatus('not-found');
        const tenantId = slugSnap.data().tenantId as string;
        const tenantSnap = await getDoc(doc(db, 'tenants', tenantId));
        if (!tenantSnap.exists()) return setStatus('not-found');
        setTenant({ id: tenantSnap.id, ...tenantSnap.data() } as Tenant);

        // Categorias publicadas em publicData/categories (sem dados sensíveis)
        const pub = await getDoc(doc(db, 'tenants', tenantId, 'publicData', 'categories'));
        if (pub.exists()) setCategories((pub.data().items ?? []) as PublicCategory[]);

        const avail = await getDoc(doc(db, 'tenants', tenantId, 'publicData', 'availability'));
        if (avail.exists()) setAvailability(avail.data() as PublicAvailability);

        setStatus('ok');
      } catch (e) {
        console.warn(e);
        setStatus('not-found');
      }
    })();
  }, [slug]);

  return { tenant, categories, availability, status };
}
