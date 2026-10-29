'use client';
import { useActionState } from 'react';
import { saveFavorite, removeFavorite } from '@/app/account/actions';
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
