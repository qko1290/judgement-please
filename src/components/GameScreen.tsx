// File: src/components/GameScreen.tsx

"use client";

import { useMemo, useState } from "react";
import {
  casePool,
  choiceLabels,
  finalCaseId,
  initialStats,
  maxCasesPerRun,
  maxVerificationCasesPerRun,
  precedentLabels,
} from "../data/cases";
import {
  applyEffect,
  createPendingVerification,
  decideEnding,
  statLabels,
} from "../lib/gameLogic";
import type {
  CaseData,
  ChoiceKey,
  EndingResult,
  HistoryItem,
  PendingVerification,
  PrecedentKey,
  StatKey,
  Stats,
} from "../types/game";

const statOrder: StatKey[] = [
  "citizenTrust",
  "adminTrust",
  "consistency",
  "rulePollution",
];

const choiceOrder: ChoiceKey[] = ["approve", "conditional", "reject"];

type ModalType = "stats" | "precedents" | "history" | "verifications" | null;

type CaseSelection = {
  caseData: CaseData;
  activeVerificationId?: string | null;
};

const caseMap = new Map(casePool.map((item) => [item.id, item]));

function getCase(id: string): CaseData {
  const found = caseMap.get(id);

  if (!found) {
    throw new Error(`Case not found: ${id}`);
  }

  return found;
}

function getStatClass(key: StatKey, value: number) {
  if (key === "rulePollution") {
    if (value >= 75) return "danger";
    if (value >= 45) return "warning";
    return "safe";
  }

  if (value >= 70) return "safe";
  if (value >= 40) return "warning";
  return "danger";
}

function getPreviousStats(history: HistoryItem[]): Stats {
  if (history.length >= 2) {
    return history[1].statsAfter;
  }

  return initialStats;
}

function getStatDelta(stats: Stats, previousStats: Stats, key: StatKey) {
  return stats[key] - previousStats[key];
}

function getDeltaClass(key: StatKey, delta: number) {
  if (delta === 0) return "delta-zero";

  if (key === "rulePollution") {
    return delta > 0 ? "delta-bad" : "delta-good";
  }

  return delta > 0 ? "delta-good" : "delta-bad";
}

function getDeltaText(delta: number) {
  if (delta === 0) return "";

  const arrow = delta > 0 ? "↑" : "↓";
  const sign = delta > 0 ? "+" : "";

  return `${arrow} ${sign}${delta}`;
}

function getRiskLabel(risk: PendingVerification["risk"]) {
  if (risk === "high") return "높음";
  if (risk === "medium") return "보통";
  return "낮음";
}

function getChoiceLabelForCase(caseData: CaseData, choice: ChoiceKey) {
  if (caseData.caseType === "final") {
    const finalLabels: Record<ChoiceKey, string> = {
      approve: "전례 유지",
      conditional: "조건부 정비",
      reject: "문제 전례 폐기",
    };

    return finalLabels[choice];
  }

  if (caseData.caseType === "verification") {
    const verificationLabels: Record<ChoiceKey, string> = {
      approve: "자료 인정",
      conditional: "조건 재정리",
      reject: "전례 적용 제한",
    };

    return verificationLabels[choice];
  }

  if (caseData.caseType === "backlash") {
    const backlashLabels: Record<ChoiceKey, string> = {
      approve: "재검토 수용",
      conditional: "제한적 재심사",
      reject: "기존 판단 유지",
    };

    return backlashLabels[choice];
  }

  return choiceLabels[choice];
}

function countRecentVerificationStreak(seenCaseIds: string[]) {
  let streak = 0;

  for (let index = seenCaseIds.length - 1; index >= 0; index -= 1) {
    const caseData = caseMap.get(seenCaseIds[index]);

    if (caseData?.caseType !== "verification") {
      break;
    }

    streak += 1;
  }

  return streak;
}

function getPendingVerificationTotal(items: PendingVerification[]) {
  return items.reduce((sum, item) => sum + Math.max(1, item.count), 0);
}

