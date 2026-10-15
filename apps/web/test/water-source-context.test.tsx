import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WaterSourceContext } from '../src/components/WaterSourceContext';
import type { Stream, ConditionSnapshot } from '@trout/contracts';

describe('source context presentation', () => {
  it('labels editorial, reference and historical values without presenting them as live local measurements', () => {
    const stream: Stream = { id: 'river', name: 'River', stateId: 'TN', regionId: 'tn-middle-caney-fork',
      waterbodyType: 'river', gaugeIds: ['03538830', 'reference'], stockingProgram: false,
      idealFlow: [{ min: 100, max: 800, unit: 'cfs' }], idealFlowSource: 'editorial', officialSources: [],
      gaugePolicy: { primary: { cfs: '03538830' }, references: [{ gaugeId: 'reference', note: 'Downstream of the fishing reach' }], note: 'Use the local station' } };
    const snapshot: ConditionSnapshot = { streamId: 'river', readings: [], score: { value: 0, reasons: [], assessed: false },
      fetchedAt: '2026-10-15T00:00:00Z', nextExpectedUpdate: '2026-10-15T01:00:00Z',
      historicalFlow: { gaugeId: '03538830', month: 10, p25: 4, median: 22, p75: 52, sampleCount: 15,
        unit: 'cfs', basis: 'USGS approved month-of-year discharge normals', sourceUrl: 'https://api.waterdata.usgs.gov/',
        retrievedAt: '2026-10-15T00:00:00Z', computationId: 'id', parentTimeSeriesId: 'id' } };
    render(<WaterSourceContext stream={stream} snapshot={snapshot} />);
    expect(screen.getByText(/not been validated as ideal fishing/)).toBeInTheDocument();
    expect(screen.getByText(/Historical October flow/)).toBeInTheDocument();
    expect(screen.getByText(/Reference gauges \(excluded/)).toBeInTheDocument();
    expect(screen.getByText(/No current reference flow available/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'USGS historical source' })).toHaveAttribute('href', 'https://api.waterdata.usgs.gov/');
  });
});
