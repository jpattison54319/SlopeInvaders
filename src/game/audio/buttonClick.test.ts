/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import { shouldPlayButtonClick } from './buttonClick';

describe('shouldPlayButtonClick', () => {
  it('plays for normal buttons and nested button content', () => {
    const button = document.createElement('button');
    const icon = document.createElement('span');
    button.append(icon);

    expect(shouldPlayButtonClick(button)).toBe(true);
    expect(shouldPlayButtonClick(icon)).toBe(true);
  });

  it('does not play for disabled buttons or buttons opted out of global click sfx', () => {
    const disabled = document.createElement('button');
    disabled.disabled = true;

    const fire = document.createElement('button');
    fire.dataset.buttonSfx = 'none';

    expect(shouldPlayButtonClick(disabled)).toBe(false);
    expect(shouldPlayButtonClick(fire)).toBe(false);
  });

  it('ignores non-button clicks', () => {
    expect(shouldPlayButtonClick(document.createElement('div'))).toBe(false);
  });
});
