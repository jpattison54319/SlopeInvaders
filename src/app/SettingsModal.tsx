import { icons } from '../assets/assetMap';
import { Modal } from '../game/components/Modal';

interface SettingsModalProps {
  musicVolume: number;
  musicMuted: boolean;
  sfxVolume: number;
  sfxMuted: boolean;
  activeTrack: 'menu' | 'game';
  onChangeMusicVolume: (value: number) => void;
  onChangeMusicMuted: (value: boolean) => void;
  onChangeSfxVolume: (value: number) => void;
  onChangeSfxMuted: (value: boolean) => void;
  onClose: () => void;
}

interface VolumeControlProps {
  label: string;
  ariaLabel: string;
  volume: number;
  muted: boolean;
  muteLabel: string;
  unmuteLabel: string;
  onChangeVolume: (value: number) => void;
  onChangeMuted: (value: boolean) => void;
}

function VolumeControl({
  label,
  ariaLabel,
  volume,
  muted,
  muteLabel,
  unmuteLabel,
  onChangeVolume,
  onChangeMuted,
}: VolumeControlProps) {
  const percent = Math.round(volume * 100);
  return (
    <div className="settings-group">
      <label className="volume-control">
        <span>
          {label} <strong>{percent}%</strong>
        </span>
        <input
          aria-label={ariaLabel}
          type="range"
          min="0"
          max="100"
          step="5"
          value={percent}
          onInput={(event) => onChangeVolume(Number(event.currentTarget.value) / 100)}
          onChange={(event) => onChangeVolume(Number(event.currentTarget.value) / 100)}
        />
      </label>
      <button
        type="button"
        className="settings-panel__mute"
        aria-pressed={muted}
        onClick={() => onChangeMuted(!muted)}
      >
        {muted ? unmuteLabel : muteLabel}
      </button>
    </div>
  );
}

export function SettingsModal({
  musicVolume,
  musicMuted,
  sfxVolume,
  sfxMuted,
  activeTrack,
  onChangeMusicVolume,
  onChangeMusicMuted,
  onChangeSfxVolume,
  onChangeSfxMuted,
  onClose,
}: SettingsModalProps) {
  const trackLabel = activeTrack === 'game' ? 'In-game music' : 'Menu music';

  return (
    <Modal title="Settings" icon="settings" onClose={onClose}>
      <div className="settings-panel">
        <div className="settings-panel__track">
          <img src={icons.music} alt="" draggable={false} />
          <div>
            <span>Now Playing</span>
            <strong>{trackLabel}</strong>
          </div>
        </div>

        <VolumeControl
          label="Music Volume"
          ariaLabel="Music volume"
          volume={musicVolume}
          muted={musicMuted}
          muteLabel="Mute music"
          unmuteLabel="Unmute music"
          onChangeVolume={onChangeMusicVolume}
          onChangeMuted={onChangeMusicMuted}
        />

        <VolumeControl
          label="Sound FX Volume"
          ariaLabel="Sound effects volume"
          volume={sfxVolume}
          muted={sfxMuted}
          muteLabel="Mute sound effects"
          unmuteLabel="Unmute sound effects"
          onChangeVolume={onChangeSfxVolume}
          onChangeMuted={onChangeSfxMuted}
        />
      </div>
    </Modal>
  );
}
