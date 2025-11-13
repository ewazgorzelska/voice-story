import { useCallback, type FormEvent, type MouseEvent } from "react";
import type { GenerationSectionProps } from "@/types";
import GenerateButton from "./GenerateButton";
import VoiceSampleWarning from "./VoiceSampleWarning";
import StoryPreferencesForm from "./StoryPreferencesForm";

/**
 * Section containing generation preference controls, initiation button, and conditional warning
 * Manages button state (active/inactive/loading)
 */
const GenerationSection = ({
  onGenerate,
  disabled,
  isLoading,
  userHasVoiceSample,
  preferences,
  errors,
  onPreferencesChange,
}: GenerationSectionProps) => {
  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (disabled) {
        return;
      }
      onGenerate();
    },
    [disabled, onGenerate]
  );

  const handleButtonClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (!disabled && !isLoading) {
        onGenerate();
      }
    },
    [disabled, isLoading, onGenerate]
  );

  return (
    <div className="rounded-xl border border-border/60 bg-card/60 shadow-sm">
      <form className="flex flex-col gap-6 px-4 py-5 sm:px-6 sm:py-6" onSubmit={handleSubmit} noValidate>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Personalize this story</h2>
          <p className="text-sm text-muted-foreground">
            Set your preferences to create a custom narration tailored for your child
          </p>
        </div>

        <StoryPreferencesForm values={preferences} errors={errors} onChange={onPreferencesChange} />

        {!userHasVoiceSample && <VoiceSampleWarning />}

        <div className="flex items-center justify-center pt-2">
          <GenerateButton onClick={handleButtonClick} disabled={disabled} isLoading={isLoading} type="submit" />
        </div>
      </form>
    </div>
  );
};

export default GenerationSection;
