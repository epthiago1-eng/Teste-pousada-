import { useEffect, useRef, useState, type ReactNode } from 'react';

interface ScrollFrameHeroProps {
  /** Quantidade total de frames (imagens) da sequência. */
  frameCount: number;
  /** Função que retorna a URL do frame N (1-based). */
  framePath: (index: number) => string;
  /** Altura total da seção de scroll, em "vh". Quanto maior, mais devagar a animação passa. */
  heightVh?: number;
  /** Conteúdo (texto, logo, botões) sobreposto à animação, fixo no centro da tela. */
  children?: ReactNode;
}

/**
 * Seção "cinemática": conforme o usuário rola a página, desenha o frame
 * correspondente da sequência de imagens num <canvas> fixo na tela,
 * simulando um vídeo controlado pelo scroll (técnica usada em sites da Apple).
 */
export function ScrollFrameHero({ frameCount, framePath, heightVh = 250, children }: ScrollFrameHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef(-1);
  const [loadedCount, setLoadedCount] = useState(0);

  // Pré-carrega todos os frames uma vez.
  useEffect(() => {
    let cancelled = false;
    const images: HTMLImageElement[] = [];

    for (let i = 1; i <= frameCount; i++) {
      const img = new Image();
      img.decoding = 'async';
      img.src = framePath(i);
      img.onload = () => {
        if (cancelled) return;
        setLoadedCount((c) => c + 1);
        if (i === 1) drawFrame(0);
      };
      images.push(img);
    }
    imagesRef.current = images;

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameCount]);

  const drawFrame = (index: number) => {
    const canvas = canvasRef.current;
    const img = imagesRef.current[index];
    if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    if (cw === 0 || ch === 0) return;
    const targetW = Math.round(cw * dpr);
    const targetH = Math.round(ch * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // "cover" — preenche o quadro sem distorcer, cortando o excesso.
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = cw / ch;
    let drawW: number, drawH: number, dx: number, dy: number;
    if (imgRatio > canvasRatio) {
      drawH = ch;
      drawW = ch * imgRatio;
      dx = (cw - drawW) / 2;
      dy = 0;
    } else {
      drawW = cw;
      drawH = cw / imgRatio;
      dx = 0;
      dy = (ch - drawH) / 2;
    }
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, drawW, drawH);
  };

  // Atualiza o frame conforme o scroll.
  useEffect(() => {
    let rafId = 0;

    const update = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 0));
      const progress = total > 0 ? scrolled / total : 0;
      const frameIndex = Math.min(frameCount - 1, Math.max(0, Math.floor(progress * frameCount)));
      if (frameIndex !== currentFrameRef.current) {
        currentFrameRef.current = frameIndex;
        drawFrame(frameIndex);
      }
    };

    const onScrollOrResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);
    update();

    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      cancelAnimationFrame(rafId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameCount]);

  const allLoaded = loadedCount >= frameCount;

  return (
    <div ref={containerRef} style={{ height: `${heightVh}vh` }} className="relative">
      <div className="sticky top-0 h-dvh w-full overflow-hidden bg-slate-900">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/10 to-slate-900/70" />
        {!allLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          </div>
        )}
        {children && (
          <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center text-white">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
