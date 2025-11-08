/**
 * Warning component displayed when user doesn't have a saved voice sample
 * Contains link to recording view
 */
const VoiceSampleWarning = () => {
  return (
    <div
      className="flex items-center gap-3 p-4 mb-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
      role="alert"
    >
      <svg
        className="h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
      <div className="flex-1">
        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
          To generate a story, you must first record a voice sample.
        </p>
        <a
          href="/voice-sample"
          className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 underline hover:no-underline"
        >
          Record Now →
        </a>
      </div>
    </div>
  );
};

export default VoiceSampleWarning;
