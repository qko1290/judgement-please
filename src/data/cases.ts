// File: src/data/cases.ts

import type {
  CaseData,
  CaseOutcome,
  ChoiceKey,
  PrecedentKey,
  Stats,
  VerificationTemplate,
} from "../types/game";

type OutcomeProfile =
  | "relief"
  | "risky"
  | "fraud"
  | "corporate"
  | "backlash"
  | "verification";

export const initialStats: Stats = {
  citizenTrust: 50,
  adminTrust: 50,
  consistency: 50,
  rulePollution: 10,
};

export const choiceLabels: Record<ChoiceKey, string> = {
  approve: "정식 승인",
  conditional: "조건부 승인",
  reject: "기각",
};

export const precedentLabels: Record<
  PrecedentKey,
  { title: string; description: string }
> = {
  emergencyMedical: {
    title: "긴급 치료 예외 전례",
    description:
      "긴급 치료 상황에서는 일부 서류가 부족해도 대체 증거와 사후 검증 조건이 있으면 임시 지원할 수 있다는 전례.",
  },
  residenceDelay: {
    title: "기한 초과 체류 예외 전례",
    description:
      "불가피한 사유와 대체 기록이 확인되는 경우, 기한 초과 신청을 제한적으로 인정할 수 있다는 전례.",
  },
  educationRelief: {
    title: "교육 기회 구제 전례",
    description:
      "정량 기준에는 부족하더라도 특수한 가정 사정과 회복 가능성이 확인되면 교육 기회를 일부 구제할 수 있다는 전례.",
  },
  protectiveHousing: {
    title: "보호 거주 비공개 전례",
    description:
      "신변 위험이 있는 신청자는 주소와 일부 신원 자료를 비공개 처리한 상태로 임시 보호를 받을 수 있다는 전례.",
  },
  safetyStandard: {
    title: "안전 기준 조건부 완화 전례",
    description:
      "공동체 행사나 임시 운영에서 일부 안전 기준을 조건부로 완화할 수 있지만, 사고 발생 시 책임이 커지는 전례.",
  },
  corporateException: {
    title: "기업 특별 허가 전례",
    description:
      "지역 경제와 고용 유지를 이유로 기업 규제 예외를 임시 허용할 수 있다는 전례. 특혜 논란과 악용 위험이 크다.",
  },
};

export const verificationTemplates = {
  medical: {
    title: "의료 조건부 승인 사후 검증",
    note: "지원 이후 원본 서류와 실제 치료 진행 여부를 확인해야 한다.",
    risk: "medium",
    dueAfterCases: 3,
    verificationCaseId: "case-v01",
  },
  residence: {
    title: "체류 조건부 승인 사후 검증",
    note: "병원·항공사·신고 기록 등 지연 사유의 원본 자료를 다시 확인해야 한다.",
    risk: "medium",
    dueAfterCases: 4,
    verificationCaseId: "case-v02",
  },
  education: {
    title: "교육 구제 조건부 승인 사후 검증",
    note: "장학·입학·징계 관련 보완 자료가 실제 기준을 충족하는지 확인해야 한다.",
    risk: "low",
    dueAfterCases: 4,
    verificationCaseId: "case-v03",
  },
  housing: {
    title: "보호 거주 조건부 승인 사후 검증",
    note: "비공개 자료와 상담 기관 확인을 사후 대조해야 한다.",
    risk: "medium",
    dueAfterCases: 4,
    verificationCaseId: "case-v04",
  },
  welfare: {
    title: "복지 조건부 승인 사후 검증",
    note: "임시 지원 이후 보완 자료와 실제 사용 내역을 확인해야 한다.",
    risk: "low",
    dueAfterCases: 4,
    verificationCaseId: "case-v05",
  },
  safety: {
    title: "행사 안전 조건부 승인 사후 검증",
    note: "안전 검사와 현장 조건 이행 여부를 확인해야 한다.",
    risk: "high",
    dueAfterCases: 5,
    verificationCaseId: "case-v06",
  },
  corporate: {
    title: "기업·단체 조건부 허가 사후 검증",
    note: "조건부 허가 이후 실제 이행 여부와 자료 조작 가능성을 확인해야 한다.",
    risk: "high",
    dueAfterCases: 5,
    verificationCaseId: "case-v07",
  },
} satisfies Record<string, VerificationTemplate>;

const profileEffects: Record<
  OutcomeProfile,
  Record<ChoiceKey, CaseOutcome["effect"]>
> = {
  relief: {
    approve: { citizenTrust: 11, adminTrust: -7, consistency: -5, rulePollution: 10 },
    conditional: { citizenTrust: 4, adminTrust: 1, consistency: 2, rulePollution: 5 },
    reject: { citizenTrust: -12, adminTrust: 5, consistency: 4, rulePollution: -2 },
  },
  risky: {
    approve: { citizenTrust: 7, adminTrust: -8, consistency: -6, rulePollution: 12 },
    conditional: { citizenTrust: 3, adminTrust: 0, consistency: 1, rulePollution: 7 },
    reject: { citizenTrust: -8, adminTrust: 6, consistency: 5, rulePollution: -4 },
  },
  fraud: {
    approve: { citizenTrust: 1, adminTrust: -16, consistency: -8, rulePollution: 22 },
    conditional: { citizenTrust: -1, adminTrust: -9, consistency: -3, rulePollution: 14 },
    reject: { citizenTrust: -3, adminTrust: 10, consistency: 6, rulePollution: -8 },
  },
  corporate: {
    approve: { citizenTrust: -8, adminTrust: -11, consistency: -6, rulePollution: 20 },
    conditional: { citizenTrust: -6, adminTrust: -2, consistency: 0, rulePollution: 12 },
    reject: { citizenTrust: 4, adminTrust: -2, consistency: 5, rulePollution: -6 },
  },
  backlash: {
    approve: { citizenTrust: 11, adminTrust: -7, consistency: -5, rulePollution: 9 },
    conditional: { citizenTrust: 4, adminTrust: 2, consistency: 3, rulePollution: 3 },
    reject: { citizenTrust: -11, adminTrust: 6, consistency: 4, rulePollution: -3 },
  },
  verification: {
    approve: { citizenTrust: 3, adminTrust: -9, consistency: -5, rulePollution: 12 },
    conditional: { citizenTrust: 1, adminTrust: 7, consistency: 7, rulePollution: -7 },
    reject: { citizenTrust: -7, adminTrust: 7, consistency: -2, rulePollution: -6 },
  },
};

function outcome(
  result: string,
  effect: CaseOutcome["effect"],
  unlockPrecedent?: PrecedentKey,
  addVerification?: VerificationTemplate
): CaseOutcome {
  return {
    result,
    effect,
    unlockPrecedent,
    addVerification,
  };
}

function getDefaultOutcomeText(profile: OutcomeProfile, choice: ChoiceKey) {
  if (profile === "verification") {
    if (choice === "approve") {
      return "보완 자료를 대체로 인정하고 관련 조건부 승인 사건을 종결했다. 처리 속도는 빨랐지만 일부 의심 정황은 남았다.";
    }

    if (choice === "conditional") {
      return "정상 건은 확정하고 의심 건은 적용 조건을 좁혀 재정리했다. 사후 검증 부담은 줄고 기준은 보강되었다.";
    }

    return "의심 사례를 무효 처리하고 해당 전례 적용을 제한했다. 행정 부담은 줄었지만 실제 구제자까지 피해를 볼 수 있다.";
  }

  if (profile === "backlash") {
    if (choice === "approve") {
      return "기존 기각 판단을 공개적으로 재검토하고 일부 신청자를 구제했다. 시민 반발은 누그러졌지만 기각 기준은 흔들렸다.";
    }

    if (choice === "conditional") {
      return "항의 사례를 재심사 대상으로 분류하고 제한적으로 구제했다. 시민 불만을 일부 수습하면서도 기준 정비 여지를 남겼다.";
    }

    return "기존 판단을 유지하고 항의를 민원으로 종결했다. 행정 기준은 지켰지만 시민 불신은 더 커졌다.";
  }

  if (choice === "approve") {
    return "신청을 정식으로 승인했다. 당장의 문제는 해결되었지만, 같은 기준을 요구하는 신청이 늘어날 수 있다.";
  }

  if (choice === "conditional") {
    return "신청을 조건부로 승인했다. 지금은 예외를 인정하되, 이후 보완 자료와 사실관계를 다시 확인해야 한다.";
  }

  return "신청을 기각했다. 기준은 지켰지만, 실제로 도움이 필요한 사람을 돌려보냈을 가능성이 남았다.";
}

