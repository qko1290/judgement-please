// File: src/components/GameScreen.tsx
"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";

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
  StatEffect,
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

type StatChangePopup = {
  id: string;
  choiceLabel: string;
  result: string;
  before: Stats;
  after: Stats;
  delta: StatEffect;
};

type SoundKind = "start" | "choice" | "modal" | "success" | "warning" | "ending";

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

function getStatDeltaBetween(before: Stats, after: Stats): StatEffect {
  return {
    citizenTrust: after.citizenTrust - before.citizenTrust,
    adminTrust: after.adminTrust - before.adminTrust,
    consistency: after.consistency - before.consistency,
    rulePollution: after.rulePollution - before.rulePollution,
  };
}

function getDeltaClass(key: StatKey, delta: number) {
  if (delta === 0) return "delta-zero";

  if (key === "rulePollution") {
    return delta > 0 ? "delta-bad" : "delta-good";
  }

  return delta > 0 ? "delta-good" : "delta-bad";
}

function getDeltaText(delta: number) {
  if (delta === 0) return "변화 없음";

  const arrow = delta > 0 ? "↑" : "↓";
  const sign = delta > 0 ? "+" : "";

  return `${arrow} ${sign}${delta}`;
}

function getSentenceLines(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n+/g)
    .flatMap((paragraph) =>
      paragraph
        .replace(/\s+/g, " ")
        .trim()
        .replace(/([.!?。！？])\s+/g, "$1|")
        .split("|")
    )
    .map((line) => line.trim())
    .filter(Boolean);
}

function SentenceText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const lines = getSentenceLines(text);

  const paragraphClassName = className
    ? `${className} sentence-text`
    : "sentence-text";

  if (lines.length === 0) {
    return <p className={paragraphClassName} />;
  }

  return (
    <p className={paragraphClassName}>
      {lines.map((line, index) => (
        <Fragment key={`${line}-${index}`}>
          {line}
          {index < lines.length - 1 && <br />}
        </Fragment>
      ))}
    </p>
  );
}

function getResultSummaryLines(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return ["판단 결과가 기록되었습니다.", "기관 상태 변화를 확인하세요."];
  }

  const sentences = normalized
    .replace(/([.!?])\s+/g, "$1|")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);

  if (sentences.length >= 2) {
    return [sentences[0], sentences.slice(1).join(" ")];
  }

  if (normalized.length <= 44) {
    return [normalized, "기관 상태 변화가 다음 심사에 반영됩니다."];
  }

  const middle = Math.floor(normalized.length / 2);
  const leftSpace = normalized.lastIndexOf(" ", middle);
  const rightSpace = normalized.indexOf(" ", middle);
  const splitAt =
    leftSpace > 16
      ? leftSpace
      : rightSpace > 0 && rightSpace < normalized.length - 16
      ? rightSpace
      : middle;

  return [
    normalized.slice(0, splitAt).trim(),
    normalized.slice(splitAt).trim(),
  ];
}

function getResultSummaryParts(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  const parts = normalized
    .split(/(?=처리 기준 추가:|사후 검증 등록:|사후 검증 처리:)/g)
    .map((item) => item.trim())
    .filter(Boolean);

  const mainText = parts[0] ?? "";
  const extras = parts.slice(1).map((item) => {
    if (item.startsWith("처리 기준 추가:")) return "기준 추가";
    if (item.startsWith("사후 검증 등록:")) return "사후 검증 등록";
    if (item.startsWith("사후 검증 처리:")) return "사후 검증 처리";
    return "추가 조치";
  });

  return {
    lines: getResultSummaryLines(mainText),
    extras: Array.from(new Set(extras)),
  };
}

function getRiskLabel(risk: PendingVerification["risk"]) {
  if (risk === "high") return "높음";
  if (risk === "medium") return "보통";
  return "낮음";
}

