import { describe, expect, it, vi } from 'vitest';
import { FLOW_ARROW_ICON, registerFlowArrowIcon } from '../src/features/map/flowArrows';

/**
 * maplibre-gl's Map.addImage does NOT replace an existing image name — it
 * fires an ErrorEvent ('An image named "flow-arrow" already exists.') and
 * keeps the OLD pixels. The flow-arrow icon is re-registered on every theme
 * swap and selection rebuild, so the guard must route replacements through
 * updateImage. Regression guard for the theme-swap console error.
 */

const ICON = { width: 56, height: 56, data: new Uint8ClampedArray(56 * 56 * 4) };

function mockMap(hasIcon: boolean) {
  return {
    hasImage: vi.fn(() => hasIcon),
    addImage: vi.fn(),
    updateImage: vi.fn(),
  };
}

describe('registerFlowArrowIcon', () => {
  it('adds the icon on first registration (no image yet)', () => {
    const map = mockMap(false);
    registerFlowArrowIcon(map, ICON);
    expect(map.hasImage).toHaveBeenCalledWith(FLOW_ARROW_ICON);
    expect(map.addImage).toHaveBeenCalledTimes(1);
    expect(map.addImage).toHaveBeenCalledWith(FLOW_ARROW_ICON, ICON);
    expect(map.updateImage).not.toHaveBeenCalled();
  });

  it('replaces via updateImage when the icon already exists (theme swap)', () => {
    const map = mockMap(true);
    registerFlowArrowIcon(map, ICON);
    expect(map.hasImage).toHaveBeenCalledWith(FLOW_ARROW_ICON);
    expect(map.updateImage).toHaveBeenCalledTimes(1);
    expect(map.updateImage).toHaveBeenCalledWith(FLOW_ARROW_ICON, ICON);
    // A second addImage on a live name is the exact error this guard exists for.
    expect(map.addImage).not.toHaveBeenCalled();
  });
});
