import 'server-only';
/** Public JavaScript key only. Read after connection() so runtime settings are used. */
export function getPublicKakaoMapKey(
  environment: NodeJS.ProcessEnv = process.env,
): string {
  return (
    environment['NEXT_PUBLIC_KAKAO_MAP_JS_KEY']?.trim() ||
    environment['NEXT_PUBLIC_KAKAO_MAP_KEY']?.trim() ||
    ''
  );
}