function mergePendingVerification(
  items: PendingVerification[],
  pending: PendingVerification
): PendingVerification[] {
  const existingIndex = items.findIndex(
    (item) => item.verificationCaseId === pending.verificationCaseId
  );

  if (existingIndex < 0) {
    return [...items, pending];
  }

  return items.map((item, index) => {
    if (index !== existingIndex) return item;

    const sourceCaseIds = Array.from(
      new Set([...item.sourceCaseIds, ...pending.sourceCaseIds])
    );

    const sourceTitles = Array.from(
      new Set([...item.sourceTitles, ...pending.sourceTitles])
    );

    return {
      ...item,
      sourceCaseIds,
      sourceTitles,
      count: item.count + pending.count,
      dueAtCaseNumber: Math.min(item.dueAtCaseNumber, pending.dueAtCaseNumber),
    };
  });
}

function pickWeightedRandom(items: CaseData[]) {
  const totalWeight = items.reduce((sum, item) => sum + (item.weight ?? 1), 0);
  let cursor = Math.random() * totalWeight;

  for (const item of items) {
    cursor -= item.weight ?? 1;

    if (cursor <= 0) {
      return item;
    }
  }

  return items[0];
}

function selectInitialCase(): CaseSelection {
  const earlyCases = casePool.filter(
    (item) =>
      item.stage === "early" &&
      item.caseType === "base" &&
      !item.requiresPrecedent
  );

  return {
    caseData: pickWeightedRandom(earlyCases),
    activeVerificationId: null,
  };
}

function countShownVerificationCases(seenCaseIds: string[]) {
  return seenCaseIds.filter((id) => caseMap.get(id)?.caseType === "verification")
    .length;
}

function getAllowedStages(nextCaseNumber: number) {
  if (nextCaseNumber <= 5) return ["early"];
  if (nextCaseNumber <= 10) return ["mid", "early"];
  return ["late", "mid"];
}

