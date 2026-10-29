'use client';
import { useActionState, useEffect } from 'react';
import {
  saveOfficialZone,
  removeOfficialZone,
  updateOfficialZone,
  saveProfile,
  saveNotificationPreference,
  type FavoriteState,
} from '@/app/account/actions';
import { LoginLink } from './login-link';
const initial: FavoriteState = { message: '', success: false };
type Action = (state: FavoriteState, form: FormData) => Promise<FavoriteState>;
export function useAccountMutation(action: Action) {
  const result = useActionState(action, initial);
  const [state] = result;
  useEffect(() => {
    if (state.success)
      window.dispatchEvent(new Event('jeongbi-account-changed'));
  }, [state]);
  return result;
}
function Result({ state }: { state: FavoriteState }) {
  return (
    <>
      <p
        role="status"
        aria-live="polite"
        className={state.success ? 'success' : 'form-error'}
      >
        {state.message}
      </p>
      {state.code === 'AUTH_REQUIRED' && (
        <LoginLink className="button-secondary">로그인하기</LoginLink>
      )}
    </>
  );
}
export function SaveOfficialZone({ externalId }: { externalId: string }) {
  const [state, action, pending] = useAccountMutation(saveOfficialZone);
  return (
    <form action={action}>
      <input type="hidden" name="externalId" value={externalId} />
      <button className="button-primary" disabled={pending}>
        {pending ? '저장 중…' : '관심 정비구역 저장'}
      </button>
      <Result state={state} />
    </form>
  );
}
export function RemoveOfficialZone({ id }: { id: string }) {
  const [state, action, pending] = useAccountMutation(removeOfficialZone);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button className="button-secondary" disabled={pending}>
        {pending ? '해제 중…' : '관심구역 해제'}
      </button>
      <Result state={state} />
    </form>
  );
}
export function OfficialZoneSettings({
  id,
  enabled,
}: {
  id: string;
  enabled: boolean;
}) {
  const [state, action, pending] = useAccountMutation(updateOfficialZone);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <label>
        <input
          type="checkbox"
          name="alerts"
          defaultChecked={enabled}
          disabled={pending}
        />
        구역 소식 수신 희망
      </label>
      <button className="button-secondary" disabled={pending}>
        {pending ? '저장 중…' : '설정 저장'}
      </button>
      <Result state={state} />
    </form>
  );
}
export function ProfileForm({ name }: { name: string | null }) {
  const [state, action, pending] = useAccountMutation(saveProfile);
  return (
    <form action={action} className="profile-form">
      <label htmlFor="profile-name">표시 이름</label>
      <input
        id="profile-name"
        name="name"
        defaultValue={name ?? ''}
        maxLength={100}
        disabled={pending}
      />
      <button className="button-primary" disabled={pending}>
        {pending ? '저장 중…' : '프로필 저장'}
      </button>
      <p className="tiny-note">
        인증 이메일과 계정 연결은 여기서 변경하지 않습니다.
      </p>
      <Result state={state} />
    </form>
  );
}
export type Preference = {
  saleEnabled: boolean;
  auctionEnabled: boolean;
  priceEnabled: boolean;
  stageEnabled: boolean;
  appEnabled: boolean;
  kakaoRequested: boolean;
  frequency: string;
  updatedAt: string;
};
export function NotificationPreferenceForm({
  value,
}: {
  value: Preference | null;
}) {
  const [state, action, pending] = useAccountMutation(
    saveNotificationPreference,
  );
  const fields = [
    ['saleEnabled', '신규 매매'],
    ['auctionEnabled', '신규 경매'],
    ['priceEnabled', '가격 변경'],
    ['stageEnabled', '사업단계 변경'],
    ['appEnabled', '앱 알림'],
    ['kakaoRequested', '카카오톡 수신 희망'],
  ] as const;
  return (
    <form action={action} className="settings-card">
      <fieldset disabled={pending}>
        <legend>받고 싶은 소식</legend>
        {fields.map(([key, label]) => (
          <label className="setting-row" key={key}>
            <span className="setting-copy">
              <strong>{label}</strong>
            </span>
            <input
              name={key}
              type="checkbox"
              role="switch"
              defaultChecked={value ? value[key] : key === 'appEnabled'}
            />
          </label>
        ))}
        <label className="frequency-row">
          알림 빈도
          <select
            aria-label="알림 빈도"
            name="frequency"
            defaultValue={value?.frequency ?? 'daily'}
          >
            <option value="instant">즉시</option>
            <option value="daily">하루 한 번</option>
            <option value="weekly">일주일 한 번</option>
          </select>
        </label>
        <button className="button-primary">
          {pending ? '저장 중…' : '알림 설정 저장'}
        </button>
      </fieldset>
      <p className="tiny-note">
        수신 희망 설정을 저장합니다. 카카오톡·이메일 발송은 아직 연결되지
        않았습니다.
      </p>
      <Result state={state} />
    </form>
  );
}