function getChoiceLabelForCase(caseData: CaseData, choice: ChoiceKey) {
  if (caseData.caseType === "final") {
    const finalLabels: Record<ChoiceKey, string> = {
      approve: "기존 기준 유지",
      conditional: "조건부 정비",
      reject: "문제 기준 폐기",
    };

    return finalLabels[choice];
  }

  if (caseData.caseType === "verification") {
    const verificationLabels: Record<ChoiceKey, string> = {
      approve: "자료 인정",
      conditional: "조건 재정리",
      reject: "적용 범위 제한",
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
      item.stage === "early" && item.caseType === "base" && !item.requiresPrecedent
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

function getAllowedStages(nextCaseNumber: number): CaseData["stage"][] {
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

function AnimatedNumber({ from, to, active }: { from: number; to: number; active: boolean }) {
  const [value, setValue] = useState(from);

  useEffect(() => {
    if (!active) {
      setValue(from);
      return;
    }

    const duration = 620;
    const startedAt = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = Math.round(from + (to - from) * eased);

      setValue(nextValue);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [active, from, to]);

  return <>{value}</>;
}

export default function GameScreen() {
  const initialSelection = useMemo(() => selectInitialCase(), []);

  const [started, setStarted] = useState(false);
  const [currentCase, setCurrentCase] = useState<CaseData>(
    initialSelection.caseData
  );
  const [activeVerificationId, setActiveVerificationId] = useState<string | null>(
    initialSelection.activeVerificationId ?? null
  );
  const [seenCaseIds, setSeenCaseIds] = useState<string[]>([
    initialSelection.caseData.id,
  ]);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [precedents, setPrecedents] = useState<PrecedentKey[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState<
    PendingVerification[]
  >([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [lastResult, setLastResult] = useState("");
  const [ending, setEnding] = useState<EndingResult | null>(null);
  const [openModal, setOpenModal] = useState<ModalType>(null);
  const [statChangePopup, setStatChangePopup] = useState<StatChangePopup | null>(
    null
  );
  const [statAnimationReady, setStatAnimationReady] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);

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

  function getAudioContext() {
    if (typeof window === "undefined") return null;

    const AudioContextConstructor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextConstructor) return null;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextConstructor();
    }

    return audioContextRef.current;
  }

  function playSound(kind: SoundKind, force = false) {
    if (!force && !soundEnabled) return;

    const context = getAudioContext();
    if (!context) return;

    if (context.state === "suspended") {
      void context.resume();
    }

    const now = context.currentTime;
    const gain = context.createGain();
    gain.connect(context.destination);

    const playNote = (frequency: number, delay: number, duration: number, type: OscillatorType = "sine") => {
      const oscillator = context.createOscillator();
      const noteGain = context.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now + delay);
      noteGain.gain.setValueAtTime(0.0001, now + delay);
      noteGain.gain.exponentialRampToValueAtTime(0.045, now + delay + 0.012);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);

      oscillator.connect(noteGain);
      noteGain.connect(gain);
      oscillator.start(now + delay);
      oscillator.stop(now + delay + duration + 0.02);
    };

    gain.gain.setValueAtTime(0.9, now);

    if (kind === "start") {
      playNote(392, 0, 0.11);
      playNote(587, 0.08, 0.16);
    } else if (kind === "choice") {
      playNote(520, 0, 0.07, "triangle");
    } else if (kind === "modal") {
      playNote(440, 0, 0.055);
      playNote(660, 0.055, 0.075);
    } else if (kind === "success") {
      playNote(523, 0, 0.08);
      playNote(659, 0.07, 0.1);
      playNote(784, 0.14, 0.14);
    } else if (kind === "warning") {
      playNote(220, 0, 0.13, "sawtooth");
      playNote(164, 0.09, 0.16, "sawtooth");
    } else if (kind === "ending") {
      playNote(330, 0, 0.12);
      playNote(440, 0.1, 0.12);
      playNote(660, 0.2, 0.22);
    }
  }

  function openReviewModal(modalType: Exclude<ModalType, null>) {
    playSound("modal");
    setOpenModal(modalType);
  }

  function toggleSound() {
    setSoundEnabled((enabled) => {
      const next = !enabled;
      if (!enabled) {
        playSound("modal", true);
      }
      return next;
    });
  }

  useEffect(() => {
    if (!statChangePopup) return;

    setStatAnimationReady(false);

    const timer = window.setTimeout(() => {
      setStatAnimationReady(true);
    }, 760);

    return () => window.clearTimeout(timer);
  }, [statChangePopup?.id]);

  function startGame() {
    playSound("start", true);

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
    setStatChangePopup(null);
    setStatAnimationReady(false);
  }

  function handleChoice(choice: ChoiceKey) {
    if (!currentCase || ending) return;

    playSound("choice");

    const outcome = currentCase.outcomes[choice];
    const statsBefore = stats;
    const nextStats = applyEffect(stats, outcome.effect);
    const delta = getStatDeltaBetween(statsBefore, nextStats);

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
        `처리 기준 추가: ${precedentLabels[unlockedPrecedent].title}`
      );
    }

    if (addedVerificationTitle) {
      resultTextParts.push(`사후 검증 등록: ${addedVerificationTitle}`);
    }

    if (resolvedVerificationTitle) {
      resultTextParts.push(`사후 검증 처리: ${resolvedVerificationTitle}`);
    }

    const resultText = resultTextParts.join("\n");
    const choiceLabel = getChoiceLabelForCase(currentCase, choice);

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

    setStatChangePopup({
      id: `${currentCase.id}-${history.length + 1}-${choice}`,
      choiceLabel,
      result: resultText,
      before: statsBefore,
      after: nextStats,
      delta,
    });

    if (currentCase.id === finalCaseId || currentCaseNumber >= maxCasesPerRun) {
      playSound("ending");
    } else if (addedVerificationTitle || nextStats.rulePollution >= statsBefore.rulePollution + 8) {
      playSound("warning");
    } else if (unlockedPrecedent || resolvedVerificationTitle) {
      playSound("success");
    }

    if (currentCase.id === finalCaseId || currentCaseNumber >= maxCasesPerRun) {
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

  function renderStatMeter(key: StatKey, value: number, delta?: number) {
    const deltaValue = delta ?? 0;
    const deltaText = getDeltaText(deltaValue);

    return (
      <div className={`stat-item ${getStatClass(key, value)}`} key={key}>
        <span>{statLabels[key]}</span>
        <strong>{value}</strong>
        <div className="meter">
          <div style={{ width: `${value}%` }} />
        </div>
        <em className={getDeltaClass(key, deltaValue)}>{deltaText}</em>
      </div>
    );
  }

  function renderAnimatedStatChange(key: StatKey) {
    if (!statChangePopup) return null;

    const before = statChangePopup.before[key];
    const after = statChangePopup.after[key];
    const delta = statChangePopup.delta[key] ?? 0;
    const animatedWidth = statAnimationReady ? after : before;

    return (
      <div
        className={`change-stat-row ${getStatClass(key, after)}`}
        key={key}
      >
        <div className="change-stat-head">
          <span>{statLabels[key]}</span>
          <div className="change-value-wrap">
            <em className={getDeltaClass(key, delta)}>{getDeltaText(delta)}</em>
            <strong className="change-number">
              <AnimatedNumber
                from={before}
                to={after}
                active={statAnimationReady}
              />
            </strong>
          </div>
        </div>

        <div className="change-meter">
          <div className="change-meter-before" style={{ width: `${before}%` }} />
          <div
            className="change-meter-after"
            style={{ width: `${animatedWidth}%` }}
          />
        </div>
      </div>
    );
  }

  function renderStatsModal() {
    return (
      <div className="modal-section">
        <SentenceText
          className="modal-desc"
          text="현재 예외 심사국과 사회의 상태입니다. 수치 옆의 화살표는 직전 판단 이전과 비교했을 때 얼마나 변동되었는지를 나타냅니다."
        />

        <div className="stat-list">
          {statOrder.map((key) => {
            const value = stats[key];
            const delta = stats[key] - previousStats[key];

            return renderStatMeter(key, value, delta);
          })}
        </div>

        {pendingVerifications.length > 0 && (
          <div className="pending-summary">
            <h3>사후 검증 대기</h3>
            <SentenceText
              text="조건부 승인으로 인해 아직 처리되지 않은 검증 항목이 있습니다. 미검증 항목은 최종 감사에서 불리하게 작용합니다."
            />
            <strong>
              {pendingVerifications.length}종 /{" "}
              {getPendingVerificationTotal(pendingVerifications)}건 대기 중
            </strong>
          </div>
        )}
      </div>
    );
  }

  function renderPrecedentsModal() {
    return (
      <div className="modal-section">
        <SentenceText
          className="modal-desc"
          text="예외 심사관의 판단으로 추가된 판단 기준입니다. 정식 승인은 강한 판단 기준을, 조건부 승인은 사후 검증이 필요한 판단 기준을 남깁니다."
        />

        {precedents.length === 0 ? (
          <p className="empty-text">아직 추가된 판단 기준이 없습니다.</p>
        ) : (
          <div className="precedent-list">
            {precedents.map((key) => (
              <div className="precedent-card" key={key}>
                <strong>{precedentLabels[key].title}</strong>
                <SentenceText text={precedentLabels[key].description} />
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
        <SentenceText
          className="modal-desc"
          text="지금까지 내린 판단의 기록입니다. 판단의 누적 결과가 판단 기준과 엔딩을 결정합니다."
        />

        {history.length === 0 ? (
          <p className="empty-text">아직 판단 기록이 없습니다.</p>
        ) : (
          <div className="history-list">
            {history.map((item) => (
              <div className="history-item" key={item.id}>
                <div>
                  <strong>CASE · {item.caseTitle}</strong>
                  <span>{getChoiceLabelForCase(getCase(item.caseId), item.choice)}</span>
                </div>

                <SentenceText text={item.result} />

                {item.unlockedPrecedent && (
                  <em>
                    처리 기준 추가: {" "}
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
        <SentenceText
          className="modal-desc"
          text="조건부 승인으로 인해 발생한 사후 검증 목록입니다. 같은 유형의 검증은 하나의 항목으로 묶이며, 한 번의 사후 검증 사례에서 같은 유형의 책임을 함께 정리합니다."
        />

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

                <SentenceText text={item.note} />

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
        ? "판단 근거"
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

  function renderStatChangePopup() {
    if (!statChangePopup) return null;

    const resultSummary = getResultSummaryParts(statChangePopup.result);

    return (
      <div
        className="modal-backdrop change-backdrop"
        onClick={() => setStatChangePopup(null)}
      >
        <section
          className="modal-card change-card"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="change-summary-box">
            <div className="change-summary-head">
              <strong>{statChangePopup.choiceLabel}</strong>
              {resultSummary.extras.length > 0 && (
                <span className="change-extra-badge">
                  {resultSummary.extras.length === 1
                    ? resultSummary.extras[0]
                    : `추가 조치 ${resultSummary.extras.length}건`}
                </span>
              )}
            </div>
            <p>{resultSummary.lines[0]}</p>
            <p>{resultSummary.lines[1]}</p>
          </div>

          <div className="change-stat-list">
            {statOrder.map((key) => renderAnimatedStatChange(key))}
          </div>

          <button
            className="change-next-button"
            type="button"
            onClick={() => setStatChangePopup(null)}
          >
            {ending ? "최종 결과 보기" : "다음 사례 보기"}
          </button>
        </section>
      </div>
    );
  }

  if (!started) {
    return (
      <main className="game-shell start-mode">
        <section className="start-card">
          <p className="eyebrow">EXCEPTION REVIEW OFFICE</p>

          <h2>Judgement Please</h2>

          <SentenceText
            className="start-desc"
            text="시민과 단체의 예외 신청을 심사하고, 당신의 선택이 판단 기준이 되어 다음 사건에 영향을 줍니다."
          />

          <div className="start-info-grid">
            <div>
              <span>루프</span>
              <strong>심사 → 기준화 → 정상 사용 / 악용 / 사후 검증</strong>
            </div>

            <div>
              <span>사례</span>
              <strong>전체 사례 풀 45개 중 한 판에 15개 랜덤 등장</strong>
            </div>

            <div>
              <span>목표</span>
              <strong>시민 신뢰와 행정 신뢰를 유지하면서 규칙 오염을 억제</strong>
            </div>
          </div>

          <button className="primary-button" type="button" onClick={startGame}>
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
          <strong className="ending-grade">{ending.grade}</strong>

          <SentenceText className="ending-desc" text={ending.description} />

          <div className="ending-grid">
            {statOrder.map((key) => (
              <div className="ending-stat" key={key}>
                <span>{statLabels[key]}</span>
                <strong>{stats[key]}</strong>
              </div>
            ))}
          </div>

          <div className="ending-summary">
            <h3>추가된 판단 기준</h3>

            {precedents.length === 0 ? (
              <p>추가된 판단 기준이 없습니다.</p>
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

          <button className="primary-button" type="button" onClick={startGame}>
            다시 심사하기
          </button>
        </section>

        {renderStatChangePopup()}
      </main>
    );
  }

  return (
    <main className="game-shell play-mode">
      <header className="game-header">
        <div>
          <h1>JUDGEMENT PLEASE</h1>
        </div>

        <div className="header-actions">
          <button type="button" onClick={() => openReviewModal("stats")}>
            기관 상태
          </button>

          <button type="button" onClick={() => openReviewModal("precedents")}>
            판단 근거
            {precedents.length > 0 && (
              <span className="nav-badge">{precedents.length}</span>
            )}
          </button>

          <button type="button" onClick={() => openReviewModal("verifications")}>
            사후 검증
            {pendingVerifications.length > 0 && (
              <span className="nav-badge">{pendingVerifications.length}</span>
            )}
          </button>

          <button type="button" onClick={() => openReviewModal("history")}>
            판단 기록
            {history.length > 0 && (
              <span className="nav-badge">{history.length}</span>
            )}
          </button>

          <button
            className="sound-toggle"
            type="button"
            onClick={toggleSound}
            aria-pressed={soundEnabled}
            title={soundEnabled ? "효과음 끄기" : "효과음 켜기"}
          >
            {soundEnabled ? "효과음 ON" : "효과음 OFF"}
          </button>

          <span className="case-progress">CASE {progressText}</span>
        </div>
      </header>

      <div className="play-grid">
        <section className="case-panel case-enter" key={currentCase.id}>
          <div className="case-panel-top">
            <span className="case-category">{currentCase.category}</span>
            <span className="case-id">#{currentCase.id}</span>
          </div>

          <h2>{currentCase.title}</h2>

          <p className="applicant-line">
            신청자: <strong>{currentCase.applicant}</strong>
          </p>

          <SentenceText className="case-summary" text={currentCase.summary} />

          {activePrecedentContexts.length > 0 && (
            <div className="precedent-context-box">
              <h3>관련 판단 기준</h3>

              {activePrecedentContexts.map((item) => (
                <div key={item.key}>
                  <strong>{precedentLabels[item.key].title}</strong>
                  <SentenceText text={item.text} />
                </div>
              ))}
            </div>
          )}

          {currentCase.caseType === "verification" && (
            <div className="special-notice notice-verification">
              <SentenceText text="이 사례는 이전 조건부 승인에 대한 사후 검증입니다. 여기서의 판단은 조건부 승인의 책임을 정리하는 역할을 합니다." />
            </div>
          )}

          {currentCase.caseType === "backlash" && (
            <div className="special-notice notice-backlash">
              <SentenceText text="이 사례는 기각 판단이 누적되었을 때 발생하는 시민 반발입니다. 일반 신청 심사가 아니라, 이전 판단을 재검토할지 결정하는 장면입니다." />
            </div>
          )}

          {currentCase.caseType === "final" && (
            <div className="special-notice notice-final">
              <SentenceText text="최종 감사 단계입니다. 여기서는 개별 신청을 처리하는 것이 아니라, 지금까지 만든 판단 기준을 유지·정비·폐기할지 결정합니다." />
            </div>
          )}

          <div className="case-info-grid">
            <div className="case-info-card">
              <h3>제출 서류</h3>
              <ul>
                {currentCase.documents.map((doc) => (
                  <li key={doc}>{doc}</li>
                ))}
              </ul>
            </div>

            <div className="case-info-card">
              <h3>기록 조회</h3>
              <ul>
                {currentCase.records.map((record) => (
                  <li key={record}>{record}</li>
                ))}
              </ul>
            </div>

            <div className="case-info-card warning-card">
              <h3>주의 정황</h3>
              <ul>
                {currentCase.riskSigns.map((risk) => (
                  <li key={risk}>{risk}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="focus-box">
            <h3>검토 메모</h3>
            <SentenceText text={currentCase.focus} />
          </div>
        </section>

        <aside className="decision-panel">
          <div className="decision-panel-head">
            <p className="section-kicker">DECISION</p>
            <h2>판단 선택</h2>
          </div>

          <div className="choice-list">
            {choiceOrder.map((choice) => (
              <button
                className="choice-button"
                key={choice}
                type="button"
                onClick={() => handleChoice(choice)}
              >
                {getChoiceLabelForCase(currentCase, choice)}
              </button>
            ))}
          </div>

          <div className="result-panel">
            <span>직전 판단 결과</span>
            {lastResult ? (
              <SentenceText text={lastResult} />
            ) : (
              <p className="empty-text">아직 판단 결과가 없습니다.</p>
            )}
          </div>
        </aside>
      </div>

      {renderModal()}
      {renderStatChangePopup()}
    </main>
  );
}
