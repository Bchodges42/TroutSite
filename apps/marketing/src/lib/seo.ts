/**
 * SEO helpers — ROLE 5 (00-SHARED-CONTEXT §4 non-negotiables: canonical URLs,
 * meta/OG descriptions, JSON-LD Dataset for data pages, FAQPage where FAQs exist).
 */
import { SITE_URL } from '../site-config';

export interface BreadcrumbItem {
  name: string;
  url: string;
}

/** Absolute URL for a site path (single source of truth = site-config). */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

export function websiteLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Trout — match the hatch & stream conditions, offline',
    url: absoluteUrl('/'),
    description:
      'Offline-first, privacy-free trout fishing tool: match the hatch, stream conditions, and Tennessee stocking schedules. Free, no accounts, no location tracking.',
    isAccessibleForFree: true,
  };
}

export function breadcrumbLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
}

/** Dataset JSON-LD for pages that publish government-derived data tables. */
export function datasetLd(opts: { name: string; description: string; path: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: opts.name,
    description: opts.description,
    url: absoluteUrl(opts.path),
    isAccessibleForFree: true,
    creator: {
      '@type': 'Organization',
      name: 'Trout',
      url: absoluteUrl('/'),
    },
    license: 'https://creativecommons.org/publicdomain/zero/1.0/',
    // Attribution culture (§1.5): data pages always link the official agency as source.
  };
}

export function faqLd(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}