function selectNextCase(params: {
  currentCaseNumber: number;
  stats: Stats;
  precedents: PrecedentKey[];
  seenCaseIds: string[];
  pendingVerifications: PendingVerification[];
}): CaseSelection {
  const {
    currentCaseNumber,
    stats,
    precedents,
    seenCaseIds,
    pendingVerifications,
  } = params;

  const nextCaseNumber = currentCaseNumber + 1;
  const finalCase = getCase(finalCaseId);

  if (nextCaseNumber >= maxCasesPerRun) {
    return {
      caseData: finalCase,
      activeVerificationId: null,
    };
  }

  const seen = new Set(seenCaseIds);
  const shownVerificationCount = countShownVerificationCases(seenCaseIds);
  const recentVerificationStreak = countRecentVerificationStreak(seenCaseIds);

  const dueVerification = [...pendingVerifications]
    .filter((item) => item.dueAtCaseNumber <= nextCaseNumber)
    .sort((a, b) => a.dueAtCaseNumber - b.dueAtCaseNumber)[0];

  const shouldDelayVerificationForPressureCase =
    dueVerification &&
    nextCaseNumber >= 8 &&
    shownVerificationCount >= 2 &&
    stats.rulePollution >= 18;

  if (
    dueVerification &&
    !shouldDelayVerificationForPressureCase &&
    shownVerificationCount < maxVerificationCasesPerRun &&
    nextCaseNumber >= 6 &&
    recentVerificationStreak < 2
  ) {
    return {
      caseData: getCase(dueVerification.verificationCaseId),
      activeVerificationId: dueVerification.id,
    };
  }

  const allowedStages = getAllowedStages(nextCaseNumber);

  const available = casePool.filter(
    (item) =>
      item.id !== finalCaseId &&
      item.caseType !== "verification" &&
      !seen.has(item.id)
  );

  const isEligible = (item: CaseData) => {
    if (!allowedStages.includes(item.stage)) {
      return false;
    }

    if (item.requiresPrecedent && !precedents.includes(item.requiresPrecedent)) {
      return false;
    }

    if (
      typeof item.minRulePollution === "number" &&
      stats.rulePollution < item.minRulePollution
    ) {
      return false;
    }

    if (
      typeof item.maxCitizenTrust === "number" &&
      stats.citizenTrust > item.maxCitizenTrust
    ) {
      return false;
    }

    return true;
  };

  const eligible = available.filter(isEligible);

  const hasSeenAbuseCase = seenCaseIds.some(
    (id) => caseMap.get(id)?.caseType === "abuse"
  );

  if (nextCaseNumber >= 11 && !hasSeenAbuseCase && precedents.length >= 1) {
    const pressureAbuseCases = eligible.filter(
      (item) => item.caseType === "abuse"
    );

    if (pressureAbuseCases.length > 0) {
      return {
        caseData: pickWeightedRandom(pressureAbuseCases),
        activeVerificationId: null,
      };
    }
  }

  const phase =
    nextCaseNumber <= 5 ? "early" : nextCaseNumber <= 10 ? "mid" : "late";

  const hasMeaningfulPrecedentPressure =
    precedents.length >= 2 || stats.rulePollution >= 18 || shownVerificationCount >= 2;

  const preferredTypes =
    stats.citizenTrust <= 35
      ? ["backlash", "gray", "normalUse", "base", "abuse"]
      : phase === "early"
        ? ["base", "gray"]
        : phase === "mid"
          ? hasMeaningfulPrecedentPressure
            ? ["normalUse", "abuse", "gray", "base"]
            : ["normalUse", "gray", "base", "abuse"]
          : hasMeaningfulPrecedentPressure
            ? ["abuse", "gray", "normalUse", "base"]
            : ["gray", "normalUse", "abuse", "base"];

  for (const type of preferredTypes) {
    const bucket = eligible.filter((item) => item.caseType === type);

    if (bucket.length > 0) {
      return {
        caseData: pickWeightedRandom(bucket),
        activeVerificationId: null,
      };
    }
  }

  const fallback = available.filter((item) => {
    if (item.requiresPrecedent && !precedents.includes(item.requiresPrecedent)) {
      return false;
    }

    if (
      typeof item.minRulePollution === "number" &&
      stats.rulePollution < item.minRulePollution
    ) {
      return false;
    }

    if (
      typeof item.maxCitizenTrust === "number" &&
      stats.citizenTrust > item.maxCitizenTrust
    ) {
      return false;
    }

    return true;
  });

  if (fallback.length > 0) {
    return {
      caseData: pickWeightedRandom(fallback),
      activeVerificationId: null,
    };
  }

  return {
    caseData: finalCase,
    activeVerificationId: null,
  };
}

