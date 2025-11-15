const formatMeta = (meta?: unknown) => {
  if (!meta) return "";
  if (meta instanceof Error) {
    return `${meta.message} ${meta.stack ?? ""}`;
  }
  if (typeof meta === "object") {
    return JSON.stringify(meta);
  }
  return String(meta);
};

export const logger = {
  info(message: string, meta?: unknown) {
    console.log(`[Aurora][INFO] ${message}`, formatMeta(meta));
  },
  warn(message: string, meta?: unknown) {
    console.warn(`[Aurora][WARN] ${message}`, formatMeta(meta));
  },
  error(message: string, meta?: unknown) {
    console.error(`[Aurora][ERROR] ${message}`, formatMeta(meta));
  }
};

