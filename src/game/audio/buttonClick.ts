import { useEffect } from 'react';
import { useSfx } from './sfxContext';

const BUTTON_SFX_OPT_OUT = 'none';

export function shouldPlayButtonClick(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;

  const button = target.closest('button');
  if (!button) return false;
  if (button.disabled || button.getAttribute('aria-disabled') === 'true') return false;
  if (button.dataset.buttonSfx === BUTTON_SFX_OPT_OUT) return false;

  return true;
}

export function useButtonClickSfx() {
  const { playButton } = useSfx();

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (shouldPlayButtonClick(event.target)) playButton();
    };

    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, [playButton]);
}
