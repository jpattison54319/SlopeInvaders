import { useCallback, useMemo, useState } from 'react';
import { zones } from '../game/campaign/zones';
import type { Zone } from '../game/campaign/types';

const STORAGE_KEY = 'slope-invaders:campaign-progress';

function loadCompleted(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { completedLevels?: string[] };
    return Array.isArray(parsed.completedLevels) ? parsed.completedLevels : [];
  } catch {
    return [];
  }
}

function saveCompleted(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ completedLevels: ids }));
  } catch {
    /* ignore (private mode / unavailable storage) */
  }
}

const availableZones = zones.filter((z) => z.status === 'available');

export interface CampaignProgress {
  isLevelComplete: (levelId: string) => boolean;
  isLevelUnlocked: (zone: Zone, index: number) => boolean;
  isZoneUnlocked: (zoneId: string) => boolean;
  isZoneComplete: (zoneId: string) => boolean;
  zoneClearedCount: (zoneId: string) => number;
  markComplete: (levelId: string) => void;
  resetProgress: () => void;
}

/**
 * Tracks completed campaign levels in localStorage and derives the
 * sequential-unlock rules: a level unlocks when its predecessor is complete; a
 * zone unlocks when the previous available zone is fully complete.
 */
export function useCampaignProgress(): CampaignProgress {
  const [completed, setCompleted] = useState<Set<string>>(() => new Set(loadCompleted()));

  const markComplete = useCallback((levelId: string) => {
    setCompleted((prev) => {
      if (prev.has(levelId)) return prev;
      const next = new Set(prev);
      next.add(levelId);
      saveCompleted([...next]);
      return next;
    });
  }, []);

  const resetProgress = useCallback(() => {
    setCompleted(new Set());
    saveCompleted([]);
  }, []);

  return useMemo<CampaignProgress>(() => {
    const isLevelComplete = (levelId: string) => completed.has(levelId);

    const isZoneComplete = (zoneId: string) => {
      const zone = zones.find((z) => z.id === zoneId);
      return !!zone && zone.levels.length > 0 && zone.levels.every((l) => completed.has(l.id));
    };

    const isZoneUnlocked = (zoneId: string) => {
      const idx = availableZones.findIndex((z) => z.id === zoneId);
      if (idx < 0) return false; // not an available zone
      if (idx === 0) return true; // tutorial is always open
      return availableZones[idx - 1].levels.every((l) => completed.has(l.id));
    };

    const isLevelUnlocked = (zone: Zone, index: number) => {
      if (!isZoneUnlocked(zone.id)) return false;
      if (index === 0) return true;
      return completed.has(zone.levels[index - 1].id);
    };

    const zoneClearedCount = (zoneId: string) => {
      const zone = zones.find((z) => z.id === zoneId);
      return zone ? zone.levels.filter((l) => completed.has(l.id)).length : 0;
    };

    return {
      isLevelComplete,
      isLevelUnlocked,
      isZoneUnlocked,
      isZoneComplete,
      zoneClearedCount,
      markComplete,
      resetProgress,
    };
  }, [completed, markComplete, resetProgress]);
}
