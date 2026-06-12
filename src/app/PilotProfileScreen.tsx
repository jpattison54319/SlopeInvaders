import { motion } from 'framer-motion';
import { ScreenChrome } from './ScreenChrome';
import { zones } from '../game/campaign/zones';
import { planetSrcForZone } from '../game/campaign/planets';
import { BADGES, type BadgeCategory, type BadgeDef } from '../game/campaign/badges';
import { rankForXp } from '../game/campaign/xp';
import { assets, icons, sprites } from '../assets/assetMap';
import type { CampaignProgress } from './useCampaignProgress';
import { TacticalPanel, TacticalProgress } from '../game/components/TacticalPanel';
import type { ArcadeRecords } from '../game/arcade/types';
import { staggerContainer, staggerItem, fadeInUp } from './animation';

interface PilotProfileScreenProps {
  progress: CampaignProgress;
  backLabel?: string;
  onBack: () => void;
  onOpenSettings: () => void;
  arcadeRecords?: ArcadeRecords;
}

const BADGE_GROUPS: ReadonlyArray<{ category: BadgeCategory; title: string; blurb: string }> = [
  { category: 'concept', title: 'Zone Mastery', blurb: 'One per planet liberated.' },
  { category: 'performance', title: 'Sharpshooting', blurb: 'Precision flying and trick shots.' },
  { category: 'growth', title: 'Growth', blurb: 'Bouncing back and beating your own record.' },
];

function badgeEmblem(badge: BadgeDef): string {
  if (badge.zoneId) return planetSrcForZone(badge.zoneId);
  return badge.category === 'growth' ? sprites.heartFull : assets.bolt;
}

function formatPlaytime(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (totalMinutes > 0) return `${minutes}m`;
  return '<1m';
}

