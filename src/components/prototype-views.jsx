'use client';
import Image from 'next/image';
import {
  Activity,
  Building2,
  Calculator,
  Check,
  ChevronRight,
  House,
  Info,
  MapPin,
  Search,
  TrendingUp,
  Wallet,
  X,
  Bookmark,
  ChartNoAxesCombined,
  CircleHelp,
} from 'lucide-react';
import { businessStageGuide as stages } from '@/lib/regions';
import { districts as busanDistricts } from '@/lib/regions';
const formatNumber = (value) =>
  value === null || value === undefined
    ? '—'
    : Math.round(value).toLocaleString('ko-KR');
function Section({ title, action, children, className = '' }) {
  return (
    <section className={`section ${className}`}>
      <div className="section-heading">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Pill({ children, tone = 'mint' }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}

function StageTrack({ current, compact = false }) {
  if (!Number.isInteger(current) || current < 1 || current > 8)
    return (
      <p className="card-note">
        단계 번호를 확정할 수 없어 공식 단계명을 그대로 표시합니다.
      </p>
    );
  const positions = compact
    ? [1, current, Math.min(current + 1, 7), 8]
        .filter((step, index, list) => list.indexOf(step) === index)
        .sort((a, b) => a - b)
    : stages.map((_, index) => index + 1);
  const visibleStages = positions.map((step) => stages[step - 1]);
  return (
    <div
      className={`stage-track ${compact ? 'compact' : ''}`}
      aria-label={`8단계 중 ${current}단계 ${stages[current - 1]}`}
    >
      {visibleStages.map((label, index) => {
        const step = positions[index];
        return (
          <div
            className={`stage-item ${step < current ? 'complete' : ''} ${step === current ? 'current' : ''}`}
            key={`${step}-${label}`}
          >
            <span className="stage-dot">
              {step < current ? <Check size={12} /> : step}
            </span>
            <small>{label}</small>
          </div>
        );
      })}
    </div>
  );
}

export function AreasPage({
  onSearch,
  suggestions,
  areaType,
  setAreaType,
  search,
  setSearch,
  districtFilter,
  setDistrictFilter,
  zones: visibleZones,
  renderFavorite,
  onOpenZone,
  loading = false,
  mapPanel,
}) {
  const districts = ['전체', ...busanDistricts.map((d) => d.name)];
  return (
    <div className="areas-layout" data-source="official">
      <div
        className="segmented-control"
        role="tablist"
        aria-label="정비사업 유형"
      >
        {['전체', '재개발', '재건축'].map((type) => (
          <button
            key={type}
            role="tab"
            aria-selected={areaType === type}
            className={areaType === type ? 'selected' : ''}
            onClick={() => setAreaType(type)}
          >
            {type}
          </button>
        ))}
      </div>
      <form
        className="search-box"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          onSearch?.();
        }}
      >
        <Search size={19} />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          maxLength={80}
          list="official-zone-suggestions"
          aria-label="지역명 또는 구역명 검색"
          placeholder="지역명 또는 구역명 검색"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            aria-label="검색어 지우기"
          >
            <X size={17} />
          </button>
        )}
        <button type="submit" className="search-submit">
          검색
        </button>
        <datalist id="official-zone-suggestions">
          {(suggestions ?? []).map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </form>

      {mapPanel}

      <div className="district-filter" aria-label="지역 필터">
        {districts.map((district) => (
          <button
            key={district}
            className={
              districtFilter === (district === '전체' ? '' : district)
                ? 'selected'
                : ''
            }
            onClick={() =>
              setDistrictFilter(district === '전체' ? '' : district)
            }
          >
            {district}
          </button>
        ))}
      </div>
      <Section title={`정비사업 ${visibleZones.length}곳`}>
        {loading ? (
          <p role="status">부산시 공개자료 조회 중…</p>
        ) : visibleZones.length ? (
          <div className="zone-stack">
            {visibleZones.map((zone) => (
              <ZoneCard
                key={zone.id}
                zone={zone}
                favoriteControl={renderFavorite?.(zone.id)}
                onOpen={() => onOpenZone(zone.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="검색 결과가 없어요"
            detail="지역명이나 사업 유형을 바꿔 다시 찾아보세요."
          />
        )}
      </Section>
    </div>
  );
}

function ZoneCard({ zone, onOpen, favoriteControl }) {
  return (
    <article className="zone-card">
      <div className="zone-card-head">
        <button className="zone-title-button" onClick={onOpen}>
          <Pill>{zone.type}</Pill>
          <strong>{zone.name} </strong>
          <small>
            <MapPin size={13} /> {zone.address || zone.district}
          </small>
        </button>
        {favoriteControl}
      </div>
      <button className="zone-progress-button" onClick={onOpen}>
        <StageTrack current={zone.stage} compact />
      </button>
      <button className="zone-summary" onClick={onOpen}>
        <Activity size={17} />
        <strong>{zone.stageName}</strong>
        <span>부산시 공개자료</span>
        <ChevronRight size={17} />
      </button>
    </article>
  );
}

export function AnalysisPage({
  scenario,
  setScenario,
  inputs,
  updateInput,
  invested,
  projectedValue,
  profit,
  returnRate,
  onOpenZone,
  onReset,
}) {
  const scenarios = ['보수적', '기준', '낙관적'];
  const rows = [
    ['purchase', '매입 가격', '매물 가격 가정'],
    ['contribution', '추가 분담금', '개별 상황에 따라 달라짐'],
    ['expenses', '세금·금융 등 기타 비용', '누락 비용이 있을 수 있음'],
    ['future', '완공 후 가정 가격', '예측이나 시세 정보가 아님'],
  ];
  return (
    <>
      <section className="analysis-intro">
        <div>
          <span className="eyebrow">정비ON 손익 계산기 · 직접 입력</span>
          <h2>
            내 가정으로
            <br />
            <em>수익을 계산해요</em>
          </h2>
          <p>금액을 조정하면 예상 손익이 바로 바뀝니다.</p>
        </div>
        <div className="calculator-art">
          <Calculator size={27} />
        </div>
      </section>

      <div className="analysis-zone-link">
        <span className="icon-tile mint">
          <Building2 size={19} />
        </span>
        <button onClick={onOpenZone}>
          <strong>직접 입력하는 손익 계산</strong>
          <small>공식 정비사업 둘러보기 · 가격은 자동 입력하지 않습니다.</small>
        </button>
        <ChevronRight size={18} />
      </div>

      <section className="simulation-card">
        <div className="simulation-heading">
          <div>
            <span className="eyebrow">가정에 따른 시뮬레이션</span>
            <h2>지금 사면 어떨까?</h2>
          </div>
          <span className="icon-tile mint">
            <TrendingUp size={21} />
          </span>
        </div>
        <p className="simulation-description">
          선택한 시나리오가 완공 후 가정 가격에만 적용됩니다.
        </p>
        <div
          className="segmented-control scenario-tabs"
          role="tablist"
          aria-label="수익 시나리오"
        >
          {scenarios.map((item) => (
            <button
              key={item}
              role="tab"
              aria-selected={scenario === item}
              className={scenario === item ? 'selected' : ''}
              onClick={() => setScenario(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="result-metrics">
          <div>
            <span className="metric-icon">
              <Wallet size={18} />
            </span>
            <small>예상 총투입액</small>
            <strong>
              {formatNumber(invested)}
              <i>만 원</i>
            </strong>
          </div>
          <div>
            <span className="metric-icon">
              <House size={18} />
            </span>
            <small>완공 후 가정 가격</small>
            <strong>
              {formatNumber(projectedValue)}
              <i>만 원</i>
            </strong>
          </div>
          <div className="highlight-metric">
            <span className="metric-icon">
              <TrendingUp size={18} />
            </span>
            <small>예상 손익</small>
            <strong className={profit >= 0 ? 'positive' : 'negative'}>
              {profit > 0 ? '+' : ''}
              {formatNumber(profit)}
              <i>만 원</i>
            </strong>
          </div>
          <div>
            <span className="metric-icon">
              <Activity size={18} />
            </span>
            <small>단순 수익률</small>
            <strong className={returnRate >= 0 ? 'positive' : 'negative'}>
              {returnRate > 0 ? '+' : ''}
              {returnRate === null ? '—' : returnRate.toFixed(1)}
              <i>%</i>
            </strong>
          </div>
        </div>
      </section>

      <Section
        title="예상 총투입금 상세"
        action={
          <button className="text-action" onClick={onReset}>
            입력 초기화
          </button>
        }
      >
        <div className="content-card input-card">
          {rows.map(([key, label, hint]) => (
            <label className="money-field" key={key}>
              <span>
                <strong>{label}</strong>
                <small>{hint}</small>
              </span>
              <span className="money-input">
                <input
                  aria-label={`${label} 만원`}
                  type="number"
                  min="0"
                  step="0.01"
                  max="1000000000"
                  inputMode="numeric"
                  value={inputs[key]}
                  onChange={(event) => updateInput(key, event.target.value)}
                />
                <i>만원</i>
              </span>
            </label>
          ))}
        </div>
      </Section>

      <section className="scenario-breakdown">
        <div className="breakdown-header">
          <div>
            <ChartNoAxesCombined size={20} />
            <h2>예상 손익 상세</h2>
          </div>
          <span>단위: 만 원</span>
        </div>
        <div className="breakdown-row">
          <span>총투입액</span>
          <b>{formatNumber(invested)}</b>
        </div>
        <div className="breakdown-row">
          <span>완공 후 가정 가격 ({scenario})</span>
          <b>{formatNumber(projectedValue)}</b>
        </div>
        <div className="breakdown-total">
          <span>예상 손익</span>
          <strong className={profit >= 0 ? 'positive' : 'negative'}>
            {profit > 0 ? '+' : ''}
            {formatNumber(profit)}만 원
          </strong>
        </div>
        <div className="assumption-note">
          <CircleHelp size={16} /> 세금, 이자, 사업 지연, 권리관계 등 누락된
          비용·변수가 있을 수 있습니다.
        </div>
      </section>

      <div className="disclaimer">
        <Info size={17} />
        <p>
          본 계산은 사용자가 입력한 가정을 단순 계산한 시연 결과입니다. 실제
          사업 결과나 투자 수익을 예측·보장하지 않으며, 투자 추천이 아닙니다.
        </p>
      </div>
    </>
  );
}

export function MyPage({
  onNavigate,
  accountPanel,
  preferencesPanel,
  favoritesPanel,
}) {
  return (
    <>
      <section className="profile-card">
        <div className="profile-avatar">
          <Image width={200} height={200} src="/assets/oni.png" alt="" />
        </div>
        <div>
          <span className="eyebrow">정비ON과 함께</span>
          <h2>나의 정비ON</h2>
          <p>로그인 상태와 관심지역을 관리하세요.</p>
        </div>
        <Pill tone="blue">MY</Pill>
      </section>

      <Section title="계정 연결">{accountPanel}</Section>

      {preferencesPanel}

      {favoritesPanel}

      <Section title="서비스 안내">
        <button className="about-row" onClick={() => onNavigate('alerts')}>
          <Info size={18} />
          <span>
            <strong>알림과 개인정보</strong>
            <small>이메일·카카오 계정과 회원별 저장 정보를 확인하세요.</small>
          </span>
          <ChevronRight size={17} />
        </button>
        <button className="about-row" onClick={() => onNavigate('analysis')}>
          <Calculator size={18} />
          <span>
            <strong>수익 계산 안내</strong>
            <small>계산 가정과 주의사항을 확인하세요.</small>
          </span>
          <ChevronRight size={17} />
        </button>
      </Section>
    </>
  );
}

function EmptyState({ title, detail, action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Bookmark size={24} />
      </span>
      <strong>{title}</strong>
      <p>{detail}</p>
      {action}
    </div>
  );
}
