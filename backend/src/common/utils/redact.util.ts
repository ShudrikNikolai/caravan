const SENSITIVE_KEY_PARTS = [
  'password',
  'pass',
  'token',
  'secret',
  'authorization',
  'cookie',
];

export function redactQueryParams(
  query: Record<string, unknown> | undefined,
): Record<string, unknown> | null {
  if (!query) {
    return null;
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === '') {
      continue;
    }

    const normalizedKey = key.toLowerCase();
    const isSensitive = SENSITIVE_KEY_PARTS.some((part) =>
      normalizedKey.includes(part),
    );

    result[key] = isSensitive ? '[REDACTED]' : value;
  }

  return Object.keys(result).length > 0 ? result : null;
}
