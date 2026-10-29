'use client';
import Image from 'next/image';
import {
  Activity,
  ArrowRight,
  Bell,
  Building2,
  Calculator,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  Heart,
  House,
  Info,
  MapPin,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  Wallet,
  X,
  ChartNoAxesCombined,
  Gavel,
  Bookmark,
  UserRound,
} from 'lucide-react';
import { zones, stages, listings } from '@/lib/prototype-data';
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

export function HomePage({ favorites, onNavigate, onOpenZone }) {
  const news = [
    [House, '신규 매매', '2', 'sky'],
    [Gavel, '신규 경매', '1', 'lilac'],
    [TrendingUp, '가격 변경', '3', 'mint'],
    [Bell, '단계 변경', '1', 'peach'],
  ];
  return (
    <>
      <section className="welcome-card">
        <div className="welcome-copy">
          <span className="eyebrow">안녕하세요, 정비ON과 함께해요</span>
          <h2>
            관심지역에
            <br />
            <em>새로운 소식</em>이 있어요
          </h2>
          <p>저장한 구역의 업데이트를 확인해 보세요.</p>
        </div>
        <Image
          width={200}
          height={200}
          className="mascot"
          src="/assets/oni.png"
          alt="정비ON 마스코트 온이"
        />
      </section>

      <Section
        title="내 관심지역 새 소식 · 예시"
        action={
          <button className="text-action" onClick={() => onNavigate('alerts')}>
            전체 보기 <ChevronRight size={16} />
          </button>
        }
      >
        <div className="news-counts">
          {news.map(([Icon, title, count, tone]) => (
            <button
              className="news-count"
              key={title}
              onClick={() => onNavigate('alerts')}
            >
              <span className={`icon-tile ${tone}`}>
                <Icon size={20} />
              </span>
              <small>{title}</small>
              <strong>
                {count}
                <i>건</i>
              </strong>
            </button>
          ))}
        </div>
        <div className="interest-chips">
          {favorites
            .map((id) => zones.find((zone) => zone.id === id))
            .filter(Boolean)
            .map((zone) => (
              <button
                className="interest-chip"
                key={zone.id}
                onClick={() => onOpenZone(zone.id)}
              >
                {zone.name}
                <span className="live-dot" />
              </button>
            ))}
          <button
            className="interest-chip add"
            onClick={() => onNavigate('areas')}
          >
            <Plus size={15} /> 관심지역 추가
          </button>
        </div>
      </Section>

      <Section
        title="최근 등록된 매물"
        action={
          <button className="text-action" onClick={() => onNavigate('areas')}>
            지역에서 보기 <ChevronRight size={16} />
          </button>
        }
      >
        <div className="listing-stack">
          {listings.slice(0, 2).map((item) => (
            <ListingCard
              key={item.id}
              listing={item}
              onOpen={() => onOpenZone(item.zone)}
            />
          ))}
        </div>
      </Section>

      <button className="budget-banner" onClick={() => onNavigate('analysis')}>
        <span className="budget-icon">
          <Wallet size={23} />
        </span>
        <span>
          <strong>내 조건으로 수익 계산</strong>
          <small>가정을 바꿔 예상 비용과 손익 살펴보기</small>
        </span>
        <ArrowRight size={21} />
      </button>

      <Section
        title="관심지역 시세 비교"
        action={
          <button
            className="text-action"
            onClick={() => onNavigate('analysis')}
          >
            분석하기 <ChevronRight size={16} />
          </button>
        }
      >
        <div className="market-grid">
          {zones.map((zone, index) => (
            <button
              className="market-card"
              key={zone.id}
              onClick={() => onOpenZone(zone.id)}
            >
              <strong>{zone.name.replace('구역', '')}</strong>
              <span
                className={`sparkline sparkline-${index}`}
                aria-hidden="true"
              >
                <i />
              </span>
              <b>{['3억 5,000만', '2억 8,000만', '2억 3,000만'][index]}</b>
              <small>비교용 시연 데이터</small>
            </button>
          ))}
        </div>
      </Section>

      <Section
        title="부산 정비사업 현황"
        action={
          <button className="text-action" onClick={() => onNavigate('areas')}>
            지역 탐색 <ChevronRight size={16} />
          </button>
        }
      >
        <div className="project-summary">
          <button onClick={() => onNavigate('areas')}>
            <span className="icon-tile mint">
              <Building2 size={20} />
            </span>
            <span>
              <small>재개발</small>
              <strong>
                예시 구역{' '}
                {zones.filter((zone) => zone.type === '재개발').length}곳
              </strong>
            </span>
            <ChevronRight size={17} />
          </button>
          <button onClick={() => onNavigate('areas')}>
            <span className="icon-tile peach">
              <Building2 size={20} />
            </span>
            <span>
              <small>재건축</small>
              <strong>
                예시 구역{' '}
                {zones.filter((zone) => zone.type === '재건축').length}곳
              </strong>
            </span>
            <ChevronRight size={17} />
          </button>
        </div>
      </Section>

      <div className="home-footnote">
        <Info size={15} /> 가격·매물·정비사업 현황은 실제 데이터와 무관한 시연용
        예시입니다.
      </div>
    </>
  );
}

