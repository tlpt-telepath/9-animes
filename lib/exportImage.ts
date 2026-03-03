import { toPng } from 'html-to-image';

async function waitForImages(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'));
  await Promise.all(
    images.map(async (img) => {
      if (img.complete && img.naturalWidth > 0) return;
      try {
        if (typeof img.decode === 'function') {
          await img.decode();
          return;
        }
      } catch {
        // ignore decode errors and fallback to load event
      }
      await new Promise<void>((resolve) => {
        const done = () => resolve();
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      });
    })
  );
}

function makeDownload(dataUrl: string, fileName: string): void {
  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  link.click();
}

function buildFallbackClone(element: HTMLElement): HTMLElement {
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.width = `${element.clientWidth}px`;
  clone.style.maxWidth = 'none';

  const images = Array.from(clone.querySelectorAll('img'));
  images.forEach((img) => {
    const fallback = document.createElement('div');
    fallback.style.width = '100%';
    fallback.style.height = '100%';
    fallback.style.display = 'flex';
    fallback.style.alignItems = 'center';
    fallback.style.justifyContent = 'center';
    fallback.style.background = '#334155';
    fallback.style.color = '#e2e8f0';
    fallback.style.fontSize = '12px';
    fallback.style.fontWeight = '600';
    fallback.textContent = 'No images';
    img.replaceWith(fallback);
  });

  const mount = document.createElement('div');
  mount.style.position = 'fixed';
  mount.style.left = '-10000px';
  mount.style.top = '0';
  mount.style.pointerEvents = 'none';
  mount.appendChild(clone);
  document.body.appendChild(mount);

  return mount;
}

export async function exportElementToPng(
  element: HTMLElement,
  fileName: string
): Promise<{ usedFallback: boolean }> {
  await waitForImages(element);

  try {
    const dataUrl = await toPng(element, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: '#0b1120'
    });
    makeDownload(dataUrl, fileName);
    return { usedFallback: false };
  } catch {
    const mount = buildFallbackClone(element);
    const fallbackRoot = mount.firstElementChild as HTMLElement;
    try {
      const dataUrl = await toPng(fallbackRoot, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#0b1120'
      });
      makeDownload(dataUrl, fileName);
      return { usedFallback: true };
    } finally {
      mount.remove();
    }
  }
}
