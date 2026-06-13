import { useState, useCallback, type ReactNode } from 'react';

interface AnimatedDisclosureProps {
  summary: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function AnimatedDisclosure({
  summary,
  children,
  defaultOpen = false,
  className,
}: AnimatedDisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [animated, setAnimated] = useState(false);

  const toggle = useCallback(() => {
    setOpen((v) => !v);
    setAnimated(true);
  }, []);

  return (
    <div
      className={[
        'profile__disclosure',
        open ? 'profile__disclosure--open' : '',
        animated ? 'profile__disclosure--animated' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <button
        type="button"
        className="profile__disclosure-head"
        onClick={toggle}
        aria-expanded={open}
      >
        {summary}
      </button>
      <div className="profile__disclosure-body" aria-hidden={!open}>
        <div className="profile__disclosure-content">{children}</div>
      </div>
    </div>
  );
}
