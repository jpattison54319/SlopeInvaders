import { useCallback, useState } from 'react';
import {
  loadArcadeRecords,
  mergeArcadeRun,
  saveArcadeRecords,
} from './records';
import type { ArcadeRecords, ArcadeRunStats } from './types';

export interface ArcadeRecordsApi {
  records: ArcadeRecords;
  recordRun: (run: ArcadeRunStats) => void;
}

export function useArcadeRecords(): ArcadeRecordsApi {
  const [records, setRecords] = useState<ArcadeRecords>(() => loadArcadeRecords());
  const recordRun = useCallback((run: ArcadeRunStats) => {
    setRecords((current) => {
      const next = mergeArcadeRun(current, run);
      saveArcadeRecords(next);
      return next;
    });
  }, []);
  return { records, recordRun };
}