function ListingCard({ listing, onOpen }) {
  const zone = zones.find((item) => item.id === listing.zone);
  return (
    <button className="listing-card" onClick={onOpen}>
      <span
        className={`listing-art ${listing.kind === '경매' ? 'auction' : ''}`}
      >
        <Building2 size={35} />
      </span>
      <span className="listing-copy">
        <span className="listing-demo-label">예시</span>
        <Pill tone={listing.kind === '경매' ? 'blue' : 'mint'}>
          {listing.kind === '경매' ? '신규 경매' : '신규 매매'}
        </Pill>
        <strong>{zone?.name}</strong>
        <b>{listing.price}</b>
        <small>{listing.detail}</small>
      </span>
      <ChevronRight className="listing-chevron" size={19} />
    </button>
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
  favorites,
  onToggleFavorite,
  onOpenZone,
  official = false,
  loading = false,
  mapPanel,
}) {
  const districts = ['전체', ...busanDistricts.map((d) => d.name)];
  return (
    <div className="areas-layout" data-source={official ? 'official' : 'demo'}>
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
                favorite={favorites.includes(zone.id)}
                onToggleFavorite={() => onToggleFavorite(zone.id)}
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

function ZoneCard({ zone, favorite, onToggleFavorite, onOpen }) {
  return (
    <article className="zone-card">
      <div className="zone-card-head">
        <button className="zone-title-button" onClick={onOpen}>
          <Pill>{zone.type}</Pill>
          <strong>
            {zone.name}{' '}
            {zone.demo !== false && <small className="demo-inline">예시</small>}
          </strong>
          <small>
            <MapPin size={13} />{' '}
            {zone.demo === false
              ? zone.address || zone.district
              : '부산 ' + zone.district}
          </small>
        </button>
        <button
          className={`heart-button ${favorite ? 'is-favorite' : ''}`}
          onClick={onToggleFavorite}
          aria-label={
            favorite ? `${zone.name} 관심 해제` : `${zone.name} 관심 등록`
          }
          aria-pressed={favorite}
        >
          <Heart size={22} fill={favorite ? 'currentColor' : 'none'} />
        </button>
      </div>
      <button className="zone-progress-button" onClick={onOpen}>
        <StageTrack current={zone.stage} compact />
      </button>
      <button className="zone-summary" onClick={onOpen}>
        <Activity size={17} />
        <strong>{zone.stageName}</strong>
        <span>
          {zone.demo === false ? '부산시 공개자료' : '시연 정보 · 확인 필요'}
        </span>
        <ChevronRight size={17} />
      </button>
    </article>
  );
}

export function DetailPage({ zone, isFavorite, onToggleFavorite, onNavigate }) {
  const zoneListings =
    zone.demo === false
      ? []
      : listings.filter((listing) => listing.zone === zone.id);
  return (
    <>
      <section className={`detail-hero ${zone.color}`}>
        <div className="detail-hero-art" aria-hidden="true">
          <Building2 size={78} />
          <span />
          <i />
        </div>
        <Pill>{zone.type}</Pill>
        <span className="area-label">{zone.district}</span>
        <h2>{zone.name}</h2>
        <p>
          <MapPin size={15} /> 부산 {zone.district}
        </p>
        <button
          className="detail-favorite"
          onClick={onToggleFavorite}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? '관심 해제' : '관심 등록'}
        >
          <Heart size={21} fill={isFavorite ? 'currentColor' : 'none'} />{' '}
          {isFavorite ? '관심 등록됨' : '관심 등록'}
        </button>
      </section>

      <Section title="진행 단계">
        <div className="content-card stages-card">
          <div className="stage-card-heading">
            <span className="icon-tile mint">
              <Activity size={20} />
            </span>
            <div>
              <small>현재 표시 단계</small>
              <strong>
                {zone.stage > 0 ? zone.stage + '. ' : ''}
                {zone.stageName}
              </strong>
            </div>
            <Pill>{zone.stage > 0 ? zone.stage + ' / 8' : '원문 확인'}</Pill>
          </div>
          <StageTrack current={zone.stage} />
          <p className="card-note">
            <Info size={15} />{' '}
            {zone.demo === false
              ? '부산시 공개 단계명을 8단계 안내에 대응한 표시입니다. 취소·해제 및 정확한 일정은 원문을 확인하세요.'
              : '단계 표시는 예시이며 공식 진행 상황·갱신일을 확인해야 합니다.'}
          </p>
        </div>
      </Section>

      <section className="summary-card">
        <div className="summary-mascot">
          <Image width={200} height={200} src="/assets/oni.png" alt="" />
        </div>
        <div>
          <span className="summary-label">
            <Sparkles size={15} /> 온이의 한눈에 요약
          </span>
          <strong>
            {zone.name}은 현재 <em>{zone.stageName}</em> 단계로 표시돼요.
          </strong>
          <p>
            단계별 절차와 사업 일정은 구역 및 행정 결정에 따라 달라질 수
            있습니다.
          </p>
        </div>
      </section>

      <Section title="핵심 정보">
        <div className="metric-grid">
          {[
            [CalendarDays, '사업 기간', '공식 확인 필요'],
            [
              Activity,
              '사업 진행도',
              zone.stage > 0
                ? `${Math.round((zone.stage / 8) * 100)}% · 단계 기준`
                : '공식 단계명 확인',
            ],
            [UserRound, '조합원 수', '자료 확인 필요'],
            [Wallet, '분담금', '개별 확인 필요'],
          ].map(([Icon, label, value]) => (
            <div className="metric-card" key={label}>
              <span className="metric-icon">
                <Icon size={18} />
              </span>
              <small>{label}</small>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </Section>

      <Section title="이 구역의 매물">
        {zoneListings.length ? (
          <div className="listing-stack">
            {zoneListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onOpen={() => onNavigate('analysis')}
              />
            ))}
          </div>
        ) : (
          <div className="content-card muted-card">
            등록된 매물 예시가 없습니다.
          </div>
        )}
        <p className="tiny-note">
          예시. 표시된 가격은 거래·경매 자료가 아닙니다.
        </p>
      </Section>

      <div className="bottom-cta">
        <button className="button-secondary" onClick={onToggleFavorite}>
          <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
          {isFavorite ? '관심 해제' : '관심 구역 추가'}
        </button>
        <button
          className="button-primary"
          onClick={() => onNavigate('analysis')}
        >
          <ChartNoAxesCombined size={18} /> 수익 분석 <ChevronRight size={18} />
        </button>
      </div>
    </>
  );
}

export function FavoritesPage({
  tab,
  setTab,
  favorites,
  recent,
  notices,
  onOpenZone,
  onNavigate,
  onToggleFavorite,
  onMarkRead,
  onMarkAll,
  onOpenNotice,
}) {
  const tabs = ['내 관심', '알림', '최근 본', '저장한 검색'];
  return (
    <>
      <div
        className="segmented-control favorite-tabs"
        role="tablist"
        aria-label="관심 메뉴"
      >
        {tabs.map((item) => (
          <button
            key={item}
            role="tab"
            aria-selected={tab === item}
            className={tab === item ? 'selected' : ''}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </div>
      {tab === '내 관심' && (
        <>
          <div className="favorite-callout">
            <span className="icon-tile mint">
              <Bell size={20} />
            </span>
            <div>
              <strong>관심 구역의 소식을 모아봤어요</strong>
              <small>
                {favorites.length}개 구역의 새 소식을 확인해 보세요.
              </small>
            </div>
            <button onClick={() => onNavigate('alerts')} aria-label="알림 확인">
              <ChevronRight />
            </button>
          </div>
          {favorites.length ? (
            <div className="zone-stack">
              {zones
                .filter((zone) => favorites.includes(zone.id))
                .map((zone) => (
                  <ZoneCard
                    key={zone.id}
                    zone={zone}
                    favorite
                    onToggleFavorite={() => onToggleFavorite(zone.id)}
                    onOpen={() => onOpenZone(zone.id)}
                  />
                ))}
            </div>
          ) : (
            <EmptyState
              title="등록한 관심 구역이 없어요"
              detail="관심 구역을 추가하면 새 소식을 모아볼 수 있어요."
              action={
                <button
                  className="button-primary"
                  onClick={() => onNavigate('areas')}
                >
                  지역 탐색하기
                </button>
              }
            />
          )}
          <button
            className="add-region-button"
            onClick={() => onNavigate('areas')}
          >
            <Plus size={18} /> 관심지역 추가
          </button>
          <div className="preference-callout">
            <div>
              <Bell size={19} />
              <span>
                <strong>알림 수신 설정</strong>
                <small>받고 싶은 소식과 빈도를 설정해 보세요.</small>
              </span>
            </div>
            <button onClick={() => onNavigate('my')}>
              알림 설정 <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}
      {tab === '알림' && (
        <AlertsPage
          notices={notices}
          onMarkRead={onMarkRead}
          onMarkAll={onMarkAll}
          onOpenNotice={onOpenNotice}
        />
      )}
      {tab === '최근 본' &&
        (recent.length ? (
          <div className="zone-stack">
            {recent
              .map((id) => zones.find((zone) => zone.id === id))
              .filter(Boolean)
              .map((zone) => (
                <ZoneCard
                  key={zone.id}
                  zone={zone}
                  favorite={favorites.includes(zone.id)}
                  onToggleFavorite={() => onToggleFavorite(zone.id)}
                  onOpen={() => onOpenZone(zone.id)}
                />
              ))}
          </div>
        ) : (
          <EmptyState
            title="최근 본 구역이 여기에 보여요"
            detail="지역을 탐색하고 구역 상세 정보를 확인해 보세요."
            action={
              <button
                className="button-primary"
                onClick={() => onNavigate('areas')}
              >
                지역 탐색하기
              </button>
            }
          />
        ))}
      {tab === '저장한 검색' && (
        <EmptyState
          title="저장한 검색이 없어요"
          detail="지역 탐색에서 원하는 구역을 찾고 관심 등록해 보세요."
          action={
            <button
              className="button-primary"
              onClick={() => onNavigate('areas')}
            >
              <Search size={17} /> 지역 탐색하기
            </button>
          }
        />
      )}
    </>
  );
}

export function AlertsPage({ notices, onMarkRead, onMarkAll, onOpenNotice }) {
  return (
    <section className="alerts-page">
      <div className="alerts-heading">
        <div>
          <h2>새로운 소식</h2>
          <p>관심 구역 업데이트를 확인해 보세요.</p>
        </div>
        <button className="text-action" onClick={onMarkAll}>
          모두 읽음 처리
        </button>
      </div>
      {notices.map((notice) => (
        <article
          className={`alert-row ${notice.read ? '' : 'unread'}`}
          key={notice.id}
        >
          <span className="icon-tile mint">
            <Bell size={19} />
          </span>
          <button
            className="alert-copy"
            onClick={() => onOpenNotice(notice.id)}
          >
            <strong>
              <span className="demo-inline">예시</span> {notice.title}
            </strong>
            <span>{notice.description}</span>
            <small>{notice.date}</small>
          </button>
          {!notice.read && (
            <button
              className="mark-read"
              onClick={() => onMarkRead(notice.id)}
              aria-label={`${notice.title} 읽음 처리`}
            >
              <Check size={17} />
            </button>
          )}
          <button
            className="arrow-button"
            onClick={() => onOpenNotice(notice.id)}
            aria-label={`${notice.title} 상세 보기`}
          >
            <ChevronRight size={18} />
          </button>
        </article>
      ))}
      <p className="tiny-note">
        알림 내용은 화면 확인을 위한 시연용 예시입니다. 실제 알림은 발송되지
        않습니다.
      </p>
    </section>
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
          <span className="eyebrow">정비ON 손익 계산기 · 시연용</span>
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
          <small>구역 예시 보기 · 가격은 자동 입력하지 않습니다.</small>
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
