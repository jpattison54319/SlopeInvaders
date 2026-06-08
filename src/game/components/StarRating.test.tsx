/**
 * @vitest-environment jsdom
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { StarRating } from './StarRating';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  host.remove();
});

describe('StarRating', () => {
  it('renders three 8-bit stars with filled and empty states', async () => {
    await act(async () => {
      root.render(<StarRating stars={2} label="Level 1 stars" />);
    });

    const rating = host.querySelector('.star-rating');
    const stars = Array.from(host.querySelectorAll('.star-rating__star'));

    expect(rating?.getAttribute('aria-label')).toBe('Level 1 stars: 2 of 3 stars');
    expect(stars).toHaveLength(3);
    expect(stars.filter((star) => star.classList.contains('star-rating__star--filled'))).toHaveLength(2);
    expect(stars.filter((star) => star.classList.contains('star-rating__star--empty'))).toHaveLength(1);
    expect(stars.map((star) => star.classList.contains('star-rating__star--center'))).toEqual([
      false,
      true,
      false,
    ]);
  });
});
