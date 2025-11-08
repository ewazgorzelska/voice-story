import type { GenerationSectionProps } from "@/types";
import GenerateButton from "./GenerateButton";
import VoiceSampleWarning from "./VoiceSampleWarning";

/**
 * Section containing generation initiation button and conditional warning
 * Manages button state (active/inactive/loading)
 */
export function GenerationSection({ onGenerate, disabled, isLoading, userHasVoiceSample }: GenerationSectionProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      {!userHasVoiceSample && <VoiceSampleWarning />}
      <GenerateButton onClick={onGenerate} disabled={disabled} isLoading={isLoading} />
    </div>
  );
}
