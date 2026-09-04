import { Segmented } from '../../components/ui/Segmented';

/** Legacy standalone mode toggle — the map page now lives in MapControls,
 *  but any other surface gets the same animated segmented control. */
export function MapModeControl({ mode, value, onChange }: { mode?: 'conditions' | 'hatches'; value?: 'conditions' | 'hatches'; onChange: (m: 'conditions' | 'hatches') => void }) {
  const v = mode ?? value ?? 'conditions';
  return (
    <Segmented
      ariaLabel="Map mode"
      value={v}
      onChange={onChange}
      options={[{ value: 'conditions', label: 'Conditions' }, { value: 'hatches', label: 'Hatches' }]}
    />
  );
}
