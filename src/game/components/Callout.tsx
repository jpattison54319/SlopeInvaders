interface CalloutProps {
  text: string;
}

/** A teaching banner shown above the board (tutorial hints / level guidance). */
export function Callout({ text }: CalloutProps) {
  return (
    <div className="callout" role="note">
      <span className="callout__badge" aria-hidden>
        ?
      </span>
      <p>{text}</p>
    </div>
  );
}
