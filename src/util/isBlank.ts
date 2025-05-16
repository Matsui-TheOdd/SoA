export const isBlank = (str?: string | null): boolean => {
  return str == null || /^\s*$/.test(str);
};