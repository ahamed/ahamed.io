import { describe, expect, it } from 'vitest';
import html from '../../index.html?raw';
import { STOPS } from '../content/journey';

const doc = new DOMParser().parseFromString(html, 'text/html');
const meta = (key: string) =>
  doc.querySelector(`meta[name="${key}"], meta[property="${key}"]`)?.getAttribute('content');

describe('index.html metadata', () => {
  it('describes the owner and declares the canonical URL', () => {
    expect(meta('description')).toMatch(/VP of Engineering at Ollyo/);
    expect(meta('description')).toMatch(/9 years/);
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://ahamed.io/',
    );
  });

  it('has Open Graph and Twitter card tags with a 1200 × 630 share image', () => {
    expect(meta('og:type')).toBe('website');
    expect(meta('og:title')).toBeTruthy();
    expect(meta('og:description')).toBeTruthy();
    expect(meta('og:url')).toBe('https://ahamed.io/');
    expect(meta('og:image')).toBe('https://ahamed.io/og.png');
    expect(meta('og:image:width')).toBe('1200');
    expect(meta('og:image:height')).toBe('630');
    expect(meta('twitter:card')).toBe('summary_large_image');
    expect(meta('twitter:image')).toBe('https://ahamed.io/og.png');
  });

  it('describes a Person whose profiles match the verified links', () => {
    const script = doc.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script?.textContent ?? '{}') as Record<string, unknown>;
    expect(data['@type']).toBe('Person');
    expect(data.name).toBe('Sajeeb Ahamed');
    expect(data.jobTitle).toBe('VP of Engineering');
    const profiles = (STOPS[0]?.links ?? []).filter((l) => l.verified).map((l) => l.href);
    expect(data.sameAs).toEqual(profiles);
  });

  it('contains no email address', () => {
    expect(doc.head.innerHTML).not.toMatch(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
    expect(doc.head.innerHTML).not.toMatch(/mailto:/);
  });
});
