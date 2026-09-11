import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '@trout/ui';
import { useSettingsContext } from '../lib/settings';
import { clearCachedSnapshots } from '../lib/db';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { V1_STATES } from '../lib/endpoints';
import { useTheme } from '../theme/ThemeProvider';
import { colorValue, customColorControls, themes, type CustomColorKey } from '../theme/themes';

function CustomColorField({
  theme,
  control,
  onChange,
}: {
  theme: (typeof themes)[keyof typeof themes];
  control: (typeof customColorControls)[number];
  onChange: (key: CustomColorKey, value: string) => void;
}) {
  return (
    <label className="color-control">
      <span>
        <strong>{control.label}</strong>
        <small>{control.description}</small>
      </span>
      <input
        type="color"
        value={colorValue(theme, control.key)}
        aria-label={`${control.label} color`}
        onChange={(event) => onChange(control.key, event.target.value)}
      />
    </label>
  );
}

/** Settings (scope 8): units, appearance, default state, and reduce-motion. */
export function SettingsPage() {
  const { theme, setTheme, customColors, setCustomColor, resetCustomColors } = useTheme();
  const { settings, update } = useSettingsContext();
  const { canInstall, installed, promptInstall } = useInstallPrompt();
  const [cleared, setCleared] = useState(false);

  return (
    <main className="page">
      <h1 className="page-title">Settings</h1>
      <p className="page-subtitle mt-1">
        Preferences live in this browser. No cookies, no accounts, no server.
      </p>

      <h2 className="section-title">Field appearance</h2>
      <Card>
        <p className="page-subtitle">
          One palette for the map and every page. Saved on this device.
        </p>
        <div className="theme-grid mt-4">
          {Object.values(themes).map((preset) => (
            <button
              key={preset.id}
              className="option-card"
              aria-pressed={theme.id === preset.id}
              onClick={() => setTheme(preset.id)}
            >
              <span
                className="h-8 w-8 rounded-full border"
                style={{ background: preset.map.paperRaised, borderColor: preset.map.hairline }}
              />
              {preset.name}
            </button>
          ))}
        </div>
        <p className="page-subtitle mt-4">
          Start with a preset, then tune the colors below. Your choices stay on this device and do
          not change the shared site.
        </p>
      </Card>

      <h2 className="section-title">Custom colors</h2>
      <Card>
        <div className="custom-color-grid">
          {customColorControls.map((control) => (
            <CustomColorField
              key={control.key}
              theme={theme}
              control={control}
              onChange={setCustomColor}
            />
          ))}
        </div>
        <div className="custom-color-actions">
          <Button
            variant="secondary"
            onClick={resetCustomColors}
            disabled={!Object.keys(customColors).length}
          >
            Reset {theme.name} colors
          </Button>
          <span className="page-subtitle">
            High contrast is a good starting point for low vision or color-vision differences.
          </span>
        </div>
      </Card>
      <h2 className="section-title">Units</h2>
      <Card>
        <p className="text-sm font-bold">Water temperature</p>
        <div className="mt-2 flex gap-2" role="group" aria-label="Temperature unit">
          {(['F', 'C'] as const).map((unit) => (
            <button
              key={unit}
              type="button"
              className="option-card focus-ring min-h-[48px] w-28 text-sm"
              aria-pressed={settings.tempUnit === unit}
              onClick={() => update({ tempUnit: unit })}
            >
              °{unit}
            </button>
          ))}
        </div>
        <p className="page-subtitle mt-2">
          Flow is always shown in cfs — gauge data is reported that way.
        </p>
      </Card>

      <h2 className="section-title">Default state</h2>
      <Card>
        <select
          className="focus-ring min-h-[48px] w-full max-w-xs rounded-lg border px-3"
          style={{ borderColor: 'var(--trout-color-border)' }}
          value={settings.defaultState}
          onChange={(e) => update({ defaultState: e.target.value })}
          aria-label="Default state"
        >
          {V1_STATES.map((s) => (
            <option key={s} value={s}>
              {s} (available now)
            </option>
          ))}
          <option disabled>More states — v2</option>
        </select>
      </Card>

      <h2 className="section-title">Accessibility</h2>
      <Card>
        <button
          type="button"
          className="option-card focus-ring min-h-[56px] text-left"
          aria-pressed={settings.reduceMotion}
          onClick={() => update({ reduceMotion: !settings.reduceMotion })}
        >
          <span>
            <span className="block font-bold">Reduce motion</span>
            <span
              className="block text-xs font-normal"
              style={{ color: 'var(--trout-color-text-muted)' }}
            >
              Disables the wizard's staggered animations. Your OS preference is respected too.
            </span>
          </span>
          <span
            className="ml-3 font-extrabold"
            style={{
              color: settings.reduceMotion
                ? 'var(--trout-color-primary)'
                : 'var(--trout-color-text-muted)',
            }}
          >
            {settings.reduceMotion ? 'ON' : 'OFF'}
          </span>
        </button>
      </Card>

      <h2 className="section-title">Install</h2>
      <Card>
        {installed ? (
          <p className="text-sm font-bold" style={{ color: 'var(--trout-color-primary)' }}>
            ✓ Installed — Trout runs from your home screen and works offline.
          </p>
        ) : canInstall ? (
          <>
            <p className="text-sm">
              Install the app for a full-screen, offline experience. Honest copy: it adds a shortcut
              and caches data on this device — nothing else, no background tricks, no tracking.
            </p>
            <Button className="focus-ring mt-3" onClick={() => void promptInstall()}>
              Install Trout
            </Button>
          </>
        ) : (
          <p className="text-sm" style={{ color: 'var(--trout-color-text-muted)' }}>
            Use your browser's <strong>Install app</strong> / <strong>Add to Home Screen</strong>{' '}
            menu option. iOS: Share → Add to Home Screen.
          </p>
        )}
      </Card>

      <h2 className="section-title">Cached data</h2>
      <Card>
        <p className="text-sm">
          Hatch charts, conditions, and stocking snapshots are cached on this device so they work
          offline. Clearing them does not touch your logbook.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <Button
            variant="secondary"
            className="focus-ring"
            onClick={() => {
              void clearCachedSnapshots().then(() => setCleared(true));
            }}
          >
            Clear cached snapshots
          </Button>
          {cleared && (
            <span
              className="text-sm font-bold"
              style={{ color: 'var(--trout-color-primary)' }}
              role="status"
            >
              Cleared ✓
            </span>
          )}
        </div>
      </Card>

      <p className="mt-6 text-sm">
        Read the full privacy story in{' '}
        <Link to="/about" className="focus-ring font-bold underline">
          About &amp; Privacy
        </Link>
        .
      </p>
    </main>
  );
}
