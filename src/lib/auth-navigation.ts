export const PRODUCTION_ORIGIN = 'https://jeongbi-on.vercel.app';
export function safeReturnTo(value: unknown, fallback = '/areas'): string {
  if (
    typeof value !== 'string' ||
    value.length > 2000 ||
    !value.startsWith('/') ||
    value.startsWith('//')
  )
    return fallback;
  let decoded = value;
  try {
    for (let i = 0; i < 3; i++) {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    }
  } catch {
    return fallback;
  }
  if (/^[\\/]{2}|[\\\u0000-\u001f\u007f]/.test(decoded)) return fallback;
  try {
    const url = new URL(value, PRODUCTION_ORIGIN);
    if (
      url.origin !== PRODUCTION_ORIGIN ||
      /^\/(?:auth|login|signup)(?:\/|$)/.test(
        new URL(decoded, PRODUCTION_ORIGIN).pathname,
      )
    )
      return fallback;
    for (const key of [
      'code',
      'token_hash',
      'access_token',
      'refresh_token',
      'auth_success',
      'signed_out',
    ])
      url.searchParams.delete(key);
    if (
      ['logout-local-only', 'logout-failed'].includes(
        url.searchParams.get('notice') ?? '',
      )
    )
      url.searchParams.delete('notice');
    if (/(?:access_token|refresh_token|token_hash|code)=/i.test(url.hash))
      url.hash = '';
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
export function callbackReturnTo(value: unknown, fallback = '/areas'): string {
  if (typeof value === 'string' && value.startsWith(PRODUCTION_ORIGIN + '/')) {
    try {
      const url = new URL(value);
      if (url.origin !== PRODUCTION_ORIGIN) return fallback;
      return safeReturnTo(
        url.pathname.startsWith('/auth/')
          ? url.searchParams.get('next')
          : url.pathname + url.search + url.hash,
        fallback,
      );
    } catch {
      return fallback;
    }
  }
  return safeReturnTo(value, fallback);
}
export function withAuthSuccess(path: string) {
  const url = new URL(safeReturnTo(path), PRODUCTION_ORIGIN);
  url.searchParams.set('auth_success', '1');
  return url.pathname + url.search + url.hash;
}
export function authErrorMessage(code: string | undefined) {
  if (code === 'email_not_confirmed')
    return '이메일 인증이 아직 완료되지 않았습니다. 새 인증 메일의 링크를 확인해 주세요.';
  if (code === 'invalid_credentials')
    return '이메일 또는 비밀번호가 올바르지 않습니다.';
  if (code && /session|refresh_token/.test(code))
    return '로그인 세션이 만료되었거나 유효하지 않습니다. 다시 로그인해 주세요.';
  if (code && /rate_limit|too_many/.test(code))
    return '요청이 많습니다. 잠시 후 다시 시도해 주세요.';
  if (code === 'weak_password') return '더 안전한 비밀번호를 사용해 주세요.';
  return '인증 요청을 처리하지 못했습니다. 입력값과 연결 상태를 확인해 주세요.';
}
