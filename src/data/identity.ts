export const createClientId = (companyName: string, existingIds: string[]): string => {
  const words = companyName.trim().split(/\s+/).filter(Boolean);
  const acronym = words.length >= 3
    ? words.slice(0, 3).map((word) => word[0]).join('')
    : words.length === 2
      ? `${words[0].slice(0, 2)}${words[1][0]}`
      : (words[0] || 'CL').slice(0, 3);
  const baseId = acronym.replace(/[^a-z]/gi, '').toUpperCase() || 'CL';
  const existing = new Set(existingIds.map((id) => id.toUpperCase()));
  const hasMatchingId = [...existing].some((id) => id === baseId || id.startsWith(`${baseId}-`));
  if (!hasMatchingId) return baseId;

  let suffix = 2;
  while (existing.has(`${baseId}-${String(suffix).padStart(2, '0')}`)) {
    suffix += 1;
  }
  return `${baseId}-${String(suffix).padStart(2, '0')}`;
};