function mkOutcomes(params: {
  profile: OutcomeProfile;
  unlock?: Partial<Record<ChoiceKey, PrecedentKey>>;
  verification?: VerificationTemplate;
  text?: Partial<Record<ChoiceKey, string>>;
}): Record<ChoiceKey, CaseOutcome> {
  const effects = profileEffects[params.profile];
  const approveUnlock = params.unlock?.approve ?? params.unlock?.conditional;
  const conditionalUnlock = params.unlock?.conditional ?? params.unlock?.approve;

  return {
    approve: outcome(
      params.text?.approve ?? getDefaultOutcomeText(params.profile, "approve"),
      effects.approve,
      approveUnlock
    ),
    conditional: outcome(
      params.text?.conditional ?? getDefaultOutcomeText(params.profile, "conditional"),
      effects.conditional,
      conditionalUnlock,
      params.verification
    ),
    reject: outcome(
      params.text?.reject ?? getDefaultOutcomeText(params.profile, "reject"),
      effects.reject,
      params.unlock?.reject
    ),
  };
}

export const casePool: CaseData[] = [
  {
    id: "case-01",
    caseType: "base",
    stage: "early",
    weight: 4,
    title: "긴급 수술비 지원 신청",
    applicant: "한지우",
    category: "생계·복지 / 의료",
    summary:
      "신청자는 내일 오전 수술을 앞두고 긴급 의료비 지원을 요청했다. 병원 예약 기록과 진료 내역은 확인되지만, 지원 대상 여부를 판단하는 소득 증빙은 아직 제출되지 않았다.",
    documents: ["수술 예약 확인서", "진료 기록 요약본", "가족관계증명서", "소득 증빙서류 미제출"],
    records: ["수술 일정은 병원에 확인 가능", "최근 의료비 지출 증가", "기존 부정수급 이력 없음"],
    riskSigns: ["지금 승인하면 수술 일정은 지킬 수 있음", "소득 기준 충족 여부는 아직 불명확", "서류 부족 상태에서 지급한 기록이 남음"],
    focus:
      "정식 승인은 강한 의료 예외 전례를 남긴다. 조건부 승인은 수술을 허용하되 소득 증빙과 병원 원본 기록을 나중에 검증해야 한다.",
    relatedPrecedent: "emergencyMedical",
    outcomes: mkOutcomes({
      profile: "relief",
      unlock: { approve: "emergencyMedical", conditional: "emergencyMedical" },
      verification: verificationTemplates.medical,
      text: {
        approve:
          "소득 증빙 없이 정식 승인했다. 신청자는 수술을 받을 수 있게 되었지만, 의료비 지원 기준이 넓어졌다는 강한 전례가 남았다.",
        conditional:
          "수술비를 먼저 지원하되, 수술 후 소득 증빙과 병원 원본 기록을 제출하도록 조건을 달았다.",
        reject:
          "소득 증빙 미제출을 이유로 기각했다. 절차는 지켰지만, 신청자는 수술 일정을 다시 조정해야 한다.",
      },
    }),
  },
  {
    id: "case-02",
    caseType: "base",
    stage: "early",
    weight: 4,
    title: "야간 응급 치료비 신청",
    applicant: "김유림",
    category: "생계·복지 / 의료",
    summary:
      "신청자는 야간 응급실 치료비를 지원해달라고 요청했다. 응급실 방문과 치료 사실은 확인되지만, 보호자 확인서와 최종 청구서가 아직 도착하지 않았다.",
    documents: ["응급실 진료 기록", "치료비 임시 청구서", "보호자 확인서 미제출", "소득 자료 일부"],
    records: ["응급실 방문 기록 확인", "치료비 미납 상태", "이전 지원 이력 없음"],
    riskSigns: ["치료는 이미 이루어짐", "최종 청구 금액은 확정 전", "지급이 늦어지면 채무 문제가 생길 수 있음"],
    focus:
      "치료 사실은 분명하지만 금액과 보호자 확인이 부족하다. 먼저 인정하면 의료 예외 전례가 남고, 조건부 승인은 추후 청구서 검증을 요구한다.",
    relatedPrecedent: "emergencyMedical",
    outcomes: mkOutcomes({
      profile: "relief",
      unlock: { approve: "emergencyMedical", conditional: "emergencyMedical" },
      verification: verificationTemplates.medical,
    }),
  },
  {
    id: "case-03",
    caseType: "base",
    stage: "early",
    weight: 4,
    title: "거주 허가 연장 신청",
    applicant: "로만 K.",
    category: "거주·신분",
    summary:
      "신청자는 입원 때문에 거주 허가 연장 기한을 넘겼다고 주장한다. 입원 기록은 있지만, 실제 입원일과 연장 마감일 사이에 하루 차이가 있다.",
    documents: ["거주 허가증 사본", "입원 확인서", "연장 신청서", "퇴원 예정 기록"],
    records: ["기한 초과 3일", "입원 기록 일부 확인", "이전 연장 신청 이력 1회"],
    riskSigns: ["날짜가 완전히 맞지 않음", "고의 지연인지 단순 착오인지 불명확", "병원 원본 확인은 가능"],
    focus:
      "기한 초과를 인정하면 체류 지연 예외가 전례가 된다. 조건부 승인은 병원 원본과 출입 기록을 나중에 대조해야 한다.",
    relatedPrecedent: "residenceDelay",
    outcomes: mkOutcomes({
      profile: "risky",
      unlock: { approve: "residenceDelay", conditional: "residenceDelay" },
      verification: verificationTemplates.residence,
    }),
  },
  {
    id: "case-04",
    caseType: "base",
    stage: "early",
    weight: 4,
    title: "분실 서류로 인한 체류 지연",
    applicant: "엘레나 V.",
    category: "거주·신분",
    summary:
      "신청자는 소지품 도난으로 체류 서류 제출이 늦어졌다고 설명한다. 경찰 신고 기록은 있지만, 도난 물품 목록에는 체류 서류가 명확히 적혀 있지 않다.",
    documents: ["경찰 신고 접수증", "체류 연장 신청서", "도난 물품 목록", "임시 숙소 영수증"],
    records: ["기한 초과 4일", "도난 신고 접수 확인", "이전 위반 기록 없음"],
    riskSigns: ["도난 신고는 사실로 보임", "체류 서류가 도난 물품 목록에 명확하지 않음", "기한 초과는 이미 발생함"],
    focus:
      "신고 기록만으로 서류 지연을 인정하면 체류 예외 전례가 생긴다. 조건부 승인은 도난 물품 원본 기록 확인을 남긴다.",
    relatedPrecedent: "residenceDelay",
    outcomes: mkOutcomes({
      profile: "risky",
      unlock: { approve: "residenceDelay", conditional: "residenceDelay" },
      verification: verificationTemplates.residence,
    }),
  },
  {
    id: "case-05",
    caseType: "base",
    stage: "early",
    weight: 4,
    title: "장학금 자격 예외 신청",
    applicant: "오세린",
    category: "교육·복지",
    summary:
      "신청자는 소득 기준을 조금 초과해 장학금 대상에서 제외되었다. 다만 가족의 장기 입원비와 부채 상환 내역을 함께 제출했다.",
    documents: ["장학금 신청서", "가족 입원비 영수증", "부채 상환 내역", "소득 기준 초과 통보서"],
    records: ["소득 기준 4% 초과", "성적 기준 충족", "이전 장학금 수혜 이력 없음"],
    riskSigns: ["공식 기준으로는 대상이 아님", "실제 지출 부담은 커 보임", "예외 인정 시 유사 신청이 늘 수 있음"],
    focus:
      "정식 승인은 소득 기준 밖 장학 구제 전례가 된다. 조건부 승인은 학기 중 재심사와 지출 증빙 검증을 요구한다.",
    relatedPrecedent: "educationRelief",
    outcomes: mkOutcomes({
      profile: "relief",
      unlock: { approve: "educationRelief", conditional: "educationRelief" },
      verification: verificationTemplates.education,
    }),
  },
  {
    id: "case-06",
    caseType: "base",
    stage: "early",
    weight: 3,
    title: "입학 서류 기한 예외 신청",
    applicant: "서지후",
    category: "교육·복지",
    summary:
      "신청자는 보호자 병간호 때문에 입학 서류 제출 기한을 놓쳤다. 성적과 면접 점수는 기준을 충족하지만, 서류는 마감 이틀 뒤에 접수되었다.",
    documents: ["입학 예외 신청서", "보호자 입원 기록", "성적 증명서", "면접 결과표"],
    records: ["성적 기준 충족", "서류 제출 2일 지연", "보호자 입원 기록 확인"],
    riskSigns: ["기한을 넘긴 것은 사실", "사유는 일부 확인됨", "예외 인정 시 입학 기한의 의미가 약해질 수 있음"],
    focus:
      "지원자의 자격은 충분해 보인다. 다만 기한 예외를 인정하면 교육 구제 전례가 입학 절차까지 확장된다.",
    relatedPrecedent: "educationRelief",
    outcomes: mkOutcomes({
      profile: "relief",
      unlock: { approve: "educationRelief", conditional: "educationRelief" },
      verification: verificationTemplates.education,
    }),
  },
  {
    id: "case-07",
    caseType: "base",
    stage: "early",
    weight: 4,
    title: "임시 보호 거주 신청",
    applicant: "이서윤",
    category: "거주·신분 / 보호",
    summary:
      "신청자는 가정폭력 피해를 이유로 임시 보호 거주를 요청했다. 경찰 신고 접수번호는 있지만, 신변 보호를 이유로 일부 주소와 진술 내용은 비공개 처리를 요구하고 있다.",
    documents: ["경찰 신고 접수번호", "임시 보호 신청서", "의료 상담 기록 일부", "주소 비공개 요청서"],
    records: ["최근 신고 2회", "상담 기관 연락 가능", "가족 주소와 현재 위치 불일치"],
    riskSigns: ["신변 위험 가능성 있음", "자료 일부를 확인할 수 없음", "비공개 범위가 넓어질 수 있음"],
    focus:
      "정식 승인은 비공개 보호 거주 전례가 된다. 조건부 승인은 상담 기관과 경찰 기록을 사후 대조해야 한다.",
    relatedPrecedent: "protectiveHousing",
    outcomes: mkOutcomes({
      profile: "relief",
      unlock: { approve: "protectiveHousing", conditional: "protectiveHousing" },
      verification: verificationTemplates.housing,
    }),
  },
  {
    id: "case-08",
    caseType: "base",
    stage: "early",
    weight: 3,
    title: "청소년 쉼터 비공개 입소 신청",
    applicant: "새벽 쉼터",
    category: "거주·신분 / 보호",
    summary:
      "쉼터는 미성년 신청자의 보호자 연락 없이 임시 입소를 허용해달라고 요청했다. 학대 정황은 있지만 본인 확인 자료는 부족하다.",
    documents: ["쉼터 입소 요청서", "상담 기록 일부", "학교 상담 교사 메모", "보호자 연락 실패 기록"],
    records: ["귀가 거부 의사 확인", "상담 기록 존재", "신분 자료 일부 부족"],
    riskSigns: ["신속 보호 필요성 있음", "본인 확인 절차 부족", "보호자 통보 여부가 민감함"],
    focus:
      "위험을 피하기 위한 보호 조치와 미성년자 신원 확인 절차 사이에서 판단해야 한다.",
    relatedPrecedent: "protectiveHousing",
    outcomes: mkOutcomes({
      profile: "relief",
      unlock: { approve: "protectiveHousing", conditional: "protectiveHousing" },
      verification: verificationTemplates.housing,
    }),
  },
  {
    id: "case-09",
    caseType: "base",
    stage: "early",
    weight: 3,
    title: "노동 허가 예외 신청",
    applicant: "마르코 D.",
    category: "교육·노동",
    summary:
      "신청자는 공식 자격증은 없지만 8년간 같은 현장 업무를 해왔다고 주장한다. 고용주는 인력 부족으로 즉시 투입이 필요하다고 설명한다.",
    documents: ["고용주 추천서", "현장 경력 확인서", "자격증 미보유 사유서", "안전 교육 이수 확인서"],
    records: ["동종 업무 경력 8년", "공식 자격증 없음", "작업장 사고 이력 없음"],
    riskSigns: ["자격 기준 미충족", "경력은 일부 확인됨", "사고 발생 시 책임 소재가 불명확함"],
    focus:
      "경험이 실제여도 공식 자격을 대신할 수 있는지는 별개의 문제다. 조건부 승인은 감독 근무와 추가 교육 이행을 나중에 검증한다.",
    outcomes: mkOutcomes({ profile: "risky" }),
  },
  {
    id: "case-10",
    caseType: "base",
    stage: "early",
    weight: 3,
    title: "생계 보조금 조기 지급 신청",
    applicant: "박선미",
    category: "생계·복지",
    summary:
      "신청자는 월세 체납으로 퇴거 위기에 놓였다며 생계 보조금을 정기 지급일보다 먼저 지급해달라고 요청했다.",
    documents: ["월세 체납 고지서", "가족 부양 확인서", "최근 지출 내역", "소득 감소 사유서"],
    records: ["최근 3개월 소득 감소", "부정수급 이력 없음", "긴급 지급 요청은 처음"],
    riskSigns: ["퇴거 위험이 가까움", "조기 지급 기준이 느슨해질 수 있음", "사용 내역 확인이 필요함"],
    focus:
      "정식 승인은 선지급 전례를 만든다. 조건부 승인은 사용 내역과 체납 해소 여부를 사후 확인해야 한다.",
    outcomes: mkOutcomes({
      profile: "relief",
      verification: verificationTemplates.welfare,
    }),
  },
  {
    id: "case-11",
    caseType: "base",
    stage: "early",
    weight: 3,
    title: "마을 축제 안전 기준 완화 신청",
    applicant: "남문동 주민회",
    category: "기업·단체 허가 / 행사",
    summary:
      "주민회는 지역 축제를 열기 위해 일부 안전 기준을 조건부로 완화해달라고 요청했다. 소방 동선은 확보했지만 임시 무대 구조 검사는 아직 끝나지 않았다.",
    documents: ["행사 계획서", "소방 동선 배치도", "임시 무대 계약서", "구조 검사 예정 통보서"],
    records: ["지난해 사고 이력 없음", "예상 참여 인원 증가", "구조 검사 결과 미도착"],
    riskSigns: ["지역 여론은 우호적", "핵심 안전 검사는 미완료", "사고 발생 시 예외 심사국 책임이 커짐"],
    focus:
      "정식 승인은 안전 기준 완화 전례를 강하게 남긴다. 조건부 승인은 검사 통과와 인원 제한을 나중에 확인해야 한다.",
    relatedPrecedent: "safetyStandard",
    outcomes: mkOutcomes({
      profile: "risky",
      unlock: { approve: "safetyStandard", conditional: "safetyStandard" },
      verification: verificationTemplates.safety,
    }),
  },
  {
    id: "case-12",
    caseType: "base",
    stage: "early",
    weight: 2,
    title: "환경 규제 예외 신청",
    applicant: "네오메탈 공장",
    category: "기업·단체 허가 / 환경",
    summary:
      "공장은 지역 고용 유지를 이유로 배출 기준 일부 완화를 요청했다. 주민 민원은 늘고 있지만, 공장이 문을 닫으면 지역 고용에도 타격이 크다.",
    documents: ["고용 유지 계획서", "배출량 자체 보고서", "환경 안전 보완 계획", "주민 민원 요약본"],
    records: ["최근 배출 기준 위반 1회", "지역 고용 의존도 높음", "상관의 신속 처리 요청"],
    riskSigns: ["고용 문제와 환경 문제가 충돌함", "자료가 기업 자체 보고서 중심임", "상관의 압박이 있음"],
    focus:
      "기업 예외는 시민 구제보다 특혜 논란이 크다. 정식 승인은 강한 기업 특별 허가 전례가 되고, 조건부 승인은 고위험 검증을 남긴다.",
    relatedPrecedent: "corporateException",
    outcomes: mkOutcomes({
      profile: "corporate",
      unlock: { approve: "corporateException", conditional: "corporateException" },
      verification: verificationTemplates.corporate,
    }),
  },

  {
    id: "case-13",
    caseType: "normalUse",
    stage: "mid",
    requiresPrecedent: "emergencyMedical",
    relatedPrecedent: "emergencyMedical",
    title: "응급 치료비 재신청",
    applicant: "최도윤",
    category: "생계·복지 / 의료",
    summary:
      "다른 신청자가 응급 치료비 지원을 요청했다. 병원 기록과 보호자 진술은 제출되었지만, 소득 증빙은 원본이 아니라 사본이다.",
    documents: ["응급실 진료 기록", "보호자 진술서", "수술 일정표", "소득 증빙 사본"],
    records: ["부정수급 이력 없음", "병원 코드 정상", "서류 원본 일부 미제출"],
    riskSigns: ["이전 의료 예외와 비슷한 구조", "사본만으로는 최종 확인 어려움", "기각 시 전례와 충돌할 수 있음"],
    focus:
      "이미 만든 의료 예외 기준을 이번에도 적용할지, 원본 부족을 이유로 거절할지 판단해야 한다.",
    precedentContext: {
      emergencyMedical:
        "긴급 치료 예외 전례가 생성되어, 신청자는 비슷한 방식의 처리를 기대하고 있다.",
    },
    outcomes: mkOutcomes({
      profile: "relief",
      verification: verificationTemplates.medical,
    }),
  },
  {
    id: "case-14",
    caseType: "normalUse",
    stage: "mid",
    requiresPrecedent: "emergencyMedical",
    relatedPrecedent: "emergencyMedical",
    title: "희귀약 긴급 지원 신청",
    applicant: "문하린",
    category: "생계·복지 / 의료",
    summary:
      "신청자는 희귀약 구매 지원을 요청했다. 전문의 처방은 확인되지만, 약국 견적서는 원본이 아닌 스캔본이다.",
    documents: ["전문의 처방전", "약국 견적서 사본", "진료 기록", "소득 자료 일부"],
    records: ["치료 지속 필요", "약값 급등", "견적서 원본 미제출"],
    riskSigns: ["의료 필요성은 높음", "비용 증빙은 불완전함", "의료 예외 범위가 넓어질 수 있음"],
    focus:
      "수술비가 아닌 약값도 긴급 치료 예외로 볼 수 있는지 판단해야 한다.",
    precedentContext: {
      emergencyMedical:
        "긴급 치료 전례가 있으면 의료비 지원 요구가 수술비 밖으로 확장될 수 있다.",
    },
    outcomes: mkOutcomes({
      profile: "relief",
      verification: verificationTemplates.medical,
    }),
  },
  {
    id: "case-15",
    caseType: "normalUse",
    stage: "mid",
    requiresPrecedent: "residenceDelay",
    relatedPrecedent: "residenceDelay",
    title: "입원 지연 체류 연장 재신청",
    applicant: "사라 M.",
    category: "거주·신분",
    summary:
      "신청자는 퇴원 지연으로 체류 연장 신청이 늦어졌다고 주장한다. 병원 기록은 있지만 보호자 진술과 날짜가 하루 차이 난다.",
    documents: ["퇴원 지연 확인서", "체류 연장 신청서", "보호자 진술서", "진료비 영수증"],
    records: ["기한 초과 2일", "병원 원본 확인 가능", "이전 위반 이력 없음"],
    riskSigns: ["날짜 차이는 작음", "전례와 비슷한 구조", "반복 적용 시 기준이 느슨해질 수 있음"],
    focus:
      "작은 날짜 차이를 허용할지, 전례가 있어도 기한 기준을 엄격히 볼지 판단해야 한다.",
    precedentContext: {
      residenceDelay:
        "기한 초과 체류 예외 전례가 있어, 이번 신청은 이전 판단과 비교될 수 있다.",
    },
    outcomes: mkOutcomes({
      profile: "risky",
      verification: verificationTemplates.residence,
    }),
  },
  {
    id: "case-16",
    caseType: "normalUse",
    stage: "mid",
    requiresPrecedent: "residenceDelay",
    relatedPrecedent: "residenceDelay",
    title: "항공편 결항 체류 지연 신청",
    applicant: "나탈리 P.",
    category: "거주·신분",
    summary:
      "신청자는 항공편 결항 때문에 출국과 체류 연장 신청이 늦어졌다고 설명한다. 결항 안내 문자는 있으나 항공사 원본 통지는 아직 제출되지 않았다.",
    documents: ["항공편 문자 안내", "체류 연장 신청서", "숙박 영수증", "출국 예정표"],
    records: ["기한 초과 1일", "결항 문자 확인", "항공사 원본 미제출"],
    riskSigns: ["초과 기간은 짧음", "원본 통지는 없음", "작은 초과까지 예외화될 수 있음"],
    focus:
      "불가피한 사유로 볼 수 있지만, 원본 확인 없이 예외를 인정해도 되는지가 문제다.",
    precedentContext: {
      residenceDelay:
        "기한 초과 체류 예외 전례가 있으면 작은 초과도 예외 처리 요구로 이어질 수 있다.",
    },
    outcomes: mkOutcomes({
      profile: "risky",
      verification: verificationTemplates.residence,
    }),
  },
  {
    id: "case-17",
    caseType: "normalUse",
    stage: "mid",
    requiresPrecedent: "educationRelief",
    relatedPrecedent: "educationRelief",
    title: "한부모 가정 장학 구제 신청",
    applicant: "강유나",
    category: "교육·복지",
    summary:
      "신청자는 성적 기준을 충족했지만 소득 증빙 제출 시점 문제로 장학 대상에서 제외되었다. 가족 돌봄 기록은 함께 제출되었다.",
    documents: ["장학 신청서", "가족 돌봄 확인서", "소득 증빙 지연 사유서", "성적 증명서"],
    records: ["성적 기준 충족", "소득 증빙 제출 지연", "지도교수 추천 있음"],
    riskSigns: ["자격은 있어 보임", "제출 시점은 어김", "교육 구제 전례가 확대될 수 있음"],
    focus:
      "실제 자격이 충분해 보이는 신청자에게 제출 시점 위반을 얼마나 엄격히 적용할지 판단해야 한다.",
    precedentContext: {
      educationRelief:
        "교육 기회 구제 전례 이후, 비슷한 장학 구제 신청이 늘고 있다.",
    },
    outcomes: mkOutcomes({
      profile: "relief",
      verification: verificationTemplates.education,
    }),
  },
  {
    id: "case-18",
    caseType: "normalUse",
    stage: "mid",
    requiresPrecedent: "educationRelief",
    relatedPrecedent: "educationRelief",
    title: "징계 기록 장학 추천 예외 신청",
    applicant: "정하민",
    category: "교육·복지",
    summary:
      "신청자는 과거 교내 징계 기록 때문에 장학 추천에서 제외되었다. 이후 상담 이수와 피해 보상 기록은 제출되어 있다.",
    documents: ["징계 기록 관련 신청서", "상담 이수 확인서", "피해 보상 확인서", "장학 추천 제외 통보서"],
    records: ["징계 후 2년 경과", "추가 징계 없음", "합의 기록 존재"],
    riskSigns: ["재기 기회와 기록 보존이 충돌함", "학교 측은 신중 의견", "교육 구제 전례가 다른 영역으로 확장될 수 있음"],
    focus:
      "장학 기회를 위해 과거 기록의 불이익을 줄일 수 있는지 판단해야 한다.",
    precedentContext: {
      educationRelief:
        "교육 구제 전례는 장학 기준뿐 아니라 기록 구제 요구로도 확장될 수 있다.",
    },
    outcomes: mkOutcomes({
      profile: "risky",
      verification: verificationTemplates.education,
    }),
  },
  {
    id: "case-19",
    caseType: "normalUse",
    stage: "mid",
    requiresPrecedent: "protectiveHousing",
    relatedPrecedent: "protectiveHousing",
    title: "보호시설 주소 비공개 신청",
    applicant: "미라 보호센터",
    category: "거주·신분 / 보호",
    summary:
      "보호센터는 신변 위험이 있는 신청자의 주소와 일부 신원 자료를 비공개로 처리해달라고 요청했다.",
    documents: ["보호시설 확인서", "경찰 신고 기록", "주소 비공개 요청서", "상담 기록 일부"],
    records: ["위협 신고 접수", "시설 연락 가능", "가족 관계 자료 일부 비공개"],
    riskSigns: ["보호 필요성 있음", "비공개 범위가 넓음", "대리 신청 검증 필요"],
    focus:
      "신청자 보호와 행정 검증 가능성을 동시에 확보할 수 있는지 판단해야 한다.",
    precedentContext: {
      protectiveHousing:
        "보호 거주 비공개 전례가 있어, 비공개 처리 범위가 다시 쟁점이 되었다.",
    },
    outcomes: mkOutcomes({
      profile: "relief",
      verification: verificationTemplates.housing,
    }),
  },
  {
    id: "case-20",
    caseType: "normalUse",
    stage: "mid",
    requiresPrecedent: "safetyStandard",
    relatedPrecedent: "safetyStandard",
    title: "지역 야시장 안전 기준 신청",
    applicant: "서문시장 상인회",
    category: "기업·단체 허가 / 행사",
    summary:
      "상인회는 야시장 개최를 위해 일부 안전 기준 완화를 요청했다. 소방 동선은 확보했지만 전기 설비 검사는 진행 중이다.",
    documents: ["야시장 계획서", "소방 동선 배치도", "전기 설비 검사 예정서", "보험 가입 증명서"],
    records: ["작년 사고 없음", "전기 설비 검사 미완료", "예상 인원 증가"],
    riskSigns: ["지역 경제 효과 있음", "핵심 검사는 미완료", "조건 위반 시 사고 위험"],
    focus:
      "지역 활성화와 안전 검증 사이에서 어느 쪽을 우선할지 판단해야 한다.",
    precedentContext: {
      safetyStandard:
        "안전 기준 조건부 완화 전례가 있으면, 유사 행사가 같은 처리를 기대한다.",
    },
    outcomes: mkOutcomes({
      profile: "risky",
      verification: verificationTemplates.safety,
    }),
  },

  {
    id: "case-21",
    caseType: "abuse",
    stage: "mid",
    requiresPrecedent: "emergencyMedical",
    relatedPrecedent: "emergencyMedical",
    minRulePollution: 10,
    title: "수술 예약증 기반 의료비 신청",
    applicant: "김현수",
    category: "생계·복지 / 의료",
    summary:
      "신청자는 긴급 수술비 지원을 요청했다. 병원 방문 기록은 실제로 존재하지만, 제출된 수술 예약증의 발급 시간이 진료 시간보다 앞서 있다.",
    documents: ["수술 예약증", "진료 기록 사본", "대리 신청서", "소득 증빙 미제출"],
    records: ["진료 시간보다 빠른 예약증 발급", "대리인 연락처가 이전 신청과 유사", "병원 코드 반복"],
    riskSigns: ["실제 병원 방문 기록은 있음", "예약증 시간 순서가 맞지 않음", "전례 문구를 일부 인용함"],
    focus:
      "진짜 진료 기록이 있다는 점 때문에 쉽게 기각하기 어렵지만, 예약증 시간은 명백히 이상하다.",
    precedentContext: {
      emergencyMedical:
        "긴급 치료 전례 이후 의료 신청서에서 유사한 표현과 대리 신청이 증가했다.",
    },
    outcomes: mkOutcomes({ profile: "fraud" }),
  },
  {
    id: "case-22",
    caseType: "abuse",
    stage: "mid",
    requiresPrecedent: "emergencyMedical",
    relatedPrecedent: "emergencyMedical",
    minRulePollution: 12,
    title: "대리 신청된 치료비 묶음 접수",
    applicant: "브라이트 상담소",
    category: "생계·복지 / 의료",
    summary:
      "상담소가 여러 명의 의료비 지원 신청서를 한꺼번에 제출했다. 신청서 문장은 서로 비슷하고, 일부 병원 예약증은 같은 시간대에 발급되어 있다.",
    documents: ["치료비 지원 신청서 묶음", "대리 신청 위임장", "병원 예약증 사본", "상담소 확인서"],
    records: ["동일 대리인 반복 등장", "신청서 문장 구조 유사", "병원 예약증 발급 시간대 집중"],
    riskSigns: ["일괄 처리하면 빠름", "개별 사정 확인이 부족함", "상담소가 전례 문구를 반복 사용함"],
    focus:
      "실제 도움이 필요한 신청자가 섞여 있을 수 있지만, 묶음 접수 전체를 그대로 믿기에는 위험하다.",
    precedentContext: {
      emergencyMedical:
        "긴급 치료 예외 전례 이후, 의료 지원 신청서에서 비슷한 문구가 늘었다.",
    },
    outcomes: mkOutcomes({ profile: "fraud" }),
  },
  {
    id: "case-23",
    caseType: "abuse",
    stage: "mid",
    weight: 2,
    requiresPrecedent: "residenceDelay",
    relatedPrecedent: "residenceDelay",
    minRulePollution: 10,
    title: "입원 기록 기반 체류 연장 신청",
    applicant: "데니스 R.",
    category: "거주·신분",
    summary:
      "신청자는 입원 때문에 체류 연장 신청이 늦었다고 주장한다. 서류 형식은 갖췄지만, 입원 확인서의 병동 코드가 현재 사용되지 않는 코드와 일치한다.",
    documents: ["입원 확인서", "체류 연장 신청서", "퇴원 예정 기록", "진료비 영수증 사본"],
    records: ["병동 코드 폐기 이력", "기한 초과 5일", "연락 가능한 병원 담당자 없음"],
    riskSigns: ["문서 형식은 정상처럼 보임", "병동 코드가 오래된 코드임", "병원 담당자 확인이 되지 않음"],
    focus:
      "겉으로는 입원 사유가 있어 보이지만, 병원 코드와 연락 가능성이 맞지 않는다.",
    precedentContext: {
      residenceDelay:
        "기한 초과 체류 전례가 있으면 입원 지연 사유가 반복적으로 제출될 수 있다.",
    },
    outcomes: mkOutcomes({ profile: "fraud" }),
  },
  {
    id: "case-24",
    caseType: "abuse",
    stage: "mid",
    weight: 2,
    requiresPrecedent: "educationRelief",
    relatedPrecedent: "educationRelief",
    minRulePollution: 10,
    title: "부채 자료를 제출한 장학 예외 신청",
    applicant: "윤태오",
    category: "교육·복지",
    summary:
      "신청자는 가계 부채를 이유로 장학금 예외를 요청했다. 부채 자료는 제출되었지만 발급 기관명이 실제 기관명과 조금 다르다.",
    documents: ["장학 신청서", "부채 상환 내역", "가족 의료비 영수증", "소득 기준 초과 통보서"],
    records: ["발급 기관명 오기", "상환 내역 금액 반복", "성적 기준 충족"],
    riskSigns: ["어려움이 실제일 가능성은 있음", "핵심 자료 출처가 흔들림", "금액 패턴이 반복됨"],
    focus:
      "진짜 곤란한 학생일 수도 있지만, 장학금 판단의 핵심 근거인 부채 자료가 의심스럽다.",
    precedentContext: {
      educationRelief:
        "교육 기회 구제 전례 이후, 기준 밖 장학 신청이 늘고 있다.",
    },
    outcomes: mkOutcomes({ profile: "fraud" }),
  },
  {
    id: "case-25",
    caseType: "abuse",
    stage: "late",
    weight: 2,
    minRulePollution: 10,
    title: "경력 확인서 기반 노동 허가 신청",
    applicant: "라울 S.",
    category: "교육·노동",
    summary:
      "신청자는 현장 경력을 근거로 노동 허가 예외를 요청했다. 실제로 비슷한 일을 한 기록은 있지만, 제출된 경력 확인서의 회사 도장이 실제 도장과 다르다.",
    documents: ["경력 확인서", "고용주 추천서", "안전 교육 확인서", "자격증 미보유 사유서"],
    records: ["회사 도장 불일치", "추천서 작성자 퇴사 이력", "현장 사고 이력 없음"],
    riskSigns: ["경력 일부는 사실일 수 있음", "핵심 확인서 위조 가능성", "고용주는 빠른 허가를 요구함"],
    focus:
      "경험이 실제로 있더라도, 위조 가능성이 있는 서류를 근거로 예외를 줄 수 있는지가 문제다.",
    outcomes: mkOutcomes({ profile: "fraud" }),
  },
  {
    id: "case-26",
    caseType: "abuse",
    stage: "late",
    weight: 2,
    minRulePollution: 12,
    title: "신규 업체 견적서 기반 보조금 신청",
    applicant: "새빛 지역재단",
    category: "기업·단체 허가 / 보조금",
    summary:
      "재단은 노후 주거지 개선 사업을 위해 보조금 선지급을 요청했다. 주민 동의는 충분하지만, 견적서를 낸 업체 중 일부는 최근에 만들어졌다.",
    documents: ["보조금 신청서", "공사 견적서 3부", "주민 동의서", "재단 활동 보고서"],
    records: ["최근 설립 업체 포함", "비슷한 견적 금액 반복", "재단 관계자와 업체 주소 일부 일치"],
    riskSigns: ["공익 목적은 명확함", "업체 독립성이 의심됨", "선지급 후 회수가 어려움"],
    focus:
      "좋은 목적의 사업처럼 보이지만, 돈을 받을 업체들이 실제로 독립적인지 불분명하다.",
    outcomes: mkOutcomes({ profile: "fraud" }),
  },
  {
    id: "case-27",
    caseType: "abuse",
    stage: "late",
    weight: 2,
    minRulePollution: 12,
    title: "자체 환경 측정 자료 제출",
    applicant: "네오메탈 공장",
    category: "기업·단체 허가 / 환경",
    summary:
      "공장은 배출 기준 완화를 다시 요청했다. 자체 보고서는 기준 초과 폭이 작다고 주장하지만, 주민 민원과 외부 측정 의뢰가 늘고 있다.",
    documents: ["고용 유지 계획서", "배출량 자체 보고서", "환경 안전 보완 계획", "주민 민원 요약본"],
    records: ["최근 배출 기준 위반 1회", "자체 보고서 중심", "주민 민원 증가"],
    riskSigns: ["고용 문제는 실제임", "자료가 기업 자체 보고서에 치우침", "축소 보고 가능성 있음"],
    focus:
      "고용을 이유로 기업 자료를 믿을지, 외부 검증 없이 예외를 주는 위험을 우선할지 판단해야 한다.",
    outcomes: mkOutcomes({
      profile: "corporate",
      unlock: { approve: "corporateException", conditional: "corporateException" },
      verification: verificationTemplates.corporate,
    }),
  },
  {
    id: "case-28",
    caseType: "abuse",
    stage: "late",
    weight: 2,
    minRulePollution: 10,
    title: "안전 점검 예정서 기반 행사 신청",
    applicant: "은하 이벤트",
    category: "기업·단체 허가 / 행사",
    summary:
      "행사 업체는 안전 점검 예정서를 제출하며 기준 완화를 요청했다. 그러나 점검 기관 담당자 번호가 공식 번호와 다르다.",
    documents: ["행사 계획서", "안전 점검 예정서", "무대 설치 계약서", "보험 가입 증명서"],
    records: ["담당자 번호 불일치", "점검 기관 공식 접수 내역 없음", "행사 일정 임박"],
    riskSigns: ["점검 예정이라고 주장함", "공식 접수 기록은 없음", "일정이 가까워 압박이 큼"],
    focus:
      "점검이 곧 이루어진다는 말을 믿을지, 공식 접수 기록이 없다는 점을 더 크게 볼지 판단해야 한다.",
    outcomes: mkOutcomes({ profile: "fraud" }),
  },
  {
    id: "case-29",
    caseType: "abuse",
    stage: "late",
    weight: 2,
    requiresPrecedent: "protectiveHousing",
    relatedPrecedent: "protectiveHousing",
    minRulePollution: 10,
    title: "반복 상담소의 보호 거주 대리 신청",
    applicant: "해솔 상담소",
    category: "거주·신분 / 보호",
    summary:
      "상담소가 여러 명의 보호 거주 신청을 대리 제출했다. 일부 신청자의 상담 기록은 거의 같은 문장으로 작성되어 있다.",
    documents: ["대리 신청서 묶음", "상담 기록 사본", "주소 비공개 요청서", "시설 확인서"],
    records: ["상담 문구 반복", "대리인 동일", "일부 연락처 확인 불가"],
    riskSigns: ["실제 피해자 가능성 있음", "대리 신청 남용 가능성 있음", "비공개 범위가 넓어짐"],
    focus:
      "실제 보호가 필요한 사람을 놓치지 않으면서, 반복 대리 신청을 그대로 통과시켜도 되는지 판단해야 한다.",
    precedentContext: {
      protectiveHousing:
        "보호 거주 비공개 전례가 있으면, 대리 신청과 익명 신청이 함께 증가할 수 있다.",
    },
    outcomes: mkOutcomes({ profile: "fraud" }),
  },

  {
    id: "case-30",
    caseType: "gray",
    stage: "mid",
    weight: 2,
    title: "벌금 납부 유예 신청",
    applicant: "문지혁",
    category: "사법·처벌 예외",
    summary:
      "신청자는 생계 곤란을 이유로 벌금 납부 유예를 요청했다. 소득 감소 기록은 있지만, 최근 고가 물품 구매 기록도 있다.",
    documents: ["벌금 납부 유예 신청서", "소득 감소 증빙", "카드 사용 내역", "가족 부양 확인서"],
    records: ["최근 소득 감소", "고가 물품 구매 기록", "부양 가족 2명"],
    riskSigns: ["생계 곤란은 일부 확인됨", "소비 기록이 설명되지 않음", "납부 회피 가능성도 있음"],
    focus:
      "신청자의 어려움이 실제인지, 벌금 납부를 미루기 위한 선택인지 판단해야 한다.",
    outcomes: mkOutcomes({ profile: "risky" }),
  },
  {
    id: "case-31",
    caseType: "gray",
    stage: "mid",
    weight: 2,
    title: "해고 구제 신청",
    applicant: "임태훈",
    category: "교육·노동",
    summary:
      "신청자는 회사의 부당 압박으로 해고되었다고 주장한다. 회사는 반복 지각 기록을 냈지만, 근무표에는 잦은 초과근무 흔적도 있다.",
    documents: ["해고 구제 신청서", "지각 기록표", "근무표", "동료 진술서"],
    records: ["지각 기록 5회", "초과근무 다수", "회사 징계 절차 일부 누락"],
    riskSigns: ["신청자 과실도 있음", "회사 절차 문제도 있음", "한쪽만 명확히 잘못했다고 보기 어려움"],
    focus:
      "지각 기록만 볼지, 회사의 징계 절차와 초과근무 상황까지 함께 볼지 판단해야 한다.",
    outcomes: mkOutcomes({ profile: "risky" }),
  },
  {
    id: "case-32",
    caseType: "gray",
    stage: "mid",
    weight: 2,
    title: "실종자 가족의 대리 신청",
    applicant: "박연주",
    category: "거주·신분 / 대리 신청",
    summary:
      "신청자는 실종된 가족을 대신해 임시 지원을 요청했다. 가족 관계는 확인되지만, 지원금은 신청자 계좌로 지급해달라고 요청하고 있다.",
    documents: ["가족관계증명서", "실종 신고 접수증", "대리 신청서", "생활비 지출 내역"],
    records: ["실종 신고 9일 전", "가족 관계 확인", "신청자 계좌로 지급 요청"],
    riskSigns: ["긴급성 있음", "본인 확인 불가능", "지원금 수령자 문제가 있음"],
    focus:
      "본인이 없는 상황에서 가족 대리 신청을 어디까지 인정할 수 있는지 판단해야 한다.",
    outcomes: mkOutcomes({
      profile: "relief",
      verification: verificationTemplates.welfare,
    }),
  },
  {
    id: "case-33",
    caseType: "gray",
    stage: "late",
    title: "장애 판정 재심사 요청",
    applicant: "노은재",
    category: "생계·복지 / 장애",
    summary:
      "신청자는 기준상 장애 판정에서 탈락했지만 실제 생활에는 큰 어려움이 있다고 주장한다. 병원 소견은 있으나 수치 기준은 미달이다.",
    documents: ["재심사 요청서", "의사 소견서", "생활 불편 진술서", "기존 판정 결과"],
    records: ["수치 기준 미달", "의사 소견 존재", "생활 보조 필요성 주장"],
    riskSigns: ["정량 기준과 현실 차이", "재심 기준 확대 가능성", "의료 소견 해석 필요"],
    focus:
      "수치 기준은 미달이지만 실제 생활 기능 저하를 어디까지 인정할지 판단해야 한다.",
    outcomes: mkOutcomes({
      profile: "relief",
      verification: verificationTemplates.welfare,
    }),
  },
  {
    id: "case-34",
    caseType: "gray",
    stage: "late",
    title: "공공임대 우선 배정 요청",
    applicant: "남가은",
    category: "거주·복지",
    summary:
      "신청자는 대기 순번이 뒤쪽이지만 자녀의 치료 문제를 이유로 공공임대 우선 배정을 요청했다.",
    documents: ["공공임대 신청서", "자녀 진료 기록", "현재 주거 계약서", "대기 순번 통보서"],
    records: ["대기 순번 낮음", "치료 병원과 거주지 거리 문제", "기존 임대료 체납 없음"],
    riskSigns: ["치료 접근성 문제 있음", "대기 순번 예외가 됨", "다른 대기자 반발 가능"],
    focus:
      "개별 사정이 대기 질서를 넘을 만큼 충분한지 판단해야 한다.",
    outcomes: mkOutcomes({
      profile: "relief",
      verification: verificationTemplates.welfare,
    }),
  },

  {
    id: "case-35",
    caseType: "backlash",
    stage: "mid",
    maxCitizenTrust: 35,
    title: "기각 피해자의 언론 제보",
    applicant: "지역신문 사회부",
    category: "시민 반발 / 언론",
    summary:
      "최근 기각된 신청자 중 한 명이 언론에 제보했다. 절차상 기각은 맞았지만, 제보 내용에는 실제 피해가 커졌다는 정황도 포함되어 있다.",
    documents: ["언론 질의서", "이전 기각 결정문", "피해자 진술 요약", "민원 접수 내역"],
    records: ["시민 신뢰도 하락", "기각 사례 다수", "언론 문의 증가"],
    riskSigns: ["결정 자체는 규정에 맞음", "사회적 반발이 커짐", "재검토를 허용하면 기각 기준이 흔들릴 수 있음"],
    focus:
      "기각 일변도는 행정 안정에는 좋지만, 시민에게는 닫힌 창구처럼 보일 수 있다.",
    outcomes: mkOutcomes({ profile: "backlash" }),
  },
  {
    id: "case-36",
    caseType: "backlash",
    stage: "late",
    maxCitizenTrust: 35,
    title: "시민단체 긴급 항의",
    applicant: "시민권익연대",
    category: "시민 반발 / 집단 민원",
    summary:
      "시민단체가 예외 심사국 앞에서 항의서를 제출했다. 단체는 예외 심사국이 실제로는 예외를 거의 인정하지 않는다고 주장한다.",
    documents: ["항의서", "기각 사례 목록", "피해자 면담 기록", "공개 질의서"],
    records: ["기각 결정 누적", "시민 신뢰 낮음", "언론 보도 가능성"],
    riskSigns: ["일부 사례는 절차상 기각이 맞음", "반발을 무시하면 시민 신뢰가 더 떨어짐", "단체 요구를 모두 수용하면 기준이 흔들림"],
    focus:
      "시민 반발을 단순 민원으로 볼지, 제도 운영의 경고 신호로 볼지 판단해야 한다.",
    outcomes: mkOutcomes({ profile: "backlash" }),
  },
  {
    id: "case-37",
    caseType: "backlash",
    stage: "late",
    maxCitizenTrust: 35,
    title: "실제 피해 악화 보고",
    applicant: "내부 감찰관",
    category: "시민 반발 / 사후 보고",
    summary:
      "이전 기각 사례 중 일부에서 실제 피해가 악화되었다는 내부 보고가 올라왔다. 기각 당시 서류 부족은 사실이었지만, 상황의 긴급성도 사실이었다.",
    documents: ["내부 보고서", "이전 기각 결정문", "피해 악화 기록", "담당자 의견서"],
    records: ["기각 후 피해 악화", "서류 부족은 사실", "긴급성 판단 미흡 지적"],
    riskSigns: ["기각 판단을 뒤집으면 행정 일관성 저하", "무시하면 시민 신뢰 추가 하락", "후속 보완 기준 필요"],
    focus:
      "과거 판단을 바로잡을지, 기존 결정을 유지할지 선택해야 한다.",
    outcomes: mkOutcomes({ profile: "backlash" }),
  },

  {
    id: "case-v01",
    caseType: "verification",
    stage: "late",
    title: "의료 조건부 승인 사후 검증",
    applicant: "감사국 검토 요청",
    category: "사후 검증 / 의료",
    resolvesVerificationCaseId: "case-v01",
    summary:
      "조건부로 승인했던 의료 지원 사례의 보완 서류가 도착했다. 일부는 정상적으로 확인되었지만, 한 건은 원본 발급 시간이 신청 당시 기록과 맞지 않는다.",
    documents: ["조건부 승인 목록", "보완 소득 증빙", "병원 원본 기록", "대리 신청자 연락 내역"],
    records: ["정상 제출 사례 존재", "발급 시간 불일치 사례 존재", "사후 검증 기한 도래"],
    riskSigns: ["그대로 인정하면 허위 가능성이 남음", "전부 기각하면 실제 구제자도 피해를 봄", "검증 기준 정리가 필요함"],
    focus:
      "조건부 승인은 여기서 책임으로 돌아온다. 빠른 정리와 엄격한 검증 중 무엇을 택할지 결정해야 한다.",
    outcomes: mkOutcomes({ profile: "verification" }),
  },
  {
    id: "case-v02",
    caseType: "verification",
    stage: "late",
    title: "체류 조건부 승인 사후 검증",
    applicant: "체류심사 감사관",
    category: "사후 검증 / 체류",
    resolvesVerificationCaseId: "case-v02",
    summary:
      "조건부로 인정했던 체류 지연 사례의 원본 자료가 도착했다. 일부는 불가피한 지연으로 확인되었지만, 일부는 날짜 설명이 맞지 않는다.",
    documents: ["병원 원본 기록", "항공사 결항 통지", "출입 기록", "조건부 승인 목록"],
    records: ["정상 지연 사유 존재", "날짜 불일치 사례 존재", "체류 예외 전례 인용 증가"],
    riskSigns: ["넓게 인정하면 체류 기한 기준이 약해짐", "좁게 보면 실제 지연자도 피해", "전례 적용 기준 정리 필요"],
    focus:
      "체류 예외 전례가 실제 구제였는지, 기한 기준을 흐린 결정이었는지 정리해야 한다.",
    outcomes: mkOutcomes({ profile: "verification" }),
  },
  {
    id: "case-v03",
    caseType: "verification",
    stage: "late",
    title: "교육 구제 조건부 승인 사후 검증",
    applicant: "교육지원 담당관",
    category: "사후 검증 / 교육",
    resolvesVerificationCaseId: "case-v03",
    summary:
      "조건부로 인정한 교육 구제 사례의 보완 자료가 제출되었다. 일부는 실제 사정이 확인되었지만, 일부는 기준 밖 요구가 반복되고 있다.",
    documents: ["장학 보완 자료", "입학 지연 사유서", "상담 기록", "성적 증명서"],
    records: ["정상 보완 사례 존재", "기준 밖 신청 증가", "전례 인용 문구 반복"],
    riskSigns: ["교육 기회 구제 성과 있음", "기준 확대 위험 있음", "일괄 처리는 위험함"],
    focus:
      "교육 구제 전례를 유지하되 적용 조건을 좁힐지 판단해야 한다.",
    outcomes: mkOutcomes({ profile: "verification" }),
  },
  {
    id: "case-v04",
    caseType: "verification",
    stage: "late",
    title: "보호 거주 조건부 승인 사후 검증",
    applicant: "보호시설 검토 요청",
    category: "사후 검증 / 보호",
    resolvesVerificationCaseId: "case-v04",
    summary:
      "조건부 보호 거주 사례의 상담 기관 회신이 도착했다. 실제 위험이 확인된 사례도 있지만, 일부 대리 신청은 자료가 부족하다.",
    documents: ["상담 기관 회신", "비공개 주소 처리 목록", "대리 신청 위임장", "경찰 신고 보완 자료"],
    records: ["실제 위험 사례 확인", "대리 신청 자료 부족", "비공개 범위 감사 대상"],
    riskSigns: ["보호 필요성과 검증 부족이 섞여 있음", "주소 공개 시 위험이 있음", "비공개 남용 가능성도 있음"],
    focus:
      "피해자 보호를 약화하지 않으면서 허위 대리 신청을 걸러내야 한다.",
    outcomes: mkOutcomes({ profile: "verification" }),
  },
  {
    id: "case-v05",
    caseType: "verification",
    stage: "late",
    title: "복지 조건부 승인 사후 검증",
    applicant: "복지 검증 담당관",
    category: "사후 검증 / 복지",
    resolvesVerificationCaseId: "case-v05",
    summary:
      "조건부로 인정한 복지 지원 사례의 사용 내역과 보완 자료가 도착했다. 일부는 실제 곤란이 확인되었지만, 일부는 지출 목적이 불명확하다.",
    documents: ["보완 소득 자료", "지출 증빙", "상담 기록", "임시 지원 목록"],
    records: ["정상 보완 사례 존재", "지출 목적 불명확 사례 존재", "기준 밖 지원 요구 증가"],
    riskSigns: ["실제 구제와 기준 남용이 섞여 있음", "일괄 처리하면 위험함", "전례 정비 필요"],
    focus:
      "조건부 구제를 유지하되 기준을 좁힐지, 넓게 인정할지 결정해야 한다.",
    outcomes: mkOutcomes({ profile: "verification" }),
  },
  {
    id: "case-v06",
    caseType: "verification",
    stage: "late",
    title: "행사 안전 조건부 승인 사후 검증",
    applicant: "안전감사 담당관",
    category: "사후 검증 / 행사 안전",
    resolvesVerificationCaseId: "case-v06",
    summary:
      "조건부로 허가한 행사들의 검사 결과가 제출되었다. 일부 행사는 조건을 지켰지만, 일부는 인원 제한과 대피 동선을 어겼다.",
    documents: ["행사 조건부 허가 목록", "안전 검사 결과", "현장 사진", "민원 신고 요약"],
    records: ["조건 이행 사례 존재", "인원 제한 위반 사례 존재", "대피 동선 미준수 보고"],
    riskSigns: ["공동체 행사는 유지됨", "사고 위험이 실제로 증가함", "안전 전례 정비 필요"],
    focus:
      "안전 조건부 허가가 실제 통제 장치였는지, 형식적인 허가였는지 판단해야 한다.",
    outcomes: mkOutcomes({ profile: "verification" }),
  },
  {
    id: "case-v07",
    caseType: "verification",
    stage: "late",
    title: "기업·단체 조건부 허가 사후 검증",
    applicant: "감사국 기업팀",
    category: "사후 검증 / 기업·단체",
    resolvesVerificationCaseId: "case-v07",
    summary:
      "조건부로 승인한 기업·단체 허가의 이행 자료가 제출되었다. 일부 조건은 지켜졌지만, 자체 보고서와 외부 보고서의 수치 차이가 크다.",
    documents: ["조건부 허가 목록", "월별 이행 보고서", "외부 측정 보고서", "민원 요약본"],
    records: ["자체 보고서와 외부 측정 차이", "조건 일부 이행", "주민 민원 지속"],
    riskSigns: ["기업 특혜 논란 가능", "조건부 승인 실패 가능", "감사국 압박 증가"],
    focus:
      "조건부 허가가 실제 통제 장치였는지, 형식적인 면죄부였는지 판단해야 한다.",
    outcomes: mkOutcomes({ profile: "verification" }),
  },

  {
    id: "case-final",
    caseType: "final",
    stage: "final",
    title: "감사국 최종 전례 정비 요청",
    applicant: "감사국",
    category: "최종 검토",
    summary:
      "감사국은 예외 심사국의 예외 판단과 조건부 승인, 전례 적용 사례를 종합 검토하겠다고 통보했다.",
    documents: ["전례 적용 사례표", "조건부 승인 미검증 목록", "민원 및 언론 반응 요약", "감사국 질의서"],
    records: ["전례 인용 신청 증가", "조건부 승인 누적", "규칙 오염도와 신뢰도 종합 검토"],
    riskSigns: ["기관 존속 여부와 연결됨", "전례 정비 필요", "미검증 사례가 있으면 불리함"],
    focus:
      "지금까지 만든 전례를 유지할지, 조건을 좁힐지, 문제 사례를 폐기할지 결정해야 한다.",
    precedentContext: {
      emergencyMedical: "긴급 치료 전례는 구제 성과와 대리 신청 문제를 동시에 남겼다.",
      residenceDelay: "기한 초과 체류 전례는 불가피한 지연 구제와 날짜 기준 논란을 함께 만들었다.",
      educationRelief: "교육 기회 구제 전례는 긍정적 여론을 얻었지만 기준 밖 신청을 늘렸다.",
      protectiveHousing: "보호 거주 비공개 전례는 보호 성과와 비공개 범위 논란을 함께 남겼다.",
      safetyStandard: "안전 기준 완화 전례는 공동체 행사에는 도움이 되었지만 사고 책임 문제가 남았다.",
      corporateException: "기업 특별 허가 전례는 감사국이 가장 민감하게 보는 항목이다.",
    },
    outcomes: mkOutcomes({
      profile: "verification",
      text: {
        approve:
          "감사국에 기존 전례를 대부분 유지하겠다고 보고했다. 구제 성과는 강조되었지만, 일부 느슨한 전례는 계속 위험 요소로 남았다.",
        conditional:
          "전례는 유지하되 적용 조건을 좁히고 사후 검증 기준을 보강하겠다고 보고했다. 예외 심사국의 제도화 가능성이 가장 높아졌다.",
        reject:
          "문제 소지가 큰 전례를 폐기하고 향후 적용을 제한하겠다고 보고했다. 행정 안정은 높아졌지만, 시민들은 예외 심사국이 후퇴했다고 느꼈다.",
      },
    }),
  },
];

export const finalCaseId = "case-final";
export const maxCasesPerRun = 15;
export const maxVerificationCasesPerRun = 3;
