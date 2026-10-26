// Shared URL policy; independent of the quiz import parser.
/** @param {string} value @param {boolean} [image] @returns {string | undefined} */
export function safeUrl(value, image = false) {
  if (!image && value.startsWith("#")) return value;
  try {
    const url = new URL(value);
    return (image
      ? url.protocol === "https:"
      : ["https:", "http:", "mailto:"].includes(url.protocol)) &&
      !url.username &&
      !url.password
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}
