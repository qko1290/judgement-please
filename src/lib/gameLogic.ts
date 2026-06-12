// File: src/lib/gameLogic.ts

import type {
  CaseData,
  EndingResult,
  HistoryItem,
  PendingVerification,
  PrecedentKey,
  StatEffect,
  StatKey,
  Stats,
} from "../types/game";

const MIN_STAT = 0;
const MAX_STAT = 100;

export const statLabels: Record<StatKey, string> = {
  citizenTrust: "시민 신뢰도",
  adminTrust: "행정 신뢰도",
  consistency: "일관성",
  rulePollution: "규칙 오염도",
};

function clamp(value: number) {
  return Math.max(MIN_STAT, Math.min(MAX_STAT, value));
}

export function applyEffect(stats: Stats, effect: StatEffect): Stats {
  return {
    citizenTrust: clamp(stats.citizenTrust + (effect.citizenTrust ?? 0)),
    adminTrust: clamp(stats.adminTrust + (effect.adminTrust ?? 0)),
    consistency: clamp(stats.consistency + (effect.consistency ?? 0)),
    rulePollution: clamp(stats.rulePollution + (effect.rulePollution ?? 0)),
  };
}

export function createPendingVerification(
  currentCase: CaseData,
  currentCaseNumber: number,
  template: {
    title: string;
    note: string;
    risk: PendingVerification["risk"];
    dueAfterCases: number;
    verificationCaseId: string;
  }
): PendingVerification {
  return {
    id: `${currentCase.id}-${currentCaseNumber}-${template.verificationCaseId}`,
    sourceCaseId: currentCase.id,
    sourceTitle: currentCase.title,
    sourceCaseIds: [currentCase.id],
    sourceTitles: [currentCase.title],
    count: 1,
    title: template.title,
    note: template.note,
    risk: template.risk,
    dueAtCaseNumber: currentCaseNumber + template.dueAfterCases,
    verificationCaseId: template.verificationCaseId,
  };
}

export function decideEnding(
  stats: Stats,
  precedents: PrecedentKey[],
  history: HistoryItem[],
  pendingVerifications: PendingVerification[]
): EndingResult {
  const conditionalCount = history.filter(
    (item) => item.choice === "conditional"
  ).length;

  const rejectCount = history.filter((item) => item.choice === "reject").length;
  const approveCount = history.filter((item) => item.choice === "approve").length;

  const hasCorporatePrecedent = precedents.includes("corporateException");

  const unresolvedHighRisk = pendingVerifications.filter(
    (item) => item.risk === "high"
  ).length;

  const pendingRiskScore = pendingVerifications.reduce((sum, item) => {
    const riskWeight = item.risk === "high" ? 2.5 : item.risk === "medium" ? 1.2 : 0.6;
    return sum + riskWeight * Math.max(1, item.count);
  }, 0);

  if (unresolvedHighRisk >= 2 || pendingRiskScore >= 7.5) {
    return {
      title: "미검증 전례 누적 엔딩",
      grade: "사후 검증 실패",
      description:
        "조건부 승인을 통해 빠르게 구제한 사건이 너무 많이 남았다. 감사국은 예외 심사국이 감당할 수 있는 범위를 넘어서 책임을 뒤로 미루었다고 판단했다.",
    };
  }

  if (stats.citizenTrust <= 18 && rejectCount >= 7) {
    return {
      title: "시민 불신 폭발 엔딩",
      grade: "시민 불신",
      description:
        "기준은 유지되었지만 예외 심사국은 시민에게 닫힌 창구가 되었다. 기각된 신청자들의 피해와 항의가 누적되며 기관의 존재 이유가 흔들렸다.",
    };
  }

  if (stats.rulePollution >= 88 || stats.adminTrust <= 18) {
    return {
      title: "예외 심사국 폐지 엔딩",
      grade: "폐지",
      description:
        "전례 악용과 행정 불신이 누적되었다. 감사국은 예외 심사국을 더 이상 통제 가능한 조직으로 보지 않았고, 기관은 폐지되었다.",
    };
  }

  if (
    hasCorporatePrecedent &&
    stats.rulePollution >= 68 &&
    stats.adminTrust < 55
  ) {
    return {
      title: "부패 의혹 엔딩",
      grade: "감사 대상",
      description:
        "기업과 단체를 위한 예외 판단이 누적되며 특혜 의혹이 제기되었다. 시민 구제라는 명분은 남았지만, 예외 심사국은 감사국의 집중 조사 대상이 되었다.",
    };
  }

  if (
    stats.citizenTrust >= 64 &&
    stats.adminTrust >= 65 &&
    stats.consistency >= 60 &&
    stats.rulePollution <= 45 &&
    unresolvedHighRisk === 0 &&
    pendingRiskScore <= 4.5
  ) {
    return {
      title: "굿엔딩: 예외 심사국 정식 제도화",
      grade: "정식 제도화",
      description:
        "시민 구제와 행정 안정 사이의 균형을 유지했다. 고위험 사후 검증은 통제되었고, 예외 판단은 제도 안에서 관리 가능한 수준으로 정리되었다.",
    };
  }

  if (
    stats.rulePollution >= 74 ||
    (stats.rulePollution >= 60 && conditionalCount + approveCount >= 7)
  ) {
    return {
      title: "오염된 전례 엔딩",
      grade: "전례 오염",
      description:
        "좋은 의도로 만든 예외 판단이 지나치게 넓어졌다. 시민과 단체는 전례를 권리처럼 요구했고, 브로커와 이해관계자들은 그 틈을 이용하기 시작했다.",
    };
  }

  if (stats.citizenTrust >= 76 && stats.adminTrust < 52) {
    return {
      title: "시민의 예외 심사관 엔딩",
      grade: "시민 신뢰 우세",
      description:
        "시민들은 당신을 믿었다. 그러나 행정 조직은 당신의 판단을 불안정하다고 보았다. 예외 심사국은 시민에게는 희망이지만 국가에게는 부담이 되었다.",
    };
  }

  if (stats.adminTrust >= 76 && stats.citizenTrust < 52) {
    return {
      title: "차가운 예외 심사관 엔딩",
      grade: "행정 신뢰 우세",
      description:
        "절차와 일관성은 지켰지만 시민들의 신뢰는 낮아졌다. 예외 심사국은 또 다른 행정 장벽으로 기억되었다.",
    };
  }

  if (rejectCount >= 8 && stats.rulePollution <= 30) {
    return {
      title: "닫힌 창구 엔딩",
      grade: "예외 축소",
      description:
        "규칙 오염은 낮게 유지되었지만, 예외 심사국은 정작 예외가 필요한 사람들에게 닫힌 창구가 되었다.",
    };
  }

  return {
    title: "중립 엔딩: 불완전한 예외 심사국",
    grade: "유지",
    description:
      "예외 심사국은 당장 폐지되지는 않았지만, 정식 제도로 인정받기에도 부족했다. 당신의 판단은 가능성과 위험을 동시에 남겼다.",
  };
}
