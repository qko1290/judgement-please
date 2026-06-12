// File: src/types/game.ts

export type StatKey =
  | "citizenTrust"
  | "adminTrust"
  | "consistency"
  | "rulePollution";

export type ChoiceKey = "approve" | "conditional" | "reject";

export type PrecedentKey =
  | "emergencyMedical"
  | "residenceDelay"
  | "educationRelief"
  | "protectiveHousing"
  | "safetyStandard"
  | "corporateException";

export type CaseType =
  | "base"
  | "normalUse"
  | "abuse"
  | "gray"
  | "backlash"
  | "verification"
  | "final";

export type CaseStage = "early" | "mid" | "late" | "final";

export type VerificationRisk = "low" | "medium" | "high";

export type Stats = Record<StatKey, number>;

export type StatEffect = Partial<Record<StatKey, number>>;

export type VerificationTemplate = {
  title: string;
  note: string;
  risk: VerificationRisk;
  dueAfterCases: number;
  verificationCaseId: string;
};

export type CaseOutcome = {
  result: string;
  effect: StatEffect;
  unlockPrecedent?: PrecedentKey;
  addVerification?: VerificationTemplate;
};

export type CaseData = {
  id: string;
  caseType: CaseType;
  stage: CaseStage;
  weight?: number;
  title: string;
  applicant: string;
  category: string;
  summary: string;
  documents: string[];
  records: string[];
  riskSigns: string[];
  focus: string;
  relatedPrecedent?: PrecedentKey;
  requiresPrecedent?: PrecedentKey;
  minRulePollution?: number;
  maxCitizenTrust?: number;
  precedentContext?: Partial<Record<PrecedentKey, string>>;
  resolvesVerificationCaseId?: string;
  outcomes: Record<ChoiceKey, CaseOutcome>;
};

export type PendingVerification = {
  id: string;
  sourceCaseId: string;
  sourceTitle: string;
  sourceCaseIds: string[];
  sourceTitles: string[];
  count: number;
  title: string;
  note: string;
  risk: VerificationRisk;
  dueAtCaseNumber: number;
  verificationCaseId: string;
};

export type HistoryItem = {
  id: string;
  caseId: string;
  caseTitle: string;
  choice: ChoiceKey;
  result: string;
  statsAfter: Stats;
  unlockedPrecedent?: PrecedentKey;
  addedVerificationTitle?: string;
  resolvedVerificationTitle?: string;
};

export type EndingResult = {
  title: string;
  description: string;
  grade: string;
};
