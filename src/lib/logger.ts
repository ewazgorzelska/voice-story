type LogArgs = unknown[];

const isDev = import.meta.env.DEV;

export const logInfo = (...args: LogArgs) => {
  if (!isDev) {
    return;
  }
  // eslint-disable-next-line no-console
  console.info(...args);
};

export const logWarn = (...args: LogArgs) => {
  if (!isDev) {
    return;
  }
  // eslint-disable-next-line no-console
  console.warn(...args);
};

export const logError = (...args: LogArgs) => {
  if (!isDev) {
    return;
  }
  // eslint-disable-next-line no-console
  console.error(...args);
};