function formatDate(epochMs: number): string {
  return new Date(epochMs).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function PilotProfileScreen({
  progress,
  backLabel = 'Back',
  onBack,
  onOpenSettings,
  arcadeRecords,
}: PilotProfileScreenProps) {
  const profile = progress.getProfileStats();
  const earnedBadges = progress.getEarnedBadges();
  const totalXp = progress.getTotalXp();
  const rank = rankForXp(totalXp);
  const rankProgress =
    rank.nextMin === null ? 1 : (totalXp - rank.min) / (rank.nextMin - rank.min);

  const accuracy =
    profile.totalShots > 0 ? Math.round((profile.totalHits / profile.totalShots) * 100) : 100;
  const playableZones = zones.filter((z) => z.status === 'available' && z.levels.length > 0);
  const earnedStarsTotal = playableZones.reduce(
    (sum, zone) => sum + zone.levels.reduce((s, level) => s + progress.getLevelStars(level.id), 0),
    0,
  );
  const totalStars = playableZones.reduce((sum, zone) => sum + zone.levels.length * 3, 0);
  const earnedBadgeCount = BADGES.filter((b) => b.id in earnedBadges).length;

  return (
    <ScreenChrome onBack={onBack} backLabel={backLabel} onOpenSettings={onOpenSettings}>
      <section className="profile" aria-labelledby="profile-title">
        <motion.div variants={fadeInUp} initial="initial" animate="animate">
          <TacticalPanel className="pilot-card" tone="gold">
            <div className="pilot-card__avatar" aria-hidden>
              <img src={icons.pilot} alt="" draggable={false} />
            </div>
            <div className="pilot-card__id">
              <span className="menu__panel-label">Pilot Profile</span>
              <h2 id="profile-title" className="pilot-card__rank">
                {rank.name}
              </h2>
              <TacticalProgress
                value={Math.round(rankProgress * 100)}
                max={100}
                tone="gold"
                label={
                  rank.nextMin === null
                    ? 'Top rank reached'
                    : `${totalXp} of ${rank.nextMin} XP toward the next rank`
                }
              />
              <span className="pilot-card__xp-label">
                {rank.nextMin === null
                  ? `${totalXp} XP · Top rank reached`
                  : `${totalXp} / ${rank.nextMin} XP to next rank`}
              </span>
            </div>
            <ul className="pilot-card__chips">
              <li>
                <strong>{earnedStarsTotal}</strong>
                <span>of {totalStars} ★</span>
              </li>
              <li>
                <strong>{earnedBadgeCount}</strong>
                <span>of {BADGES.length} badges</span>
              </li>
              <li>
                <strong>{accuracy}%</strong>
                <span>accuracy</span>
              </li>
            </ul>
          </TacticalPanel>
        </motion.div>

        {BADGE_GROUPS.map((group, gi) => {
          const groupBadges = BADGES.filter((b) => b.category === group.category);
          if (groupBadges.length === 0) return null;
          const earnedInGroup = groupBadges.filter((b) => b.id in earnedBadges).length;
          return (
            <motion.section
              key={group.category}
              className="profile__section"
              aria-label={group.title}
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.1 + gi * 0.08 }}
            >
              <header className="profile__section-head">
                <h3>{group.title}</h3>
                <span className="profile__section-meta">
                  {earnedInGroup} / {groupBadges.length} · {group.blurb}
                </span>
              </header>
              <motion.ul
                className="badge-grid"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                {groupBadges.map((badge) => {
                  const earnedAt = earnedBadges[badge.id];
                  const earned = earnedAt !== undefined;
                  return (
                    <motion.li
                      key={badge.id}
                      className={`badge-card ${earned ? 'badge-card--earned' : 'badge-card--locked'}`}
                      variants={staggerItem}
                    >
                      <span className="badge-card__emblem" aria-hidden>
                        <img src={badgeEmblem(badge)} alt="" draggable={false} />
                      </span>
                      <span className="badge-card__text">
                        <span className="badge-card__name">{badge.name}</span>
                        <span className="badge-card__desc">
                          {earned ? badge.description : `Next mission: ${badge.description}`}
                        </span>
                        {earned && (
                          <span className="badge-card__date">Earned {formatDate(earnedAt)}</span>
                        )}
                      </span>
                    </motion.li>
                  );
                })}
              </motion.ul>
            </motion.section>
          );
        })}

        <motion.section
          className="profile__section"
          aria-label="Planet mastery"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.3 }}
        >
          <header className="profile__section-head">
            <h3>Planet Mastery</h3>
            <span className="profile__section-meta">
              {earnedStarsTotal} / {totalStars} ★ · Replay any level to raise its stars.
            </span>
          </header>
          <motion.ul
            className="profile__zones"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {playableZones.map((zone) => {
              const earned = zone.levels.reduce(
                (sum, level) => sum + progress.getLevelStars(level.id),
                0,
              );
              const total = zone.levels.length * 3;
              return (
                <motion.li key={zone.id} className="profile__zone-row" variants={staggerItem}>
                  <img
                    className="profile__zone-planet"
                    src={planetSrcForZone(zone.id)}
                    alt=""
                    draggable={false}
                  />
                  <span className="profile__zone-text">
                    <span className="profile__zone-name">
                      {zone.number === 0 ? zone.name : `Zone ${zone.number}: ${zone.name}`}
                    </span>
                    <span
                      className="profile__zone-bar"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={total}
                      aria-valuenow={earned}
                      aria-label={`${earned} of ${total} stars`}
                    >
                      <span style={{ width: `${total > 0 ? (earned / total) * 100 : 0}%` }} />
                    </span>
                  </span>
                  <span className="profile__zone-stars">
                    {earned} / {total} ★
                  </span>
                </motion.li>
              );
            })}
          </motion.ul>
        </motion.section>

        <motion.section
          className="profile__section"
          aria-label="Flight log"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.4 }}
        >
          <header className="profile__section-head">
            <h3>Flight Log</h3>
            <span className="profile__section-meta">Lifetime totals across every mission.</span>
          </header>
          <motion.ul
            className="profile__stats"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <motion.li variants={staggerItem}>
              <strong>{profile.levelsCompleted}</strong>
              <span>Missions completed</span>
            </motion.li>
            <motion.li variants={staggerItem}>
              <strong>{accuracy}%</strong>
              <span>Accuracy</span>
            </motion.li>
            <motion.li variants={staggerItem}>
              <strong>{profile.totalShots}</strong>
              <span>Shots fired</span>
            </motion.li>
            <motion.li variants={staggerItem}>
              <strong>{formatPlaytime(profile.totalPlaytimeMs)}</strong>
              <span>Time in the cockpit</span>
            </motion.li>
            {profile.firstPlayedAt !== null && (
              <motion.li variants={staggerItem}>
                <strong>{formatDate(profile.firstPlayedAt)}</strong>
                <span>First flight</span>
              </motion.li>
            )}
            {profile.lastPlayedAt !== null && (
              <motion.li variants={staggerItem}>
                <strong>{formatDate(profile.lastPlayedAt)}</strong>
                <span>Latest flight</span>
              </motion.li>
            )}
          </motion.ul>
        </motion.section>

        <motion.section
          className="profile__section"
          aria-label="Arcade records"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.5 }}
        >
          <header className="profile__section-head">
            <h3>Arcade Records</h3>
            <span className="profile__section-meta">
              Personal endless-run records. Arcade does not award campaign XP or stars.
            </span>
          </header>
          <motion.ul
            className="profile__stats profile__stats--arcade"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <motion.li variants={staggerItem}>
              <strong>{arcadeRecords?.highScore ?? 0}</strong>
              <span>High score</span>
            </motion.li>
            <motion.li variants={staggerItem}>
              <strong>{arcadeRecords?.bestWave || '—'}</strong>
              <span>Best wave</span>
            </motion.li>
            <motion.li variants={staggerItem}>
              <strong>{arcadeRecords?.longestStreak || '—'}</strong>
              <span>Longest streak</span>
            </motion.li>
            <motion.li variants={staggerItem}>
              <strong>{arcadeRecords?.totalRuns ?? 0}</strong>
              <span>Runs flown</span>
            </motion.li>
            <motion.li variants={staggerItem}>
              <strong>{arcadeRecords?.totalDestroyed ?? 0}</strong>
              <span>Asteroids intercepted</span>
            </motion.li>
          </motion.ul>
        </motion.section>
      </section>
    </ScreenChrome>
  );
}