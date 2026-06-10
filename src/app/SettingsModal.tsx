import { useState } from 'react';
import { icons } from '../assets/assetMap';
import { Modal } from '../game/components/Modal';
import { ControlsSettings } from './ControlsSettings';
import type { KeyBindings } from '../game/controls/keybindings';
import { TacticalButton } from '../game/components/TacticalButton';

interface SettingsModalProps {
  musicVolume: number;
  musicMuted: boolean;
  sfxVolume: number;
  sfxMuted: boolean;
  activeTrack: 'menu' | 'game';
  keyBindings: KeyBindings;
  onChangeMusicVolume: (value: number) => void;
  onChangeMusicMuted: (value: boolean) => void;
  onChangeSfxVolume: (value: number) => void;
  onChangeSfxMuted: (value: boolean) => void;
  onChangeKeyBindings: (value: KeyBindings) => void;
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
        className="settings-panel__mute settings-switch"
        aria-pressed={muted}
        onClick={() => onChangeMuted(!muted)}
      >
        <span className="settings-switch__track" aria-hidden="true">
          <span />
        </span>
        <span>{muted ? unmuteLabel : muteLabel}</span>
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
  keyBindings,
  onChangeMusicVolume,
  onChangeMusicMuted,
  onChangeSfxVolume,
  onChangeSfxMuted,
  onChangeKeyBindings,
  onClose,
}: SettingsModalProps) {
  const [view, setView] = useState<'main' | 'controls'>('main');
  const trackLabel = activeTrack === 'game' ? 'In-game music' : 'Menu music';

  return (
    <Modal title={view === 'controls' ? 'Controls' : 'Settings'} icon="settings" onClose={onClose}>
      {view === 'controls' ? (
        <ControlsSettings
          keyBindings={keyBindings}
          onChange={onChangeKeyBindings}
          onBack={() => setView('main')}
        />
      ) : (
        <div className="settings-panel settings-panel--tactical">
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

          <div className="settings-group">
            <TacticalButton
              asset="settings"
              label="Change Controls"
              text="Change Controls"
              size="large"
              onClick={() => setView('controls')}
            />
          </div>
        </div>
      )}
    </Modal>
  );
}
