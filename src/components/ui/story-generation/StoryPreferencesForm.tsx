import { useId, type ChangeEvent } from "react";
import { cn } from "@/lib/utils";
import type { StoryPreferencesFormProps, StoryGenerationPreferencesDto } from "@/types";

const baseInputClasses =
  "block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const labelClasses = "flex items-center gap-2 text-sm font-medium text-foreground";
const helperTextClasses = "mt-1 text-xs text-muted-foreground";
const errorTextClasses = "mt-1 text-xs font-medium text-destructive";

const clampValue = (value: number) => {
  if (Number.isNaN(value)) {
    return value;
  }
  return Math.round(value);
};

const getUpdatedPreferences = (
  current: StoryGenerationPreferencesDto,
  field: keyof StoryGenerationPreferencesDto,
  value: number
) => ({
  ...current,
  [field]: clampValue(value),
});

const StoryPreferencesForm = ({ values, errors, onChange }: StoryPreferencesFormProps) => {
  const childAgeId = useId();
  const minDurationId = useId();
  const maxDurationId = useId();

  const handleNumberChange =
    (field: "child_age" | "duration_min_minutes" | "duration_max_minutes") =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value;
      const parsed = Number.parseInt(raw, 10);
      const nextValue = Number.isNaN(parsed) ? NaN : parsed;

      onChange(getUpdatedPreferences(values, field, nextValue));
    };

  return (
    <fieldset className="space-y-6 rounded-lg border border-border/70 bg-card/60 px-4 py-5 shadow-sm sm:px-6 sm:py-6">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Story preferences
      </legend>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor={childAgeId} className={labelClasses}>
            Child&apos;s age<span className="text-destructive">*</span>
          </label>
          <input
            id={childAgeId}
            type="number"
            min={0}
            max={18}
            inputMode="numeric"
            value={Number.isNaN(values.child_age) ? "" : values.child_age}
            className={cn(
              baseInputClasses,
              errors.child_age && "border-destructive/70 aria-invalid:ring-destructive/20"
            )}
            aria-invalid={Boolean(errors.child_age)}
            aria-describedby={errors.child_age ? `${childAgeId}-error` : undefined}
            onChange={handleNumberChange("child_age")}
          />
          <p className={helperTextClasses}>Used to tailor vocabulary and themes.</p>
          {errors.child_age ? (
            <p id={`${childAgeId}-error`} className={errorTextClasses}>
              {errors.child_age}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor={minDurationId} className={labelClasses}>
            Minimum length (min)<span className="text-destructive">*</span>
          </label>
          <input
            id={minDurationId}
            type="number"
            min={1}
            max={60}
            inputMode="numeric"
            value={Number.isNaN(values.duration_min_minutes) ? "" : values.duration_min_minutes}
            className={cn(
              baseInputClasses,
              (errors.duration_min_minutes || errors.duration_range) &&
                "border-destructive/70 aria-invalid:ring-destructive/20"
            )}
            aria-invalid={Boolean(errors.duration_min_minutes || errors.duration_range)}
            aria-describedby={
              errors.duration_min_minutes || errors.duration_range ? `${minDurationId}-error` : undefined
            }
            onChange={handleNumberChange("duration_min_minutes")}
          />
          <p className={helperTextClasses}>Shortest acceptable narration length.</p>
          {errors.duration_min_minutes || errors.duration_range ? (
            <p id={`${minDurationId}-error`} className={errorTextClasses}>
              {errors.duration_min_minutes || errors.duration_range}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor={maxDurationId} className={labelClasses}>
            Maximum length (min)<span className="text-destructive">*</span>
          </label>
          <input
            id={maxDurationId}
            type="number"
            min={1}
            max={60}
            inputMode="numeric"
            value={Number.isNaN(values.duration_max_minutes) ? "" : values.duration_max_minutes}
            className={cn(
              baseInputClasses,
              (errors.duration_max_minutes || errors.duration_range) &&
                "border-destructive/70 aria-invalid:ring-destructive/20"
            )}
            aria-invalid={Boolean(errors.duration_max_minutes || errors.duration_range)}
            aria-describedby={
              errors.duration_max_minutes || errors.duration_range ? `${maxDurationId}-error` : undefined
            }
            onChange={handleNumberChange("duration_max_minutes")}
          />
          <p className={helperTextClasses}>Upper limit keeps bedtime predictable.</p>
          {errors.duration_max_minutes || errors.duration_range ? (
            <p id={`${maxDurationId}-error`} className={errorTextClasses}>
              {errors.duration_max_minutes || errors.duration_range}
            </p>
          ) : null}
        </div>
      </div>
    </fieldset>
  );
};

export default StoryPreferencesForm;
