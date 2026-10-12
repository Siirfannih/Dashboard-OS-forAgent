// Ledger API shape (12 Okt): checkpoint is an object and job fields sit under payload.input.
import { describe, expect, it } from 'vitest';
import { prospectOf, stepLabel, summaryOf, taskOf } from '../screens/pipeline/jobs';

describe('pipeline jobs', () => {
  it('checkpoint objek tidak membuat crash', () => {
    expect(stepLabel({ stage: 'model_inflight' })).toBe('langkah model inflight');
    expect(stepLabel({})).toBeNull();
    expect(stepLabel([])).toBeNull();
    expect(stepLabel('{"step":"cek"}')).toBe('langkah cek');
    expect(stepLabel(null)).toBeNull();
  });

  it('nama prospek dan jenis tugas dibaca dari payload.input, bukan domain', () => {
    expect(prospectOf({ domain: 'sales', input: { business_name: 'Klinik A', task_kind: 'maps_lookup' } })).toBe('Klinik A');
    expect(prospectOf({ domain: 'sales', input: { query: 'klinik gigi' } })).toBe('Pencarian: klinik gigi');
    expect(prospectOf({ domain: 'sales' })).toBeNull();
    expect(taskOf({ input: { task_kind: 'maps_search' } })).toBe('Cari tempat di Google Maps');
    expect(taskOf({ input: { task_kind: 'baru' } })).toBe('baru');
  });

  it('ringkasan hasil dari result objek atau string', () => {
    expect(summaryOf({ result: { summary: 'ok' } })).toBe('ok');
    expect(summaryOf({ result: '{"summary":"s"}' })).toBe('s');
    expect(summaryOf({ result: null })).toBeNull();
  });
});
