import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Chip } from '@trout/ui';
import { useSettingsContext } from '../lib/settings';
import { SPECIES_LABELS } from '../lib/fishability';
import { clearCachedSnapshots } from '../lib/db';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { useOnline } from '../hooks/useOnline';
import { useTheme } from '../theme/ThemeProvider';
import { colorValue, customColorControls, themes, type CustomColorKey } from '../theme/themes';
import { usePackManager, useStorageEstimate } from '../features/downloads/usePackManager';
import { PackStatus } from '../features/downloads/PackStatus';
import { DownloadButton } from '../features/downloads/DownloadButton';
import { WatchesSettings } from '../features/watches/WatchesSettings';

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

/** Settings (scope 8): units, appearance, default state, reduce-motion,
 *  and — since the packs lane — the downloaded offline packs (ADR 0012). */
export function SettingsPage() {
  const { theme, setTheme, customColors, setCustomColor, resetCustomColors } = useTheme();
  const { settings, update } = useSettingsContext();
  const { canInstall, installed, promptInstall } = useInstallPrompt();
  const [cleared, setCleared] = useState(false);
  const packs = usePackManager();
  const estimate = useStorageEstimate();
  const offline = !useOnline();

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
      <h2 className="section-title">Waters</h2>
      <Card>
        <p className="font-bold">Species mode</p>
        <div className="mt-2 flex gap-2" role="group" aria-label="Fish mode">
          {(['trout', 'all'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              className="option-card focus-ring min-h-[48px] w-40 text-sm"
              aria-pressed={settings.speciesMode === mode}
              onClick={() => update({ speciesMode: mode })}
            >
              {mode === 'trout' ? 'Trout' : 'All fish'}
            </button>
          ))}
        </div>
        {settings.speciesMode === 'all' && (
          <label className="mt-3 block">
            <span className="block text-sm font-bold">Fishability species</span>
            <select
              className="focus-ring mt-1 min-h-[44px] w-full max-w-xs rounded-lg border px-3"
              style={{ borderColor: 'var(--trout-color-border)' }}
              value={settings.speciesFocus}
              onChange={(e) => update({ speciesFocus: e.target.value })}
              aria-label="Fishability species"
              data-testid="settings-species-focus"
            >
              <option value="">Water's cataloged species (auto)</option>
              {(Object.keys(SPECIES_LABELS) as Array<keyof typeof SPECIES_LABELS>).map((sp) => (
                <option key={sp} value={sp}>
                  {SPECIES_LABELS[sp]}
                </option>
              ))}
            </select>
            <span className="page-subtitle mt-1 block">
              Used on waters whose snapshots carry this species; waters without it stay
              unassessed.
            </span>
          </label>
        )}
        <p className="page-subtitle mt-2">
          {settings.speciesMode === 'trout'
            ? 'Trout condition scores on trout waters; warmwater waters stay listed but unscored.'
            : 'Every water, and — where the snapshot has it — the fishability of the species you pick on the map.'}
        </p>
      </Card>

      <h2 className="section-title">Watches</h2>
      {/* ADR 0016: the one server-side feature — pseudonymous watch rules,
      listed and removable here. No accounts; the subscription id lives in
      this browser's localStorage. */}
      <WatchesSettings />

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

      <h2 className="section-title">Downloaded packs</h2>
      <Card>
        <p className="text-sm">
          Offline packs pin a water&apos;s or a trip&apos;s guides, conditions, hatch chart, and map
          tiles in this browser so they open in airplane mode. Download them from a trip or a saved
          water; this page verifies and removes them. Removing a pack deletes only its downloaded
          copies — your logbook, saved waters, trips, and photos are never touched.
        </p>
        {estimate && (
          <p className="muted mt-2 text-sm" data-testid="pack-storage-estimate">
            This device uses {Math.round(estimate.usage / 1e6)} MB of about{' '}
            {Math.round(estimate.quota / 1e6)} MB offered to this site.
          </p>
        )}
        {offline && (
          <p className="muted mt-2 text-sm" role="status">
            You are offline — downloading needs a connection, but verifying and removing do not.
          </p>
        )}
        {packs.manifests === undefined ? (
          <p className="muted mt-3 text-sm" role="status">
            Loading packs…
          </p>
        ) : packs.manifests.length === 0 ? (
          <p className="muted mt-3 text-sm">
            No packs downloaded yet — open a trip or a saved water and choose Download.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-4" aria-label="Downloaded packs">
            {packs.manifests.map((manifest) => (
              <li
                key={manifest.id}
                className="flex flex-col gap-2 border-t pt-3 first:border-0 first:pt-0"
                style={{ borderColor: 'var(--trout-color-border)' }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-sm">{manifest.label}</strong>
                  <Chip>{manifest.kind === 'trip' ? 'Trip pack' : 'Water pack'}</Chip>
                  <div className="ml-auto">
                    <DownloadButton
                      manifest={manifest}
                      busy={packs.busyId === manifest.id}
                      progress={packs.progress}
                      offline={offline}
                      onDownload={(terrain) => void packs.redownload(manifest, terrain)}
                      onEstimate={(terrain, signal) => packs.estimateManifest(manifest, terrain, signal)}
                      onRedownload={(terrain) => void packs.redownload(manifest, terrain)}
                      onCancel={packs.cancelDownload}
                      onVerify={() => void packs.verifyPack(manifest)}
                      onRemove={() => void packs.removePack(manifest)}
                    />
                  </div>
                </div>
                <PackStatus manifest={manifest} />
              </li>
            ))}
          </ul>
        )}
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
