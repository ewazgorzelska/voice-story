import { useCallback, type FormEvent } from "react";
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

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
      <StoryPreferencesForm values={preferences} errors={errors} onChange={onPreferencesChange} />
      {!userHasVoiceSample && <VoiceSampleWarning />}
      <div className="flex items-center justify-center">
        <GenerateButton disabled={disabled} isLoading={isLoading} type="submit" />
      </div>
    </form>
  );
};

export default GenerationSection;
