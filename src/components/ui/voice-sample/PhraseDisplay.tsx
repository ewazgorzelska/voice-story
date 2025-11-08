interface PhraseDisplayProps {
  phrase: string;
}

export default function PhraseDisplay({ phrase }: PhraseDisplayProps) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-2 text-foreground">Verification Phrase</h2>
      <p
        className="text-xl font-medium text-foreground bg-muted/50 dark:bg-muted/30 p-4 rounded-md border"
        aria-live="polite"
      >
        &quot;{phrase}&quot;
      </p>
      <p className="text-sm text-muted-foreground mt-2">
        Please read this phrase clearly when recording your voice sample.
      </p>
    </div>
  );
}
