const SENSITIVE_QUERY_KEYS = [
  'email',
  'password',
  'confirmPassword',
  'oldpass',
  'newpass',
  'token',
  'access_token',
  'refresh_token',
  'accessToken',
  'refreshToken',
];

export function stripSensitiveQuery(): void {
  if (typeof window === 'undefined') {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const hasSensitiveValue = SENSITIVE_QUERY_KEYS.some((key) => params.has(key));

  if (!hasSensitiveValue) {
    return;
  }

  const cleanParams = new URLSearchParams();

  params.forEach((value, key) => {
    if (!SENSITIVE_QUERY_KEYS.includes(key)) {
      cleanParams.set(key, value);
    }
  });

  const query = cleanParams.toString();

  window.history.replaceState(
    {},
    '',
    `${window.location.pathname}${query ? `?${query}` : ''}`,
  );
}
