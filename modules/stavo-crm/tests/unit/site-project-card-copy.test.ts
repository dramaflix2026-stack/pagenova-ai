import { describe, expect, it } from 'vitest';
import {
  SITE_PROJECT_STATUSES,
  type SiteProjectStatus,
} from '@site-kit/types/site-ai';
import { SITE_PROJECT_CARD_COPY } from '@client/lib/site-project-card-copy';

describe('Site list card copy', () => {
  it('shows useful and actionable copy for every supported state', () => {
    for (const status of SITE_PROJECT_STATUSES) {
      const copy = SITE_PROJECT_CARD_COPY[status];
      expect(copy.description.length).toBeGreaterThan(35);
      expect(copy.action.length).toBeGreaterThan(5);
    }
  });
  it('does not pretend drafts or incomplete generations are published', () => {
    const unpublished: SiteProjectStatus[] = [
      'BRIEFING', 'QUEUED', 'GENERATING', 'READY', 'FAILED',
    ];
    for (const status of unpublished) {
      expect(SITE_PROJECT_CARD_COPY[status].description.toLowerCase())
        .not.toContain('site publicado');
    }
  });
  it('makes the difference between reviewing and managing a live publication clear', () => {
    expect(SITE_PROJECT_CARD_COPY.READY.action).toBe('Revisar site');
    expect(SITE_PROJECT_CARD_COPY.PUBLISHED.action).toBe('Gerenciar site');
  });
});
