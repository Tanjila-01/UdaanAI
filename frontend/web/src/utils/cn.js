/**
 * Utility helper to filter falsy class values and join clean Tailwind class strings.
 * @param  {...(string | boolean | null | undefined)} classes
 * @returns {string}
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