export default function GameScreen() {
  const initialSelection = useMemo(() => selectInitialCase(), []);
  const [started, setStarted] = useState(false);
  const [currentCase, setCurrentCase] = useState<CaseData>(
    initialSelection.caseData
  );
  const [activeVerificationId, setActiveVerificationId] = useState<
    string | null
  >(initialSelection.activeVerificationId ?? null);
  const [seenCaseIds, setSeenCaseIds] = useState<string[]>([
    initialSelection.caseData.id,
  ]);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [precedents, setPrecedents] = useState<PrecedentKey[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState<
    PendingVerification[]
  >([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [lastResult, setLastResult] = useState<string>("");
  const [ending, setEnding] = useState<EndingResult | null>(null);
  const [openModal, setOpenModal] = useState<ModalType>(null);

  const currentCaseNumber = history.length + 1;

  const progressText = useMemo(() => {
    return `${currentCaseNumber} / ${maxCasesPerRun}`;
  }, [currentCaseNumber]);

  const previousStats = useMemo(() => {
    return getPreviousStats(history);
  }, [history]);

  const activePrecedentContexts = useMemo(() => {
    if (!currentCase.precedentContext) return [];

    return Object.entries(currentCase.precedentContext)
      .filter(([key]) => precedents.includes(key as PrecedentKey))
      .map(([key, text]) => ({
        key: key as PrecedentKey,
        text,
      }));
  }, [currentCase, precedents]);

  function startGame() {
    const selection = selectInitialCase();

    setStarted(true);
    setCurrentCase(selection.caseData);
    setActiveVerificationId(selection.activeVerificationId ?? null);
    setSeenCaseIds([selection.caseData.id]);
    setStats(initialStats);
    setPrecedents([]);
    setPendingVerifications([]);
    setHistory([]);
    setLastResult("");
    setEnding(null);
    setOpenModal(null);
  }

  function handleChoice(choice: ChoiceKey) {
    if (!currentCase || ending) return;

    const outcome = currentCase.outcomes[choice];
    const nextStats = applyEffect(stats, outcome.effect);

    let nextPrecedents = precedents;
    let unlockedPrecedent: PrecedentKey | undefined;

    if (
      outcome.unlockPrecedent &&
      !precedents.includes(outcome.unlockPrecedent)
    ) {
      unlockedPrecedent = outcome.unlockPrecedent;
      nextPrecedents = [...precedents, outcome.unlockPrecedent];
    }

    let nextPendingVerifications = pendingVerifications;
    let addedVerificationTitle: string | undefined;
    let resolvedVerificationTitle: string | undefined;

    if (currentCase.resolvesVerificationCaseId) {
      const resolvedItem = activeVerificationId
        ? pendingVerifications.find((item) => item.id === activeVerificationId)
        : pendingVerifications.find(
            (item) =>
              item.verificationCaseId === currentCase.resolvesVerificationCaseId
          );

      resolvedVerificationTitle = resolvedItem
        ? `${resolvedItem.title} (${resolvedItem.count}건 정리)`
        : undefined;

      if (resolvedItem) {
        nextPendingVerifications = pendingVerifications.filter(
          (item) => item.id !== resolvedItem.id
        );
      }
    }

    if (outcome.addVerification) {
      const pending = createPendingVerification(
        currentCase,
        currentCaseNumber,
        outcome.addVerification
      );

      const existing = nextPendingVerifications.find(
        (item) => item.verificationCaseId === pending.verificationCaseId
      );

      nextPendingVerifications = mergePendingVerification(
        nextPendingVerifications,
        pending
      );

      const merged = nextPendingVerifications.find(
        (item) => item.verificationCaseId === pending.verificationCaseId
      );

      addedVerificationTitle = existing
        ? `${pending.title} 누적 (${merged?.count ?? existing.count + 1}건)`
        : pending.title;
    }

    const resultTextParts = [outcome.result];

    if (unlockedPrecedent) {
      resultTextParts.push(
        `새 전례 생성: ${precedentLabels[unlockedPrecedent].title}`
      );
    }

    if (addedVerificationTitle) {
      resultTextParts.push(`사후 검증 등록: ${addedVerificationTitle}`);
    }

    if (resolvedVerificationTitle) {
      resultTextParts.push(`사후 검증 처리: ${resolvedVerificationTitle}`);
    }

    const resultText = resultTextParts.join(" ");

    const nextHistoryItem: HistoryItem = {
      id: `${currentCase.id}-${history.length + 1}`,
      caseId: currentCase.id,
      caseTitle: currentCase.title,
      choice,
      result: resultText,
      statsAfter: nextStats,
      unlockedPrecedent,
      addedVerificationTitle,
      resolvedVerificationTitle,
    };

    const nextHistory = [nextHistoryItem, ...history];

    if (
      currentCase.id === finalCaseId ||
      currentCaseNumber >= maxCasesPerRun
    ) {
      const finalEnding = decideEnding(
        nextStats,
        nextPrecedents,
        nextHistory,
        nextPendingVerifications
      );

      setStats(nextStats);
      setPrecedents(nextPrecedents);
      setPendingVerifications(nextPendingVerifications);
      setHistory(nextHistory);
      setLastResult(resultText);
      setEnding(finalEnding);
      return;
    }

    const nextSelection = selectNextCase({
      currentCaseNumber,
      stats: nextStats,
      precedents: nextPrecedents,
      seenCaseIds,
      pendingVerifications: nextPendingVerifications,
    });

    setStats(nextStats);
    setPrecedents(nextPrecedents);
    setPendingVerifications(nextPendingVerifications);
    setHistory(nextHistory);
    setLastResult(resultText);
    setCurrentCase(nextSelection.caseData);
    setActiveVerificationId(nextSelection.activeVerificationId ?? null);
    setSeenCaseIds([...seenCaseIds, nextSelection.caseData.id]);
  }

  function renderStatsModal() {
    return (
      <div className="modal-section">
        <p className="modal-desc">
          현재 예외 심사국과 사회의 상태입니다. 수치 옆의 화살표는 직전
          판단 이전과 비교했을 때 얼마나 변동되었는지를 나타냅니다.
        </p>

        <div className="stat-list modal-stat-list">
          {statOrder.map((key) => {
            const value = stats[key];
            const delta = getStatDelta(stats, previousStats, key);
            const deltaText = getDeltaText(delta);

            return (
              <div className="stat-row" key={key}>
                <div className="stat-label">
                  <span>{statLabels[key]}</span>

                  <div className="stat-value-wrap">
                    {deltaText && (
                      <em className={`stat-delta ${getDeltaClass(key, delta)}`}>
                        {deltaText}
                      </em>
                    )}

                    <strong className={getStatClass(key, value)}>{value}</strong>
                  </div>
                </div>

                <div className="stat-bar">
                  <div
                    className={`stat-fill ${getStatClass(key, value)}`}
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {pendingVerifications.length > 0 && (
          <div className="mini-verification-box">
            <h3>사후 검증 대기</h3>
            <p>
              조건부 승인으로 인해 아직 처리되지 않은 검증 항목이 있습니다.
              미검증 항목은 최종 감사에서 불리하게 작용합니다.
            </p>
            <strong>
              {pendingVerifications.length}종 / {getPendingVerificationTotal(pendingVerifications)}건 대기 중
            </strong>
          </div>
        )}
      </div>
    );
  }

  function renderPrecedentsModal() {
    return (
      <div className="modal-section">
        <p className="modal-desc">
          예외 심사관의 판단으로 생성된 전례입니다. 정식 승인은 강한 전례를,
          조건부 승인은 사후 검증이 필요한 전례를 남깁니다.
        </p>

        {precedents.length === 0 ? (
          <p className="empty-text">아직 생성된 전례가 없습니다.</p>
        ) : (
          <div className="precedent-list">
            {precedents.map((key) => (
              <div className="precedent-card" key={key}>
                <strong>{precedentLabels[key].title}</strong>
                <p>{precedentLabels[key].description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderHistoryModal() {
    return (
      <div className="modal-section">
        <p className="modal-desc">
          지금까지 내린 판단의 기록입니다. 판단의 누적 결과가 전례와 엔딩을
          결정합니다.
        </p>

        {history.length === 0 ? (
          <p className="empty-text">아직 판단 기록이 없습니다.</p>
        ) : (
          <div className="history-list modal-history-list">
            {history.map((item) => (
              <div className="history-item" key={item.id}>
                <div>
                  <strong>CASE · {item.caseTitle}</strong>
                  <span>{getChoiceLabelForCase(getCase(item.caseId), item.choice)}</span>
                </div>

                <p>{item.result}</p>

                {item.unlockedPrecedent && (
                  <em>
                    새 전례 생성: {" "}
                    {precedentLabels[item.unlockedPrecedent].title}
                  </em>
                )}

                {item.addedVerificationTitle && (
                  <em>사후 검증 등록: {item.addedVerificationTitle}</em>
                )}

                {item.resolvedVerificationTitle && (
                  <em>사후 검증 처리: {item.resolvedVerificationTitle}</em>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderVerificationsModal() {
    return (
      <div className="modal-section">
        <p className="modal-desc">
          조건부 승인으로 인해 발생한 사후 검증 목록입니다. 같은 유형의 검증은
          하나의 항목으로 묶이며, 한 번의 사후 검증 사례에서 같은 유형의 책임을
          함께 정리합니다.
        </p>

        {pendingVerifications.length === 0 ? (
          <p className="empty-text">현재 사후 검증 대기 항목이 없습니다.</p>
        ) : (
          <div className="verification-list">
            {pendingVerifications.map((item) => (
              <div className="verification-card" key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <span className={`risk-badge risk-${item.risk}`}>
                    위험도 {getRiskLabel(item.risk)}
                  </span>
                </div>

                <p>{item.note}</p>

                <small>
                  누적 {item.count}건 / 검증 예정: CASE {" "}
                  {item.dueAtCaseNumber}
                  <br />
                  원본 사례: {item.sourceTitles.join(", ")}
                </small>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderModal() {
    if (!openModal) return null;

    const modalTitle =
      openModal === "stats"
        ? "기관 상태"
        : openModal === "precedents"
          ? "전례 기록부"
          : openModal === "verifications"
            ? "사후 검증"
            : "판단 기록";

    return (
      <div className="modal-backdrop" onClick={() => setOpenModal(null)}>
        <section
          className="modal-card"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="modal-header">
            <div>
              <p className="eyebrow">REVIEW PANEL</p>
              <h2>{modalTitle}</h2>
            </div>

            <button
              className="modal-close"
              type="button"
              onClick={() => setOpenModal(null)}
            >
              닫기
            </button>
          </header>

          {openModal === "stats" && renderStatsModal()}
          {openModal === "precedents" && renderPrecedentsModal()}
          {openModal === "history" && renderHistoryModal()}
          {openModal === "verifications" && renderVerificationsModal()}
        </section>
      </div>
    );
  }

  if (!started) {
    return (
      <main className="game-shell start-mode">
        <section className="start-card">
          <p className="eyebrow">EXCEPTION REVIEW OFFICE</p>
          <h1>Judgement Please</h1>
          <h2>예외 심사관</h2>

          <p className="start-desc">
            시민과 단체의 예외 신청을 심사하고, 당신의 판단이 전례가 되어
            다음 사건에 영향을 주는 웹 프로토타입입니다.
          </p>

          <div className="start-rules">
            <div>
              <strong>핵심 루프</strong>
              <span>심사 → 예외 판단 → 전례화 → 정상 사용 / 악용 / 사후 검증</span>
            </div>

            <div>
              <strong>사례 구조</strong>
              <span>전체 사례 풀 45개 중 한 판에 15개 랜덤 등장</span>
            </div>

            <div>
              <strong>목표</strong>
              <span>시민 신뢰와 행정 신뢰를 유지하면서 규칙 오염을 억제</span>
            </div>
          </div>

          <button className="primary-button" onClick={startGame}>
            심사 시작
          </button>
        </section>
      </main>
    );
  }

  if (ending) {
    return (
      <main className="game-shell ending-mode">
        <section className="ending-card">
          <p className="eyebrow">FINAL REPORT</p>
          <h1>{ending.title}</h1>
          <p className="ending-grade">{ending.grade}</p>
          <p className="ending-desc">{ending.description}</p>

          <div className="ending-grid">
            {statOrder.map((key) => (
              <div className="ending-stat" key={key}>
                <span>{statLabels[key]}</span>
                <strong className={getStatClass(key, stats[key])}>
                  {stats[key]}
                </strong>
              </div>
            ))}
          </div>

          <div className="ending-summary">
            <h3>생성된 전례</h3>

            {precedents.length === 0 ? (
              <p>생성된 전례가 없습니다.</p>
            ) : (
              <ul>
                {precedents.map((key) => (
                  <li key={key}>{precedentLabels[key].title}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="ending-summary">
            <h3>미처리 사후 검증</h3>

            {pendingVerifications.length === 0 ? (
              <p>미처리 사후 검증이 없습니다.</p>
            ) : (
              <ul>
                {pendingVerifications.map((item) => (
                  <li key={item.id}>
                    {item.title} ({item.count}건)
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button className="primary-button" onClick={startGame}>
            다시 심사하기
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="game-shell play-mode">
      <header className="game-header">
        <div>
          <p className="eyebrow">JUDGEMENT PLEASE</p>
          <h1>예외 심사관</h1>
        </div>

        <div className="header-actions">
          <button type="button" onClick={() => setOpenModal("stats")}>
            기관 상태
          </button>

          <button type="button" onClick={() => setOpenModal("precedents")}>
            전례 기록부
            {precedents.length > 0 && <span>{precedents.length}</span>}
          </button>

          <button type="button" onClick={() => setOpenModal("verifications")}>
            사후 검증
            {pendingVerifications.length > 0 && (
              <span>{pendingVerifications.length}</span>
            )}
          </button>

          <button type="button" onClick={() => setOpenModal("history")}>
            판단 기록
            {history.length > 0 && <span>{history.length}</span>}
          </button>

          <strong className="case-progress">CASE {progressText}</strong>
        </div>
      </header>

      <section className="play-grid">
        <article className="panel case-panel compact-case-panel">
          <div className="case-topline">
            <span>{currentCase.category}</span>
            <span>#{currentCase.id}</span>
          </div>

          <h2>{currentCase.title}</h2>
          <p className="applicant">신청자: {currentCase.applicant}</p>
          <p className="summary">{currentCase.summary}</p>

          {activePrecedentContexts.length > 0 && (
            <div className="precedent-context-list">
              {activePrecedentContexts.map((item) => (
                <div className="precedent-context" key={item.key}>
                  <strong>{precedentLabels[item.key].title}</strong>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          )}

          {currentCase.caseType === "verification" && (
            <div className="verification-alert">
              이 사례는 이전 조건부 승인에 대한 사후 검증입니다. 여기서의
              판단은 조건부 승인의 책임을 정리하는 역할을 합니다.
            </div>
          )}

          {currentCase.caseType === "backlash" && (
            <div className="verification-alert">
              이 사례는 기각 판단이 누적되었을 때 발생하는 시민 반발입니다.
              일반 신청 심사가 아니라, 이전 판단을 재검토할지 결정하는 장면입니다.
            </div>
          )}

          {currentCase.caseType === "final" && (
            <div className="verification-alert">
              최종 감사 단계입니다. 여기서는 개별 신청을 처리하는 것이 아니라,
              지금까지 만든 전례를 유지·정비·폐기할지 결정합니다.
            </div>
          )}

          <div className="case-info-grid">
            <div className="info-block">
              <h3>제출 서류</h3>
              <ul>
                {currentCase.documents.map((doc) => (
                  <li key={doc}>{doc}</li>
                ))}
              </ul>
            </div>

            <div className="info-block">
              <h3>기록 조회</h3>
              <ul>
                {currentCase.records.map((record) => (
                  <li key={record}>{record}</li>
                ))}
              </ul>
            </div>

            <div className="info-block warning-block">
              <h3>주의 정황</h3>
              <ul>
                {currentCase.riskSigns.map((risk) => (
                  <li key={risk}>{risk}</li>
                ))}
              </ul>
            </div>

            <div className="focus-box">
              <h3>검토 메모</h3>
              <p>{currentCase.focus}</p>
            </div>
          </div>
        </article>

        <aside className="decision-panel">
          <section className="panel choice-card">
            <div className="choice-card-header">
              <p className="eyebrow">DECISION</p>
              <h2>판단 선택</h2>
            </div>

            <div className="choice-panel">
              {choiceOrder.map((choice) => (
                <button
                  className="choice-button simple-choice-button"
                  key={choice}
                  onClick={() => handleChoice(choice)}
                >
                  <strong>{getChoiceLabelForCase(currentCase, choice)}</strong>
                </button>
              ))}
            </div>
          </section>

          <section className="result-panel">
            <strong>직전 판단 결과</strong>

            {lastResult ? (
              <p>{lastResult}</p>
            ) : (
              <p className="empty-text">아직 판단 결과가 없습니다.</p>
            )}
          </section>
        </aside>
      </section>

      {renderModal()}
    </main>
  );
}
