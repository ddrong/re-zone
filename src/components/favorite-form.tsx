'use client';
import { useActionState, useEffect } from 'react';
import {
  saveFavorite,
  removeFavorite,
  updateFavorite,
} from '@/app/account/actions';
import { districts } from '@/lib/regions';
export function FavoriteForm({
  selected,
  ready,
}: {
  selected: string;
  ready: boolean;
}) {
  const [state, action, pending] = useActionState(saveFavorite, {
    message: '',
    success: false,
  });
  useEffect(() => {
    if (state.success)
      window.dispatchEvent(new Event('jeongbi-account-changed'));
  }, [state]);
  return (
    <form action={action} className="favorite-form">
      <label htmlFor="district">관심 구·군 추가</label>
      <div className="search-row">
        <select
          id="district"
          name="district"
          defaultValue={selected}
          disabled={!ready || pending}
        >
          {districts.map((d) => (
            <option key={d.code} value={d.code}>
              {d.name}
            </option>
          ))}
        </select>
        <button className="button primary" disabled={!ready || pending}>
          {pending ? '저장 중…' : '관심지역 저장'}
        </button>
      </div>
      <p
        role="status"
        aria-live="polite"
        className={state.success ? 'success' : 'form-error'}
      >
        {state.message}
      </p>
    </form>
  );
}
export function RemoveFavorite({ id }: { id: string }) {
  const [state, action, pending] = useActionState(removeFavorite, {
    message: '',
    success: false,
  });
  useEffect(() => {
    if (state.success)
      window.dispatchEvent(new Event('jeongbi-account-changed'));
  }, [state]);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button className="text-button" disabled={pending}>
        {pending ? '해제 중…' : '관심 해제'}
      </button>
      <p role="status" className="small">
        {state.message}
      </p>
    </form>
  );
}

export function FavoriteSettings({
  id,
  enabled,
}: {
  id: string;
  enabled: boolean;
}) {
  const [state, action, pending] = useActionState(updateFavorite, {
    message: '',
    success: false,
  });
  useEffect(() => {
    if (state.success)
      window.dispatchEvent(new Event('jeongbi-account-changed'));
  }, [state]);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <label>
        <input type="checkbox" name="alerts" defaultChecked={enabled} />
        관심지역 알림 수신
      </label>
      <button className="button-secondary" disabled={pending}>
        {pending ? '저장 중…' : '설정 저장'}
      </button>
      <p role="status">{state.message}</p>
    </form>
  );
}
