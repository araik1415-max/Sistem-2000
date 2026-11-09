import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  moveSection,
  toggleSection,
  exportSiteConfig,
  importSiteConfig,
  DEFAULT_SITE_CONFIG,
  THEMES,
} from './builder';
import { SiteSectionConfig } from '../types';

describe('Site Builder Utilities', () => {
  it('correctly provides all 6 theme presets', () => {
    assert.ok(THEMES.emerald);
    assert.ok(THEMES.sapphire);
    assert.ok(THEMES.amber);
    assert.ok(THEMES.amethyst);
    assert.ok(THEMES.crimson);
    assert.ok(THEMES.cyber);
  });

  it('moves section down and up accurately', () => {
    const list: SiteSectionConfig[] = [
      { id: 'hero_banner', nameHy: 'A', nameRu: 'A', enabled: true },
      { id: 'balance_card', nameHy: 'B', nameRu: 'B', enabled: true },
      { id: 'catalog', nameHy: 'C', nameRu: 'C', enabled: true },
    ];

    // Move first item down
    const movedDown = moveSection(list, 0, 'down');
    assert.equal(movedDown[0].id, 'balance_card');
    assert.equal(movedDown[1].id, 'hero_banner');

    // Move second item up
    const movedUp = moveSection(movedDown, 1, 'up');
    assert.equal(movedUp[0].id, 'hero_banner');
    assert.equal(movedUp[1].id, 'balance_card');

    // Top boundary check: move 0 up should be no-op
    const noOpUp = moveSection(list, 0, 'up');
    assert.equal(noOpUp[0].id, 'hero_banner');

    // Bottom boundary check: move last item down should be no-op
    const noOpDown = moveSection(list, 2, 'down');
    assert.equal(noOpDown[2].id, 'catalog');
  });

  it('toggles section visibility', () => {
    const list: SiteSectionConfig[] = [
      { id: 'hero_banner', nameHy: 'A', nameRu: 'A', enabled: true },
      { id: 'balance_card', nameHy: 'B', nameRu: 'B', enabled: false },
    ];

    const toggled = toggleSection(list, 'hero_banner');
    assert.equal(toggled[0].enabled, false);

    const reToggled = toggleSection(toggled, 'balance_card');
    assert.equal(reToggled[1].enabled, true);
  });

  it('exports and imports site config JSON without loss', () => {
    const exportedJson = exportSiteConfig(DEFAULT_SITE_CONFIG);
    assert.ok(exportedJson.includes('emerald'));
    assert.ok(exportedJson.includes('hero_banner'));

    const imported = importSiteConfig(exportedJson);
    assert.equal(imported.success, true);
    assert.ok(imported.config);
    assert.equal(imported.config?.themeId, 'emerald');
    assert.equal(imported.config?.sections.length, DEFAULT_SITE_CONFIG.sections.length);
  });

  it('handles corrupted or invalid JSON import gracefully', () => {
    const invalid = importSiteConfig('{ bad json }');
    assert.equal(invalid.success, false);
    assert.ok(invalid.error);

    const missingSections = importSiteConfig('{"version": 1}');
    assert.equal(missingSections.success, false);
  });
});
