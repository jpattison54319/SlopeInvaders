import { icons } from '../assets/assetMap';
import { Modal } from '../game/components/Modal';

interface SettingsModalProps {
  volume: number;
  muted: boolean;
  activeTrack: 'menu' | 'game';
  onChangeVolume: (value: number) => void;
  onChangeMuted: (value: boolean) => void;
  onClose: () => void;
}

export function SettingsModal({
  volume,
  muted,
  activeTrack,
  onChangeVolume,
  onChangeMuted,
  onClose,
}: SettingsModalProps) {
  const volumePercent = Math.round(volume * 100);
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

        <label className="volume-control">
          <span>
            Music Volume <strong>{volumePercent}%</strong>
          </span>
          <input
            aria-label="Music volume"
            type="range"
            min="0"
            max="100"
            step="5"
            value={volumePercent}
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
          <img src={icons.music} alt="" draggable={false} />
          {muted ? 'Unmute music' : 'Mute music'}
        </button>
      </div>
    </Modal>
  );
}
