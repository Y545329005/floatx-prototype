// 正式法务文本（2026-10-22 · 公司提供 docx 原文）
import { termsOfUseSections, privacyPolicySections, riskDisclosureSections } from './legalTexts';

// ========== KYC 状态定义 ==========
export const KYC_STATUS = {
  NOT_STARTED: 'NOT_STARTED',       // 未开始
  IN_PROGRESS: 'IN_PROGRESS',       // 进行中
  PENDING_REVIEW: 'PENDING_REVIEW', // 待审核
  REQUIRES_ACTION: 'REQUIRES_ACTION', // 待补件（后台退回补件，2026-08-13 P1）
  APPROVED: 'APPROVED',             // 已通过
  REJECTED: 'REJECTED',             // 已拒绝
  EXPIRED: 'EXPIRED',               // 已过期
};

// ========== PI 认证状态（2026-08-14 · 独立 PI 审核流） ==========
// PI 认证独立于 KYC：KYC = 实名认证（所有人）；PI = 资格认证（≥800 万资产 / 持牌，
// 认购私募才需要）。前端 KYCPI 独立声明页 + 后台独立 PI 审核（用户拍板"独立 PI 审核流"）。
export const PI_STATUS = {
  NOT_SUBMITTED: 'NOT_SUBMITTED', // 未申报（KYC 已通过但未签 PI 声明）
  PENDING_REVIEW: 'PENDING_REVIEW', // 待审核（已提交 PI 申请）
  APPROVED: 'APPROVED',           // 已认证（isPI=true）
  REJECTED: 'REJECTED',           // 已拒绝（资质未达标/材料不符）
  EXPIRED: 'EXPIRED',             // 已过期（到期未重认证，激活 2026-08-06 死状态）
};

// ========== PEP 状态（2026-08-26 新增） ==========
export const PEP_STATUS = {
  NONE: 'none',                 // 非PEP
  DOMESTIC: 'domestic',         // 国内PEP
  FOREIGN: 'foreign',           // 外国PEP
  INTERNATIONAL: 'international', // 国际组织PEP
  ASSOCIATE: 'associate',       // PEP关联方
};

// ========== 风险等级（2026-08-26 新增） ==========
export const RISK_LEVEL = {
  LOW: 'low',                   // 低风险
  MEDIUM: 'medium',             // 中风险
  HIGH: 'high',                 // 高风险
};

// ========== KYC Profile（身份信息） ==========
export const kycProfile = {
  // 基本信息
  fullName: '',
  fullNameEn: '',
  gender: '',
  birthDate: '',
  nationality: '',
  // 专业投资者资格
  piType: '',           // 'asset' | 'professional'
  piProof: null,       // PI 资格证明文件
  piCertified: false,  // 是否已签署专业投资者声明
  // 证件照片
  idDocType: 'HK_ID',  // 'PASSPORT' | 'HK_ID'
  idDocNumber: '',
  idDocExpiry: '',
  idDocFront: null,
  idDocBack: null,
  idDocHandheld: null,
  // eKYC 核验结果（2026-08-27 T3 · PRD §3.10 技术证据层）
  // 第三方服务商技术核验：人脸比对 + 活体检测 + 证件 OCR，结果随申请入队供后台决策
  ekycResult: null,     // null=未核验 | { status:'passed'|'failed', score, vendorRef, livenessPass, ocrPass, verifiedAt, failReason? }
  // 地址证明
  addressProofType: 'utility',  // 'utility' | 'bank' | 'gov'
  addressProof: null,
  addressLine: '',
  // 审核
  submittedAt: null,
  rejectReason: null,
};

// ========== 测试账号数据 ==========
export const testAccounts = {
  // 账号A：KYC 已通过，直接体验 APP 全功能
  approved: {
    id: 'u1',
    name: '张三',
    email: 'chen.my@example.com',
    avatar: null,
    isPI: true,
    piVerified: true,
    accountManager: {
      id: 'am1',
      name: '王慧敏',
      role: '专属客户经理',
      phone: '+852 9300 1122',
      email: 'huimin.wang@highblockhk.com',
      imType: 'WhatsApp',
      im: '+852 9300 1122',
    },
    account: {
      hkd: 12500000,
      usd: 850000,
      frozen: 2000000,
    },
    pi: {
      investorNo: 'INV-0001',
      verifiedAt: '2026-05-18',
      expiresAt: '2027-05-17',
      category: '专业投资者',
      basis: '持有至少 HK$8,000,000 的投资组合',
      status: 'verified',
    },
    security: {
      twoFactorEnabled: true,
      lastLogin: '2026-08-01 09:12',
      loginDevice: 'Mac · Chrome',
    },
    // 合规字段（2026-08-26 新增）
    pepStatus: PEP_STATUS.NONE,           // 非PEP
    riskLevel: RISK_LEVEL.LOW,            // 低风险
    lastRiskAssessment: '2026-08-15',     // 最后风险评估时间
    complianceNotes: '正常客户，无合规风险', // 合规备注
    kyc_status: KYC_STATUS.APPROVED,
    kyc_profile: {
      fullName: '张三',
      fullNameEn: 'ZHANG SAN',
      gender: 'M',
      birthDate: '1980-05-15',
      nationality: '中国香港',
      piType: 'asset',
      piProof: 'images/demo-pi-proof.jpg',
      piCertified: true,
      idDocType: 'HK_ID',
      idDocNumber: 'A123456(7)',
      idDocExpiry: '2030-12-31',
      idDocFront: 'images/demo-id-front.jpg',
      idDocBack: 'images/demo-id-back.jpg',
      idDocHandheld: 'images/demo-id-handheld.jpg',
      ekycResult: {               // eKYC 核验结果（T3 · PRD §3.10 技术证据层）
        status: 'passed',
        score: 0.96,
        vendorRef: 'EKYC202605101430001',
        livenessPass: true,
        ocrPass: true,
        verifiedAt: '2026-05-10 14:30:05',
        failReason: null,
      },
      addressProofType: 'bank',
      addressProof: 'images/demo-address.jpg',
      addressLine: '香港中环皇后大道中 99 号',
      submittedAt: '2026-05-10 14:30:00',
      rejectReason: null,
      // PEP声明字段（2026-08-26 新增）
      pepDeclared: 'no',
      pepPositionType: '',
      pepOrganization: '',
      pepTenure: '',
      // CRS/FATCA字段（2026-08-26 新增；2026-10-16 C 组逐地 TIN + B 组财务字段补演示数据）
      taxResidencies: ['HK'],
      taxDetails: { HK: { tin: 'A123456(7)', noTinReason: '', noTinNote: '' } },
      employmentStatus: 'employed',
      incomeSources: ['salary', 'investment'],
      usPerson: false,
      tin: '',
      crsDeclared: true,
    },
  },
  // 账号B：KYC 未开始，需要走完 KYC 流程
  pending: {
    id: 'u2',
    name: '李四',
    email: 'li.si@example.com',
    avatar: null,
    isPI: false,
    piVerified: false,
    accountManager: {
      id: 'am1',
      name: '王慧敏',
      role: '专属客户经理',
      phone: '+852 9300 1122',
      email: 'huimin.wang@highblockhk.com',
      imType: 'WhatsApp',
      im: '+852 9300 1122',
    },
    account: {
      hkd: 5000000,
      usd: 0,
      frozen: 0,
    },
    pi: {
      investorNo: null,
      verifiedAt: null,
      expiresAt: null,
      category: null,
      basis: null,
      // 2026-08-14 PI 独立审核流：'none' 未申报（旧 'pending' 语义"未认证"与新"待审核"冲突——
      // 用户侧 Profile 入口据此区分：none=申报入口 / pending=待审核 / verified=已认证 / rejected=被拒可重提）
      status: 'none',
    },
    security: {
      twoFactorEnabled: false,
      lastLogin: null,
      loginDevice: null,
    },
    // 合规字段（2026-08-26 新增）
    pepStatus: PEP_STATUS.NONE,           // 非PEP
    riskLevel: RISK_LEVEL.LOW,            // 低风险
    lastRiskAssessment: null,             // 未评估
    complianceNotes: '',                  // 无备注
    kyc_status: KYC_STATUS.NOT_STARTED,
    kyc_profile: {
      fullName: '',
      fullNameEn: '',
      gender: '',
      birthDate: '',
      nationality: '',
      piType: '',
      piProof: null,
      piCertified: false,
      idDocType: 'HK_ID',
      idDocNumber: '',
      idDocExpiry: '',
      idDocFront: null,
      idDocBack: null,
      idDocHandheld: null,
      addressProofType: 'utility',
      addressProof: null,
      addressLine: '',
      submittedAt: null,
      rejectReason: null,
    },
  },
  // 账号C：PEP用户（用于演示PEP审查流程）
  pep: {
    id: 'u3',
    name: '王五',
    email: 'wang.wu@example.com',
    avatar: null,
    isPI: true,
    piVerified: true,
    accountManager: {
      id: 'am1',
      name: '王慧敏',
      role: '专属客户经理',
      phone: '+852 9300 1122',
      email: 'huimin.wang@highblockhk.com',
      imType: 'WhatsApp',
      im: '+852 9300 1122',
    },
    account: {
      hkd: 15000000,
      usd: 2000000,
      frozen: 5000000,
    },
    pi: {
      investorNo: 'INV-0003',
      verifiedAt: '2026-06-01',
      expiresAt: '2027-06-01',
      category: '专业投资者',
      basis: '持有至少 HK$8,000,000 的投资组合',
      status: 'verified',
    },
    security: {
      twoFactorEnabled: true,
      lastLogin: '2026-08-20 14:30',
      loginDevice: 'iPhone · Safari',
    },
    // 合规字段（2026-08-26 新增）
    pepStatus: PEP_STATUS.FOREIGN,        // 外国PEP
    riskLevel: RISK_LEVEL.HIGH,           // 高风险
    lastRiskAssessment: '2026-08-20',     // 最后风险评估时间
    complianceNotes: '外国政府前部长，需要增强尽调', // 合规备注
    kyc_status: KYC_STATUS.APPROVED,
    kyc_profile: {
      fullName: '王五',
      fullNameEn: 'WANG WU',
      gender: 'M',
      birthDate: '1975-08-20',
      nationality: '某国',
      piType: 'asset',
      piProof: 'images/demo-pi-proof.jpg',
      piCertified: true,
      idDocType: 'PASSPORT',
      idDocNumber: 'P12345678',
      idDocExpiry: '2030-12-31',
      idDocFront: 'images/demo-id-front.jpg',
      idDocBack: null,
      idDocHandheld: 'images/demo-id-handheld.jpg',
      addressProofType: 'bank',
      addressProof: 'images/demo-address.jpg',
      addressLine: '香港中环金融街88号',
      // 2026-10-16：u3（PEP 演示账号）补 CRS + 财务演示数据，后台抽屉各卡均有内容
      taxResidencies: ['US'],
      taxDetails: { US: { tin: '123-45-6789', noTinReason: '', noTinNote: '' } },
      employmentStatus: 'self_employed',
      incomeSources: ['business', 'rent'],
      submittedAt: '2026-05-25 10:00:00',
      rejectReason: null,
    },
  },
};

// 当前用户（默认用账号A：已通过KYC）
export let currentUser = { ...testAccounts.approved };

// 当前 KYC 状态快捷访问
export const kycStatus = currentUser.kyc_status;
export const kycProfileData = currentUser.kyc_profile;

export const wallet = {
  hkd: { label: '港币', symbol: 'HK$', balance: 12500000, frozen: 3000000 },
  usd: { label: '美元', symbol: '$', balance: 850000, frozen: 0 },
  cny: { label: '人民币', symbol: '¥', balance: 320000, frozen: 0 },
};

// ========== 币种口径（2026-10-28 基金一期） ==========
// 基金以 CNH（离岸人民币）计价，钱包沿用历史键 cny（人民币）。键名不改，避免动
// 出入金/换汇/后台核销的既有取键逻辑（`currency.toLowerCase()`）；对外展示统一走下面的元数据。
// 冻结口径：申购冻结不落 wallet.frozen（那一位是历史换汇/项目配额冻结，二期会随换汇页恢复），
// 改为按「待确认申购单金额」实时派生（getFundFrozen），单一事实源，避免两处各记一笔。
export const CURRENCY_META = {
  HKD: { walletKey: 'hkd', symbol: 'HK$', label: '港币' },
  USD: { walletKey: 'usd', symbol: '$', label: '美元' },
  CNH: { walletKey: 'cny', symbol: '¥', label: '离岸人民币' },
  CNY: { walletKey: 'cny', symbol: '¥', label: '人民币' },
};

export function walletKeyOf(currency) {
  return CURRENCY_META[String(currency || '').toUpperCase()]?.walletKey || null;
}

export function walletAccountOf(currency) {
  const key = walletKeyOf(currency);
  return key ? wallet[key] : null;
}

// ========== 钱包归属护栏（2026-10-28 P1 复盘） ==========
// wallet 只代表「当前登录的演示账户」，本身没有 userId 维度。但后台资金审核列表里混着其他客户
// （吴世昌/刘倩/陈志远…）的单据——直接写 wallet，会把别人的钱加进演示账户（实测：确认陈志远的
// 500 万充值，张三余额凭空 +500 万）。这里按 userId 分流：演示账户走 wallet 并同步流水/资产曲线；
// 其他客户只更新 testAccounts 里各自的 account，不碰全局钱包。真正的多用户分账留到接后端时做。
export function applyWalletDelta(userId, currency, delta) {
  const key = walletKeyOf(currency) || String(currency || '').toLowerCase();
  const owner = userId || currentUser.id;
  if (owner === currentUser.id) {
    const w = wallet[key];
    if (!w) return { ok: false, key, self: true };
    w.balance = Math.max(0, w.balance + delta);
    if (currentUser.account[key] !== undefined) currentUser.account[key] = w.balance;
    return { ok: true, key, self: true };
  }
  // 其他客户：只有 testAccounts 里建档的账户才有余额可记。未建档的客户（u31/u32… 来自 KYC/线索）
  // 在本原型里没有钱包，不能因此让后台核销“点不动”——单据照常流转，只是不记余额（接后端后补）。
  const acct = Object.values(testAccounts).find(a => a.id === owner);
  if (!acct) return { ok: true, key, self: false, tracked: false };
  if (!acct.account) acct.account = { hkd: 0, usd: 0, frozen: 0 };
  acct.account[key] = Math.max(0, (acct.account[key] || 0) + delta);
  return { ok: true, key, self: false, tracked: true };
}

// 单据归属账户视图：self = 当前演示账户（读全局钱包）；tracked=false 表示该客户在 mock 里没有钱包
export function walletOwnerView(userId) {
  const owner = userId || currentUser.id;
  if (owner === currentUser.id) return { self: true, tracked: true, account: null };
  const acct = Object.values(testAccounts).find(a => a.id === owner);
  return { self: false, tracked: !!acct, account: acct?.account || null };
}

// 折合港币（mock 近似汇率；仅用于资产总览的跨币种加总）
export const FX_TO_HKD = { HKD: 1, USD: 7.8, CNH: 1.08, CNY: 1.08 };

export function convertToHKD(amount, currency) {
  return amount * (FX_TO_HKD[String(currency || '').toUpperCase()] || 1);
}

// 银行卡白名单（2026-08-19 老板确认）：出入金只允许「已验证」卡。
// 验证门槛：向平台指定账户转账 ≥ 1万 HKD（或等值 USD），后台核对到账后置白名单。
// whitelistStatus: 'verified'(白名单) | 'verifying'(验证中) | 'unverified'(未验证)
export const bankCards = [
  {
    id: 'bc1',
    userId: 'u1',
    bank: '汇丰银行',
    branch: '香港',
    holder: 'ZHANG SAN',
    maskedNo: '**** 4567',
    cardNo: '6222 0234 5678 4567',  // 完整卡号（mock 演示值，接后端由真实账户体系提供；用户侧展示用 maskedNo，审核抽屉授权查看 cardNo）
    type: '香港账户',
    currency: 'HKD',
    whitelistStatus: 'verified',   // 已通过白名单验证（演示预置）
    verifiedAt: '2026-07-28 10:22:00',
    verifiedAmount: 10000,
  },
  {
    id: 'bc2',
    userId: 'u1',
    bank: '中国银行（香港）',
    branch: '香港',
    holder: 'ZHANG SAN',
    maskedNo: '**** 8901',
    cardNo: '6217 8501 2345 8901',
    type: '香港账户',
    currency: 'USD',
    whitelistStatus: 'verified',
    verifiedAt: '2026-07-28 10:30:00',
    verifiedAmount: 2000,          // 2000 USD 等值 ≥1万 HKD
  },
  {
    id: 'bc3',
    userId: 'u1',
    bank: '星展银行',
    branch: '香港',
    holder: 'ZHANG SAN',
    maskedNo: '**** 3312',
    cardNo: '6278 9920 1456 3312',
    type: '香港账户',
    currency: 'HKD',
    whitelistStatus: 'unverified', // 新增卡未验证（演示白名单流程）
    verifiedAt: null,
    verifiedAmount: null,
  },
];

export const exchangeRates = {
  'hkd-usd': { from: 'HKD', to: 'USD', rate: 0.128, updatedAt: '2026-07-30 09:00' },
  'usd-hkd': { from: 'USD', to: 'HKD', rate: 7.81, updatedAt: '2026-07-30 09:00' },
  'cny-hkd': { from: 'CNY', to: 'HKD', rate: 1.07, updatedAt: '2026-07-30 09:00' },
  // 2026-10-28：基金以 CNH 计价，补一条离岸人民币汇率（与 cny 同值，mock 近似）
  'cnh-hkd': { from: 'CNH', to: 'HKD', rate: 1.07, updatedAt: '2026-10-28 09:00' },
};

// 默认汇率副本（配置页"恢复默认"用——exchangeRates 被原地修改，须保留初始值）
const DEFAULT_EXCHANGE_RATES = {
  'hkd-usd': { from: 'HKD', to: 'USD', rate: 0.128, updatedAt: '2026-07-30 09:00' },
  'usd-hkd': { from: 'USD', to: 'HKD', rate: 7.81, updatedAt: '2026-07-30 09:00' },
  'cny-hkd': { from: 'CNY', to: 'HKD', rate: 1.07, updatedAt: '2026-07-30 09:00' },
  'cnh-hkd': { from: 'CNH', to: 'HKD', rate: 1.07, updatedAt: '2026-10-28 09:00' },
};

export function resetExchangeRates(operator) {
  Object.keys(exchangeRates).forEach(k => {
    if (DEFAULT_EXCHANGE_RATES[k]) exchangeRates[k] = { ...DEFAULT_EXCHANGE_RATES[k] };
  });
  logAudit({ operator, category: 'config', action: 'update', target: '汇率配置', targetId: '', note: '恢复默认汇率' });
  Storage.save();
  return true;
}

export const projects = [
  {
    id: 'p1',
    coverImage: 'images/p1-quantum.jpg',
    title: 'QuantumCore Technologies',
    company: 'QuantumCore Ltd.',
    stage: 'C轮',
    sector: '量子计算',
    location: '香港',
    valuation: 3500000000,
    status: 'raising',
    currency: 'HKD',
    riskLevel: '中高风险',
    ipoPlan: '目标港股 / 美股 IPO，预计 2028 年递交上市申请',
    roundNote: '公司释放少量老股供专业投资者参与，额度有限，以平台与项目方协调结果为准。',
    intentDeadline: '2026-08-31',
    allocationRule: 'large-first',
    waitlist: [],
    investorCount: 42,
    recentInvestors: [
      { id: 'r01', investorNo: 'INV-8821', createdAt: '2026-07-29 18:23:40' },
      { id: 'r02', investorNo: 'INV-7714', createdAt: '2026-07-28 09:15:22' },
      { id: 'r03', investorNo: 'INV-6630', createdAt: '2026-07-26 14:02:11' },
      { id: 'r04', investorNo: 'INV-5587', createdAt: '2026-07-24 11:47:03' },
      { id: 'r05', investorNo: 'INV-4492', createdAt: '2026-07-21 16:30:55' },
    ],
    tags: ['硬科技', '量子', 'DeepTech'],
    highlights: [
      '全球首个室温量子比特芯片原型通过验证',
      '与香港科技大学建立联合实验室',
      '团队来自MIT、Stanford、港科大',
    ],
    description: 'QuantumCore Technologies 致力于开发基于新型拓扑量子比特的通用量子计算解决方案。公司已获得多项国际专利，并在2025年完成室温量子比特原型验证，是全球少数在该路线取得突破性进展的企业。本轮融资主要用于工程化开发和商业化落地。',
    documents: [
      { name: '投资备忘录.pdf', url: '#' },
      { name: '尽调报告.pdf', url: '#' },
      { name: '财务预测模型.xlsx', url: '#' },
    ],
    events: ['e1', 'e3'],
    team: [
      { name: '张振宇', role: 'CEO', bg: '前Google量子计算研究员' },
      { name: 'Dr. Lisa Wong', role: 'CTO', bg: 'MIT物理学博士' },
    ],
    financials: {
      revenue: 12000000,
      burnRate: 8000000,
      grossMargin: '68%',
    },
  },
  {
    id: 'p2',
    coverImage: 'images/p2-biotech.jpg',
    title: 'BioNova Therapeutics',
    company: 'BioNova Ltd.',
    stage: 'C+轮',
    sector: '生物医药',
    location: '深圳',
    valuation: 1800000000,
    status: 'raising',
    currency: 'HKD',
    riskLevel: '高风险',
    ipoPlan: '目标港股 18A 上市，预计 2027 年递交上市申请',
    roundNote: '公司开放少量新增份额给专业投资者，额度优先分配。',
    intentDeadline: '2026-08-15',
    allocationRule: 'pro-rata',
    waitlist: [],
    investorCount: 28,
    recentInvestors: [
      { id: 'r06', investorNo: 'INV-9301', createdAt: '2026-07-30 10:05:18' },
      { id: 'r07', investorNo: 'INV-8156', createdAt: '2026-07-29 15:42:09' },
      { id: 'r08', investorNo: 'INV-7423', createdAt: '2026-07-27 09:33:41' },
      { id: 'r09', investorNo: 'INV-6602', createdAt: '2026-07-25 17:20:26' },
      { id: 'r10', investorNo: 'INV-5718', createdAt: '2026-07-22 13:08:14' },
    ],
    tags: ['生物科技', '肿瘤', '创新药'],
    highlights: [
      '核心管线已进入临床II期，初步数据优于现有标准疗法',
      '拥有全球自主知识产权的PROTAC平台',
      '已获FDA孤儿药认定',
    ],
    description: 'BioNova 专注于新一代蛋白降解技术（PROTAC）在肿瘤治疗领域的应用。核心管线BN-001针对非小细胞肺癌，在临床I/II期显示出优秀的安全性和有效性。公司同时拥有3个临床前管线，覆盖乳腺癌、前列腺癌等领域。',
    documents: [
      { name: '投资备忘录.pdf', url: '#' },
      { name: '临床数据摘要.pdf', url: '#' },
    ],
    events: ['e2'],
    team: [
      { name: 'Dr. 赵明辉', role: 'CEO', bg: '前辉瑞肿瘤事业部VP' },
      { name: 'Dr. 王思远', role: 'CSO', bg: '中科院上海药物所教授' },
    ],
    financials: {
      revenue: 3000000,
      burnRate: 12000000,
      grossMargin: null,
    },
  },
  {
    id: 'p3',
    coverImage: 'images/p3-robot.jpg',
    title: 'SkyNet Robotics',
    company: 'SkyNet Tech Ltd.',
    stage: 'B轮',
    sector: '机器人',
    location: '新加坡',
    valuation: 750000000,
    status: 'raising',
    currency: 'HKD',
    riskLevel: '高风险',
    ipoPlan: '目标港股 IPO，预计 2028 年启动上市筹备',
    roundNote: '公司定向释放少量份额供专业投资者参与。',
    intentDeadline: null,
    allocationRule: 'large-first',
    waitlist: [],
    investorCount: 16,
    recentInvestors: [
      { id: 'r11', investorNo: 'INV-7038', createdAt: '2026-07-28 19:11:37' },
      { id: 'r12', investorNo: 'INV-6245', createdAt: '2026-07-27 10:58:23' },
      { id: 'r13', investorNo: 'INV-5190', createdAt: '2026-07-23 15:26:48' },
      { id: 'r14', investorNo: 'INV-4387', createdAt: '2026-07-20 09:44:05' },
      { id: 'r15', investorNo: 'INV-3516', createdAt: '2026-07-17 14:19:32' },
    ],
    tags: ['机器人', '仓储物流', 'AI'],
    highlights: [
      '已签约3家头部物流企业试点，预计2027年量产',
      '自研SLAM算法精度达到行业领先水平',
      '获新加坡政府DeepTech基金配套资助',
    ],
    description: 'SkyNet Robotics 研发面向仓储物流场景的自主移动机器人（AMR）及智能调度系统。其核心优势在于自研的3D视觉SLAM算法和群体智能调度平台，在复杂仓储环境下的定位精度和通行效率均优于行业平均水平。',
    documents: [{ name: '投资备忘录.pdf', url: '#' }],
    events: ['e4'],
    team: [
      { name: '林志远', role: 'CEO', bg: '前大疆技术总监' },
    ],
    financials: {
      revenue: 5000000,
      burnRate: 6000000,
      grossMargin: '55%',
    },
  },
  {
    id: 'p4',
    coverImage: 'images/p4-energy.jpg',
    title: 'GreenCell Energy',
    company: 'GreenCell Inc.',
    stage: 'Pre-IPO轮',
    sector: '新能源',
    location: '香港',
    valuation: 8000000000,
    status: 'closed',
    currency: 'HKD',
    riskLevel: '中风险',
    ipoPlan: '已启动港股上市筹备，预计 2027 年递交 A1，目标港股主板',
    roundNote: '本轮份额已全部完成分配，项目处于上市筹备阶段。',
    intentDeadline: null,
    allocationDate: '2026-07-15',
    allocationRule: 'pro-rata',
    waitlist: [],
    investorCount: 38,
    recentInvestors: [
      { id: 'r16', investorNo: 'INV-2088', createdAt: '2026-07-10 11:12:09' },
      { id: 'r17', investorNo: 'INV-1925', createdAt: '2026-07-08 09:05:41' },
      { id: 'r18', investorNo: 'INV-1874', createdAt: '2026-07-05 16:48:20' },
      { id: 'r19', investorNo: 'INV-1732', createdAt: '2026-07-01 10:22:37' },
      { id: 'r20', investorNo: 'INV-1600', createdAt: '2026-06-28 14:35:06' },
    ],
    tags: ['新能源', '固态电池', 'ESG'],
    highlights: [
      '固态电池能量密度达500Wh/kg，已获车企定点',
      '2026年营收预计突破10亿港币',
      '已启动港股上市筹备，预计2027年提交A1',
    ],
    description: 'GreenCell Energy 专注于下一代固态电池的研发与生产。其半固态电池产品已于2025年实现量产，获得3家主流车企订单。公司计划于2027年在香港联交所主板上市，本轮为Pre-IPO轮融资。',
    documents: [
      { name: '投资备忘录.pdf', url: '#' },
      { name: '招股书草案.pdf', url: '#' },
    ],
    events: [],
    team: [
      { name: 'Dr. 陈国栋', role: 'CEO', bg: '前宁德时代研究院副院长' },
    ],
    financials: {
      revenue: 1050000000,
      burnRate: 800000000,
      grossMargin: '35%',
    },
  },
  {
    id: 'p5',
    coverImage: 'images/p5-fintech.jpg',
    title: 'Aurora FinTech',
    company: 'Aurora FinTech Ltd.',
    stage: 'B轮',
    sector: '金融科技',
    location: '香港',
    valuation: 250000000,
    status: 'upcoming',
    currency: 'HKD',
    riskLevel: '高风险',
    ipoPlan: '目标港股 IPO，预计 2028-2029 年',
    roundNote: '本项目尚未正式开放份额，平台正在收集投资人意向，随后与项目方协调额度。',
    intentDeadline: null,
    allocationRule: 'pro-rata',
    waitlist: [],
    investorCount: 9,
    recentInvestors: [
      { id: 'r21', investorNo: 'INV-9482', createdAt: '2026-07-30 09:51:44' },
      { id: 'r22', investorNo: 'INV-8876', createdAt: '2026-07-28 16:27:15' },
      { id: 'r23', investorNo: 'INV-8103', createdAt: '2026-07-25 12:03:29' },
      { id: 'r24', investorNo: 'INV-7640', createdAt: '2026-07-22 10:36:52' },
      { id: 'r25', investorNo: 'INV-6991', createdAt: '2026-07-19 17:14:08' },
    ],
    tags: ['金融科技', 'RWA', '区块链'],
    highlights: [
      '开发基于区块链的私募二级交易平台',
      '已获香港数码港加速器计划支持',
      '团队来自高盛、币安、腾讯',
    ],
    description: 'Aurora FinTech 正在构建一个基于区块链的真实资产（RWA）代币化交易平台，旨在为私募股权二级市场提供流动性解决方案。平台通过合规的代币化结构，使原本缺乏流动性的私募份额可以在合格投资者之间进行转让。',
    documents: [{ name: '项目简介.pdf', url: '#' }],
    events: ['e5'],
    team: [
      { name: '黄天佑', role: 'CEO', bg: '前高盛VP' },
    ],
    financials: {
      revenue: 0,
      burnRate: 2000000,
      grossMargin: null,
    },
  },
  {
    id: 'p6',
    coverImage: 'images/p6-health.jpg',
    title: 'MediConnect Health',
    company: 'MediConnect Ltd.',
    stage: 'C轮',
    sector: '医疗健康',
    location: '香港',
    valuation: 1000000000,
    status: 'raising',
    currency: 'HKD',
    riskLevel: '中高风险',
    ipoPlan: '目标港股 IPO，预计 2028 年递交上市申请',
    roundNote: '公司释放少量份额，优先满足已有意向的投资人。',
    intentDeadline: '2026-09-05',
    allocationRule: 'pro-rata',
    waitlist: [],
    investorCount: 21,
    recentInvestors: [
      { id: 'r26', investorNo: 'INV-5527', createdAt: '2026-07-29 13:40:21' },
      { id: 'r27', investorNo: 'INV-4801', createdAt: '2026-07-27 09:18:56' },
      { id: 'r28', investorNo: 'INV-4158', createdAt: '2026-07-24 15:52:33' },
      { id: 'r29', investorNo: 'INV-3329', createdAt: '2026-07-21 11:26:47' },
      { id: 'r30', investorNo: 'INV-2643', createdAt: '2026-07-18 08:59:10' },
    ],
    tags: ['医疗', 'AI诊断', 'SaaS'],
    highlights: [
      'AI影像诊断系统已获CE认证，覆盖30+病种',
      '已接入香港5家公立医院、12家私立诊所',
      '2026年预计营收突破5000万港币',
    ],
    description: 'MediConnect 提供基于AI的医疗影像辅助诊断平台，帮助医生提高诊断效率和准确率。公司的AI模型在肺结节、乳腺癌、糖尿病视网膜病变等领域已达到专家级诊断水平。平台采用SaaS模式，按人次收费。',
    documents: [
      { name: '投资备忘录.pdf', url: '#' },
      { name: 'CE认证文件.pdf', url: '#' },
    ],
    events: [],
    team: [
      { name: 'Dr. 刘嘉欣', role: 'CEO', bg: '前港大医学院教授' },
    ],
    financials: {
      revenue: 38000000,
      burnRate: 45000000,
      grossMargin: '72%',
    },
  },
];

// 示意净值序列生成（2026-10-28 基金改版，mock）：确定性伪随机（种子固定，刷新/重渲染不变），
// 首点归一 1.000，末点对齐 sinceInception 口径；上线后由后端真实净值序列替换
function makeNavSeries(seed, sinceInceptionPct, n = 104) {
  let s = seed >>> 0;
  const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const end = 1 + sinceInceptionPct / 100;
  const pts = Array.from({ length: n }, (_, i) => {
    const trend = 1 + (end - 1) * (i / (n - 1));
    const wiggle = i === 0 || i === n - 1 ? 0 : (rand() * 2 - 1) * 0.012;
    return Math.round((trend + wiggle) * 1000) / 1000;
  });
  return pts;
}

// 2026-10-28 富途式改版：
// - source 区分自营('self'，HighBlock 管理) / 代售('external'，第三方产品、本平台为分销机构)
// - returnLabel/returnValue/returnNote 结构化收益（替代旧 annualReturn 字符串，富途式大数字展示）
// - performance（PI 门控内业绩网格）、navSeries（示意净值，NavChart 用）
// - manager/managerNote（管理人区块，代售含分销披露）、inceptionDate/fundSize（基金档案）
export const funds = [
  {
    id: 'f1',
    name: 'AIDC 基金',
    source: 'self',
    returnLabel: '目标回报',
    returnValue: '8-10%',
    returnNote: '非保证',
    type: '另类投资',
    riskLevel: '中高风险',
    term: '36个月',
    minInvestment: 1000000,
    status: 'open',
    openForSubscription: true,
    currency: ['HKD', 'USD', 'CNH'],
    lockPeriod: '24个月',
    minHoldPeriod: '12个月',
    redemptionPeriod: 'T+15（人工处理）',
    lockMonths: 24,        // 锁定期（月）——逻辑唯一来源；lockPeriod 仅用于展示
    minHoldMonths: 12,      // 最低持有期（月）
    termMonths: 36,        // 存续期（月）
    inceptionDate: '2024-06',
    fundSize: 'HK$ 2.4亿',
    navSeries: makeNavSeries(101, 15.3, 120),   // 120 周 ≈ 2.3 年：需覆盖种子持仓（26 个月前），
                                              // 否则确认日早于序列起点、净值只能 clamp 到首点
    manager: 'HighBlock Asset Management',
    managerNote: '',
    description: '聚焦人工智能、数据中心及算力基础设施等AI产业链投资机会。',
    riskDisclosureRef: 'risk-disclosure',
    documents: [
      { name: '风险披露声明及免责声明', type: 'risk-disclosure' },
      { name: '使用条款', type: 'terms-of-use' },
      { name: '隐私政策', type: 'privacy-policy' },
    ],
  },
  {
    id: 'f2',
    name: 'IPO/美股券商客户基金（老板名义投向）',
    source: 'self',
    returnLabel: '目标回报',
    returnValue: '10%+',
    returnNote: '非保证',
    type: '权益投资',
    riskLevel: '高风险',
    term: '24个月',
    minInvestment: 2000000,
    status: 'open',
    openForSubscription: true,
    currency: ['HKD', 'USD', 'CNH'],
    lockPeriod: '12个月',
    minHoldPeriod: '6个月',
    redemptionPeriod: 'T+20（人工处理）',
    lockMonths: 12,        // 锁定期（月）——逻辑唯一来源；lockPeriod 仅用于展示
    minHoldMonths: 6,      // 最低持有期（月）
    termMonths: 24,        // 存续期（月）
    inceptionDate: '2024-09',
    fundSize: 'HK$ 3.8亿',
    navSeries: makeNavSeries(202, 11.2),
    manager: 'HighBlock Asset Management',
    managerNote: '',
    description: '通过合规渠道参与一级/优先配置等机会，具体安排以基金文件及客户经理沟通为准。',
    riskDisclosureRef: 'risk-disclosure',
    documents: [
      { name: '风险披露声明及免责声明', type: 'risk-disclosure' },
      { name: '使用条款', type: 'terms-of-use' },
      { name: '隐私政策', type: 'privacy-policy' },
    ],
  },
  {
    id: 'f3',
    name: '固收类基金（香港资管合作）',
    source: 'external',
    returnLabel: '预期年化',
    returnValue: '约10%',
    returnNote: '非保证',
    type: '固定收益',
    riskLevel: '中低风险',
    term: '12个月',
    minInvestment: 1000000,
    status: 'open',
    openForSubscription: true,
    currency: ['HKD', 'USD', 'CNH'],
    lockPeriod: '6个月',
    minHoldPeriod: '3个月',
    redemptionPeriod: 'T+10（人工处理）',
    lockMonths: 6,        // 锁定期（月）——逻辑唯一来源；lockPeriod 仅用于展示
    minHoldMonths: 3,      // 最低持有期（月）
    termMonths: 12,        // 存续期（月）
    inceptionDate: '2025-06',
    fundSize: 'HK$ 1.2亿',
    navSeries: makeNavSeries(303, 10.4),
    manager: 'Harbourline Asset Management',
    managerNote: '分销披露：本平台为分销机构，产品由第三方管理人管理，平台不承担产品管理责任。',
    description: '对标 IFC 货币交易等固收类机会，由香港持牌资产管理公司管理。',
    riskDisclosureRef: 'risk-disclosure',
    documents: [
      { name: '风险披露声明及免责声明', type: 'risk-disclosure' },
      { name: '使用条款', type: 'terms-of-use' },
      { name: '隐私政策', type: 'privacy-policy' },
    ],
  },
  {
    id: 'f4',
    name: '环球多策略基金（欧美资管合作）',
    source: 'external',
    returnLabel: '目标回报',
    returnValue: '6-9%',
    returnNote: '非保证',
    type: '多策略',
    riskLevel: '中风险',
    term: '18个月',
    minInvestment: 1500000,
    status: 'open',
    openForSubscription: true,
    currency: ['HKD', 'USD'],
    lockPeriod: '12个月',
    minHoldPeriod: '6个月',
    redemptionPeriod: 'T+20（人工处理）',
    lockMonths: 12,        // 锁定期（月）——逻辑唯一来源；lockPeriod 仅用于展示
    minHoldMonths: 6,      // 最低持有期（月）
    termMonths: 18,        // 存续期（月）
    inceptionDate: '2024-11',
    fundSize: 'HK$ 5.1亿',
    navSeries: makeNavSeries(404, 9.8),
    manager: 'Atlas Pacific Asset Management',
    managerNote: '分销披露：本平台为分销机构，产品由第三方管理人管理，平台不承担产品管理责任。',
    description: '由欧美资管机构管理的多策略配置机会，具体安排以基金文件及客户经理沟通为准。',
    riskDisclosureRef: 'risk-disclosure',
    documents: [
      { name: '风险披露声明及免责声明', type: 'risk-disclosure' },
      { name: '使用条款', type: 'terms-of-use' },
      { name: '隐私政策', type: 'privacy-policy' },
    ],
  },
];

// 区间收益（2026-10-28）：与 NavChart 完全同口径（切片首尾 last/first-1），
// m6=近6月(26点) y1=近1年(52点) all=成立以来(全序列)——业绩网格与净值图共用，杜绝两处各算各的
export function fundRangeReturns(navSeries) {
  const fmt = (v) => { const r = (v * 100).toFixed(1); return `${r >= 0 ? '+' : ''}${r}%`; };
  const ret = (pts) => pts[pts.length - 1] / pts[0] - 1;
  return {
    m6: fmt(ret(navSeries.slice(-26))),
    y1: fmt(ret(navSeries.slice(-52))),
    all: fmt(ret(navSeries)),
  };
}

// 基金收款账户（后台配置，APP 仅展示）
export const fundBankAccounts = [
  {
    id: 'fba1',
    fundId: 'f1',
    currency: 'HKD',
    bankName: '汇丰银行',
    accountName: 'HighBlock Securities Limited',
    accountNo: 'XXX-XXXXXX-XXX',
    swiftCode: 'HSBCHKHHXXX',
    branch: '香港',
    note: '汇款时请备注：投资人编号 + 基金名称',
  },
  {
    id: 'fba2',
    fundId: 'f1',
    currency: 'USD',
    bankName: '汇丰银行',
    accountName: 'HighBlock Securities Limited',
    accountNo: 'XXX-XXXXXX-XXX',
    swiftCode: 'HSBCHKHHXXX',
    branch: '香港',
    note: '汇款时请备注：投资人编号 + 基金名称',
  },
  {
    id: 'fba3',
    fundId: 'f1',
    currency: 'CNH',
    bankName: '中国银行（香港）',
    accountName: 'HighBlock Securities Limited',
    accountNo: 'XXX-XXXXXX-XXX',
    swiftCode: 'BKCHHKHHXXX',
    branch: '香港',
    note: '汇款时请备注：投资人编号 + 基金名称',
  },
];

// ========== 基金交易（2026-10-28 基金一期闭环） ==========
// 单据命名 fundOrders（申购/赎回统一），刻意不叫 fundSubscriptions——项目侧的 subscriptions 是
// 「问卷记录」不是交易，同名会误导下一个接手的人（2026-10-28 对抗性审查结论）。
// 资金模型：余额申购 → 后台人工确认 → 份额入账 + 逐笔结单；冻结不落 wallet.frozen，
// 按「待确认申购单金额」实时派生（single source of truth）。
export const FUND_FEE_RATE = { subscribe: 0.01, redeem: 0 };

export const FUND_ORDER_STATUS = {
  PENDING: 'pending_confirm',
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
};

export const fundOrders = [];
export const fundHoldings = [];
// 基金结单（逐笔 + 月结单）
export const fundStatements = [];

// 净值取点：navSeries 为周频序列（末点 = 当前），weeksAgo 用于「历史确认单」回溯成本净值。
// 收益 = 末点 / 确认时净值 - 1，因此确认单必须记住当时的 nav，不能只存份额（否则收益恒 0）。
export function navWeeksAgo(fund, weeks) {
  const s = fund?.navSeries || [];
  if (!s.length) return 1;
  const i = Math.max(0, s.length - 1 - Math.max(0, weeks || 0));
  return s[i];
}

export function latestNav(fund) {
  return navWeeksAgo(fund, 0);
}

function weeksAgoDate(weeks) {
  const d = new Date(Date.now() - weeks * 7 * 86400000);
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function weeksAgoStamp(weeks) {
  return `${weeksAgoDate(weeks)} 10:00:00`;
}

// 月粒度日期（种子持仓与锁定期都按月计）
function monthsAgoDate(months) {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function monthsAgoStamp(months) {
  return `${monthsAgoDate(months)} 10:00:00`;
}

// 演示种子：u1 于 26 周前确认一笔 AIDC 申购。
// 没有这笔历史单，新买入按当日净值计价 → 收益恒为 0，资产页的收益区就是个死数字。
// 种子持仓的年龄决定「赎回能不能演示」：锁定期 24 个月，26 周（6 个月）时整笔都锁着。
// 取 26 个月而不是 30 个月，是因为 AIDC 成立日 2024-06——30 个月前落在成立前，数据自相矛盾。
const FUND_SEED = { userId: 'u1', fundId: 'f1', amount: 1000000, monthsAgo: 26 };
(function seedFundPortfolio() {
  const fund = funds.find(f => f.id === FUND_SEED.fundId);
  if (!fund) return;
  const seedWeeks = Math.round(FUND_SEED.monthsAgo * 30.44 / 7);   // 26 个月 ≈ 113 周
  const nav = navWeeksAgo(fund, seedWeeks);
  const feeAmount = Math.round(FUND_SEED.amount * FUND_FEE_RATE.subscribe);
  const shares = Math.round(((FUND_SEED.amount - feeAmount) / nav) * 10000) / 10000;
  const confirmedAt = monthsAgoStamp(FUND_SEED.monthsAgo);
  const statementNo = genOrderNo('FS', confirmedAt);

  fundOrders.push({
    id: 'fo-seed-1',
    type: 'subscribe',
    fundId: fund.id,
    fundName: fund.name,
    userId: FUND_SEED.userId,
    currency: 'HKD',
    amount: FUND_SEED.amount,
    feeRate: FUND_FEE_RATE.subscribe,
    feeAmount,
    shares,
    nav,
    navDate: monthsAgoDate(FUND_SEED.monthsAgo),
    status: FUND_ORDER_STATUS.CONFIRMED,
    createdAt: confirmedAt,
    updatedAt: confirmedAt,
    confirmedAt,
    confirmedBy: '财务专员',
    statementId: 'fst-seed-1',
    history: [{ type: 'confirmed', timestamp: confirmedAt, actor: '财务专员', note: '种子数据：历史确认单' }],
  });

  fundHoldings.push({
    id: 'fh-seed-1',
    userId: FUND_SEED.userId,
    fundId: fund.id,
    fundName: fund.name,
    currency: 'HKD',
    shares,
    frozenShares: 0,          // 赎回申请中的冻结份额
    redeemedShares: 0,        // 已赎回累计份额（FIFO 消耗最早批次）
    realizedPnl: 0,           // 已实现收益（累计净回款 − 对应成本）
    costAmount: FUND_SEED.amount,
    avgNav: FUND_SEED.amount / shares,
    firstConfirmedAt: confirmedAt,
    updatedAt: confirmedAt,
  });

  fundStatements.push({
    id: 'fst-seed-1',
    orderId: 'fo-seed-1',
    userId: FUND_SEED.userId,
    fundId: fund.id,
    fundName: fund.name,
    type: 'trade',
    tradeType: '认购',
    currency: 'HKD',
    amount: FUND_SEED.amount,
    feeAmount,
    shares,
    nav,
    navDate: monthsAgoDate(FUND_SEED.monthsAgo),
    statementNo,
    confirmedAt,
    date: monthsAgoDate(FUND_SEED.monthsAgo),
  });
})();

// 待确认申购冻结额（按币种；不传 currency 返回该用户全部，按 HKD 不折算）
export function getFundFrozen(userId = currentUser.id, currency = null) {
  return fundOrders
    .filter(o => o.userId === userId
      && o.type === 'subscribe'
      && o.status === FUND_ORDER_STATUS.PENDING
      && (!currency || o.currency === String(currency).toUpperCase()))
    .reduce((s, o) => s + o.amount, 0);
}

// 可用余额 = 账户余额 - 冻结（冻结实时派生）
export function getAvailableCash(currency, userId = currentUser.id) {
  const acc = walletAccountOf(currency);
  if (!acc) return 0;
  return Math.max(0, acc.balance - getFundFrozen(userId, currency));
}

// 提交申购（余额冻结式：不扣款，确认时才扣；驳回/撤销只是释放派生冻结）
export function submitFundOrder({ fundId, currency, amount }) {
  const fund = funds.find(f => f.id === fundId);
  if (!fund) return { ok: false, error: '基金不存在' };
  if (!fund.openForSubscription) return { ok: false, error: '该基金暂不开放申购' };
  const cur = String(currency || '').toUpperCase();
  if (!(fund.currency || []).includes(cur)) return { ok: false, error: '该基金不支持此币种' };
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) return { ok: false, error: '请输入有效金额' };
  if (amt < fund.minInvestment) return { ok: false, error: `低于起投金额 ${fund.minInvestment.toLocaleString()}` };
  if (!walletAccountOf(cur)) return { ok: false, error: '账户不支持此币种' };
  if (amt > getAvailableCash(cur)) return { ok: false, error: '可用余额不足' };

  const now = formatNow();
  const order = {
    id: `fo${Date.now()}`,
    type: 'subscribe',
    fundId: fund.id,
    fundName: fund.name,
    userId: currentUser.id,
    currency: cur,
    amount: amt,
    feeRate: FUND_FEE_RATE.subscribe,
    status: FUND_ORDER_STATUS.PENDING,
    createdAt: now,
    updatedAt: now,
    history: [{ type: 'submitted', timestamp: now, actor: 'user', note: '提交申购申请（余额冻结）' }],
  };
  fundOrders.unshift(order);
  pushNotification({
    type: 'fund',
    title: '申购申请已提交',
    body: `${fund.name} ${cur} ${amt.toLocaleString()} 申购申请已提交，财务确认后份额入账。`,
  }, currentUser.id);
  Storage.save();
  return { ok: true, order };
}

// 后台确认申购：扣款 → 份额入账（加权平均成本）→ 生成逐笔结单
export function confirmFundOrder(orderId, { nav = null, operator = '运营专员' } = {}) {
  const order = fundOrders.find(o => o.id === orderId);
  if (!order) return { ok: false, error: '单据不存在' };
  if (order.status !== FUND_ORDER_STATUS.PENDING) return { ok: false, error: '单据状态已变更，请刷新' };
  const fund = funds.find(f => f.id === order.fundId);
  const acc = walletAccountOf(order.currency);
  if (!fund || !acc) return { ok: false, error: '基金或币种配置缺失' };
  // 确认前重校验余额：期间用户可能已提现，不能凭提交时的余额放行
  if (acc.balance < order.amount) return { ok: false, error: '投资人可用余额不足，无法确认' };

  const confirmNav = Number(nav) > 0 ? Number(nav) : latestNav(fund);
  const feeAmount = Math.round(order.amount * (order.feeRate ?? FUND_FEE_RATE.subscribe));
  const netAmount = order.amount - feeAmount;
  const shares = Math.round((netAmount / confirmNav) * 10000) / 10000;
  if (!(shares > 0)) return { ok: false, error: '净值异常，无法计算份额' };

  acc.balance -= order.amount;

  const now = formatNow();
  order.status = FUND_ORDER_STATUS.CONFIRMED;
  order.feeAmount = feeAmount;
  order.shares = shares;
  order.nav = confirmNav;
  order.navDate = now.slice(0, 10);
  order.confirmedAt = now;
  order.confirmedBy = operator;
  order.updatedAt = now;
  order.history = [...(order.history || []), { type: 'confirmed', timestamp: now, actor: operator, note: `确认成交 ${shares} 份 @ ${confirmNav}` }];

  let holding = fundHoldings.find(h => h.userId === order.userId && h.fundId === order.fundId && h.currency === order.currency);
  if (!holding) {
    holding = {
      id: `fh${Date.now()}`,
      userId: order.userId,
      fundId: order.fundId,
      fundName: order.fundName,
      currency: order.currency,
      shares: 0,
      frozenShares: 0,
      costAmount: 0,
      avgNav: confirmNav,
      firstConfirmedAt: now,
      updatedAt: now,
    };
    fundHoldings.push(holding);
  }
  holding.shares = Math.round((holding.shares + shares) * 10000) / 10000;
  holding.costAmount += order.amount;
  holding.avgNav = holding.shares > 0 ? holding.costAmount / holding.shares : confirmNav;
  holding.updatedAt = now;

  const statement = {
    id: `fst${Date.now()}`,
    orderId: order.id,
    userId: order.userId,
    fundId: order.fundId,
    fundName: order.fundName,
    type: 'trade',
    tradeType: '认购',
    currency: order.currency,
    amount: order.amount,
    feeAmount,
    shares,
    nav: confirmNav,
    navDate: order.navDate,
    statementNo: genOrderNo('FS', now),
    confirmedAt: now,
    date: now.slice(0, 10),
  };
  order.statementId = statement.id;
  fundStatements.unshift(statement);

  logAudit({ operator, category: 'fund', action: '确认基金申购', target: order.fundName, targetId: order.id, note: `${order.currency} ${order.amount.toLocaleString()} → ${shares} 份 @ ${confirmNav}` });
  pushNotification({
    type: 'fund',
    title: '申购已确认',
    body: `${order.fundName} 申购已确认，${shares} 份已入账，结单可在「基金结单」查看。`,
  }, order.userId);
  Storage.save();
  return { ok: true, order, statement };
}

// ========== 赎回（2026-10-28 P2） ==========
// 锁定期是「份额级」不是「持仓级」：同一只基金可能既有 26 个月前买的（已解锁）又有今天买的（锁定中）。
// 按持仓判断会把新买的也放出去——所以可赎份额一律从「已确认申购单」派生；
// FIFO 假设下已赎回先消耗最早的批次，因此
//   可赎 = 已解锁总额 − 已赎回 − 赎回冻结
function monthsSince(dateStr, now = new Date()) {
  const d = new Date(String(dateStr || '').replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return 0;
  return (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
}

function addMonths(dateStr, months) {
  const d = new Date(String(dateStr || '').replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return null;
  d.setMonth(d.getMonth() + months);
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const round4 = v => Math.round(v * 10000) / 10000;
const round2 = v => Math.round(v * 100) / 100;

// 持仓的可赎口径（同时供 UI 文案：可赎 X 份 / 另有 N 份锁定至 YYYY-MM）
export function getHoldingRedeemInfo(holding) {
  const empty = { redeemable: 0, locked: 0, lockMonths: 0, earliestUnlock: null };
  if (!holding) return empty;
  const fund = funds.find(f => f.id === holding.fundId);
  const lockMonths = fund?.lockMonths ?? 0;
  const buys = fundOrders.filter(o =>
    o.userId === holding.userId
    && o.fundId === holding.fundId
    && o.currency === holding.currency
    && o.type === 'subscribe'
    && o.status === FUND_ORDER_STATUS.CONFIRMED);

  const unlockedTotal = lockMonths <= 0
    ? buys.reduce((s, o) => s + (o.shares || 0), 0)
    : buys.filter(o => monthsSince(o.confirmedAt) >= lockMonths).reduce((s, o) => s + (o.shares || 0), 0);

  const unlockedRemaining = Math.max(0, unlockedTotal - (holding.redeemedShares || 0));
  const redeemable = Math.max(0, Math.min(holding.shares || 0, unlockedRemaining - (holding.frozenShares || 0)));
  // 锁定中的份额 = 持仓总量 − 已解锁剩余（冻结份额属于已解锁，不重复计入）
  const locked = Math.max(0, Math.min(holding.shares || 0, (holding.shares || 0) - unlockedRemaining));
  const earliestUnlock = lockMonths > 0
    ? buys
      .filter(o => monthsSince(o.confirmedAt) < lockMonths)
      .map(o => addMonths(o.confirmedAt, lockMonths))
      .filter(Boolean)
      .sort()[0] || null
    : null;

  return { redeemable: round4(redeemable), locked: round4(locked), lockMonths, earliestUnlock };
}

export function getHolding(holdingId, userId = currentUser.id) {
  return fundHoldings.find(h => h.id === holdingId && h.userId === userId) || null;
}

export function getHoldings(userId = currentUser.id) {
  return fundHoldings.filter(h => h.userId === userId && h.shares > 0);
}

// 提交赎回：冻结份额（不扣），确认才扣 + 回款。允许部分赎回，不设最低门槛
// ——「最低 1,000 份」这类规则没有业务依据，只会给校验加分支（2026-10-28 对抗性审查结论）。
export function submitRedemptionOrder({ holdingId, shares }) {
  const holding = getHolding(holdingId);
  if (!holding) return { ok: false, error: '持仓不存在' };
  const fund = funds.find(f => f.id === holding.fundId);
  if (!fund) return { ok: false, error: '基金不存在' };
  const n = Number(shares);
  if (!Number.isFinite(n) || n <= 0) return { ok: false, error: '请输入有效份额' };
  if (round4(n) !== n) return { ok: false, error: '份额最多 4 位小数' };
  const info = getHoldingRedeemInfo(holding);
  if (info.redeemable <= 0) return { ok: false, error: '当前无可赎回份额（锁定期内）' };
  if (n > info.redeemable) return { ok: false, error: `超过可赎回份额（上限 ${formatExact(info.redeemable)} 份）` };

  const now = formatNow();
  const nav = latestNav(fund);
  const order = {
    id: `fo${Date.now()}`,
    type: 'redeem',
    fundId: fund.id,
    fundName: fund.name,
    userId: holding.userId,
    holdingId: holding.id,
    currency: holding.currency,
    shares: n,
    nav,                       // 提交时参考净值；确认时按确认日净值重算
    amount: round2(n * nav),   // 预估回款（确认后以 order.netAmount 为准）
    feeRate: FUND_FEE_RATE.redeem,
    status: FUND_ORDER_STATUS.PENDING,
    createdAt: now,
    updatedAt: now,
    history: [{ type: 'submitted', timestamp: now, actor: 'user', note: `提交赎回申请（冻结 ${n} 份）` }],
  };
  holding.frozenShares = round4((holding.frozenShares || 0) + n);
  holding.updatedAt = now;
  fundOrders.unshift(order);
  pushNotification({
    type: 'fund',
    title: '赎回申请已提交',
    body: `${fund.name} 赎回 ${formatExact(n)} 份已提交，财务确认后回款至可用余额。`,
  }, holding.userId);
  Storage.save();
  return { ok: true, order };
}

// 后台确认赎回：扣份额 → 按比例冲减成本 → 记已实现收益 → 回款到钱包 → 出结单
export function confirmRedemptionOrder(orderId, { nav = null, operator = '运营专员' } = {}) {
  const order = fundOrders.find(o => o.id === orderId && o.type === 'redeem');
  if (!order) return { ok: false, error: '单据不存在' };
  if (order.status !== FUND_ORDER_STATUS.PENDING) return { ok: false, error: '单据状态已变更，请刷新' };
  const holding = fundHoldings.find(h =>
    h.userId === order.userId && h.fundId === order.fundId && h.currency === order.currency);
  if (!holding) return { ok: false, error: '持仓不存在' };
  const shares = Number(order.shares) || 0;
  if (shares <= 0) return { ok: false, error: '份额异常，无法确认' };
  // 确认前重校验：期间可能已撤销/驳回，冻结份额不足说明单据已过期
  if ((holding.frozenShares || 0) + 0.00005 < shares) return { ok: false, error: '冻结份额不足，请刷新后重试' };
  if ((holding.shares || 0) + 0.00005 < shares) return { ok: false, error: '持仓份额不足，请刷新后重试' };

  const fund = funds.find(f => f.id === order.fundId);
  const confirmNav = Number(nav) > 0 ? Number(nav) : latestNav(fund);
  if (!(confirmNav > 0)) return { ok: false, error: '净值异常，无法计算回款' };

  const gross = round2(shares * confirmNav);
  const feeAmount = round2(gross * (order.feeRate ?? FUND_FEE_RATE.redeem));
  const netAmount = round2(gross - feeAmount);
  // 先入账再改持仓：记账失败就不该动份额（否则钱和份额两边都不对）
  const moved = applyWalletDelta(order.userId, order.currency, netAmount);
  if (!moved.ok) return { ok: false, error: '回款记账失败' };

  const now = formatNow();
  const costOut = round2(shares * (holding.avgNav || 0));
  holding.frozenShares = Math.max(0, round4((holding.frozenShares || 0) - shares));
  holding.shares = Math.max(0, round4((holding.shares || 0) - shares));
  holding.redeemedShares = round4((holding.redeemedShares || 0) + shares);
  holding.costAmount = Math.max(0, round2((holding.costAmount || 0) - costOut));
  holding.realizedPnl = round2((holding.realizedPnl || 0) + (netAmount - costOut));
  holding.avgNav = holding.shares > 0 ? holding.costAmount / holding.shares : (holding.avgNav || 0);
  holding.updatedAt = now;
  if (moved.self) updateLatestTotal(toHkd(order.currency, netAmount));

  order.status = FUND_ORDER_STATUS.CONFIRMED;
  order.nav = confirmNav;
  order.navDate = now.slice(0, 10);
  order.grossAmount = gross;
  order.feeAmount = feeAmount;
  order.netAmount = netAmount;
  order.confirmedAt = now;
  order.confirmedBy = operator;
  order.updatedAt = now;
  order.history = [...(order.history || []), {
    type: 'confirmed', timestamp: now, actor: operator,
    note: `确认赎回 ${shares} 份 @ ${confirmNav} → 回款 ${order.currency} ${formatExact(netAmount)}`,
  }];

  const statement = {
    id: `fst${Date.now()}`,
    orderId: order.id,
    userId: order.userId,
    fundId: order.fundId,
    fundName: order.fundName,
    type: 'trade',
    tradeType: '赎回',
    currency: order.currency,
    amount: netAmount,
    grossAmount: gross,
    feeAmount,
    shares,
    nav: confirmNav,
    navDate: order.navDate,
    statementNo: genOrderNo('FS', now),
    confirmedAt: now,
    date: now.slice(0, 10),
  };
  order.statementId = statement.id;
  fundStatements.unshift(statement);

  logAudit({
    operator, category: 'fund', action: '确认基金赎回', target: order.fundName, targetId: order.id,
    note: `${shares} 份 @ ${confirmNav} → 回款 ${order.currency} ${formatExact(netAmount)}`,
  });
  pushNotification({
    type: 'fund',
    title: '赎回已确认',
    body: `${order.fundName} 赎回 ${formatExact(shares)} 份已确认，回款 ${order.currency} ${formatExact(netAmount)} 已进入可用余额。`,
  }, order.userId);
  Storage.save();
  return { ok: true, order, statement };
}

// 释放赎回冻结（驳回 / 撤销共用）
function releaseRedemptionFreeze(order) {
  if (!order || order.type !== 'redeem') return;
  const holding = fundHoldings.find(h =>
    h.userId === order.userId && h.fundId === order.fundId && h.currency === order.currency);
  if (!holding) return;
  holding.frozenShares = Math.max(0, round4((holding.frozenShares || 0) - (order.shares || 0)));
  holding.updatedAt = formatNow();
}

export function rejectFundOrder(orderId, reason = '', operator = '运营专员') {
  const order = fundOrders.find(o => o.id === orderId);
  if (!order) return { ok: false, error: '单据不存在' };
  if (order.status !== FUND_ORDER_STATUS.PENDING) return { ok: false, error: '单据状态已变更，请刷新' };
  const now = formatNow();
  order.status = FUND_ORDER_STATUS.REJECTED;
  order.rejectReason = reason;
  order.confirmedBy = operator;
  order.updatedAt = now;
  order.history = [...(order.history || []), { type: 'rejected', timestamp: now, actor: operator, note: reason || '驳回' }];
  releaseRedemptionFreeze(order);
  const isRedeem = order.type === 'redeem';
  logAudit({ operator, category: 'fund', action: isRedeem ? '驳回基金赎回' : '驳回基金申购', target: order.fundName, targetId: order.id, note: reason });
  pushNotification({
    type: 'fund',
    title: isRedeem ? '赎回未通过' : '申购未通过',
    body: `${order.fundName} ${isRedeem ? '赎回' : '申购'}申请未通过${reason ? `：${reason}` : ''}。`,
  }, order.userId);
  Storage.save();
  return { ok: true, order };
}

// 用户撤销（仅本人、仅待确认）
export function cancelFundOrder(orderId, userId = currentUser.id) {
  const order = fundOrders.find(o => o.id === orderId);
  if (!order || order.userId !== userId) return { ok: false, error: '单据不存在' };
  if (order.status !== FUND_ORDER_STATUS.PENDING) return { ok: false, error: '仅待确认的申请可撤销' };
  const now = formatNow();
  order.status = FUND_ORDER_STATUS.CANCELLED;
  order.updatedAt = now;
  order.history = [...(order.history || []), { type: 'cancelled', timestamp: now, actor: 'user', note: '用户撤销' }];
  releaseRedemptionFreeze(order);
  Storage.save();
  return { ok: true, order };
}

export function myFundOrders(userId = currentUser.id) {
  return fundOrders
    .filter(o => o.userId === userId)
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function myFundStatements(userId = currentUser.id) {
  return fundStatements.filter(s => !s.userId || s.userId === userId);
}

// 资产聚合（只读）：现金 + 持仓市值 + 收益。跨币种一律折合 HKD 展示。
export function getFundPortfolio(userId = currentUser.id) {
  const rows = fundHoldings
    .filter(h => h.userId === userId && h.shares > 0)
    .map(h => {
      const fund = funds.find(f => f.id === h.fundId);
      const nav = latestNav(fund);
      // 在途赎回份额仍计入市值：提交只冻结份额、钱还没到账，剔除会让总资产在提交瞬间掉一块
      const marketValue = h.shares * nav;
      const unrealized = marketValue - h.costAmount;
      const realized = h.realizedPnl || 0;
      const pnl = unrealized + realized;
      return {
        ...h,
        fundName: h.fundName || fund?.name || h.fundId,
        nav,
        marketValue,
        unrealizedPnl: unrealized,
        realizedPnl: realized,
        pnl,
        pnlPct: h.costAmount > 0 ? (unrealized / h.costAmount) * 100 : 0,
        redeemInfo: getHoldingRedeemInfo(h),
      };
    });

  const cash = ['HKD', 'USD', 'CNH'].map(cur => {
    const acc = walletAccountOf(cur);
    const frozen = getFundFrozen(userId, cur);
    return {
      currency: cur,
      symbol: acc?.symbol || '',
      balance: acc?.balance || 0,
      frozen,
      available: Math.max(0, (acc?.balance || 0) - frozen),
    };
  });

  const availableHKD = cash.reduce((s, c) => s + convertToHKD(c.available, c.currency), 0);
  const frozenHKD = cash.reduce((s, c) => s + convertToHKD(c.frozen, c.currency), 0);
  const marketValueHKD = rows.reduce((s, r) => s + convertToHKD(r.marketValue, r.currency), 0);
  const costHKD = rows.reduce((s, r) => s + convertToHKD(r.costAmount, r.currency), 0);
  const realizedHKD = rows.reduce((s, r) => s + convertToHKD(r.realizedPnl || 0, r.currency), 0);
  const pnlHKD = (marketValueHKD - costHKD) + realizedHKD;
  const pendingRedeemShares = rows.reduce((s, r) => s + (r.frozenShares || 0), 0);
  const pendingRedeemHKD = rows.reduce((s, r) => s + convertToHKD((r.frozenShares || 0) * r.nav, r.currency), 0);

  return {
    rows,
    cash,
    availableHKD,
    frozenHKD,
    cashHKD: availableHKD + frozenHKD,
    marketValueHKD,
    costHKD,
    realizedHKD,
    pendingRedeemShares,
    pendingRedeemHKD,
    pnlHKD,
    pnlPct: costHKD > 0 ? ((marketValueHKD - costHKD) / costHKD) * 100 : 0,
    totalHKD: availableHKD + frozenHKD + marketValueHKD,
  };
}

export const events = [
  {
    id: 'e1',
    projectId: 'p1',
    projectName: 'QuantumCore Technologies',
    sector: '量子计算',
    coverImage: 'images/e1-quantum-roadshow.jpg',
    type: 'online',
    title: 'QuantumCore 线上路演 — 量子计算的商业化路径',
    date: new Date().toISOString().slice(0, 10),  // 演示用：始终为今天
    time: (() => { const d = new Date(); const h = d.getHours(); return `${String(h).padStart(2,'0')}:00-${String(h+1).padStart(2,'0')}:00`; })(),  // 演示用：始终为当前小时
    timezone: 'HKT',
    description: '本次路演将由QuantumCore CEO张振宇先生介绍公司最新技术进展、商业化规划和本轮投资机会。活动设有Q&A环节，参会者可以实时提问。',
    agenda: [
      { time: '14:00', topic: '开场 & 公司简介' },
      { time: '14:15', topic: '室温量子比特原型机技术展示' },
      { time: '14:45', topic: '商业化路径与 IPO 时间表' },
      { time: '15:10', topic: 'Q&A 互动问答' },
    ],
    highlights: [
      '室温量子比特原型机首次面向投资人公开演示',
      'CEO 亲自拆解本轮投资机会与份额分配机制',
      '会后可与管理层一对一交流尽调',
    ],
    speakerBio: '前 Google 量子计算研究员，主导室温量子比特路线研发，拥有多项核心专利。',
    joinNote: '线上会议 · 报名成功后，会议链接将在活动前 24 小时通过站内通知及邮件发送。',
    joinUrl: 'https://us06web.zoom.us/j/83852001177',
    status: 'upcoming',
    speaker: '张振宇 (CEO)',
    capacity: null,
    registered: 67,
  },
  {
    id: 'e2',
    projectId: 'p2',
    projectName: 'BioNova Therapeutics',
    sector: '生物医药',
    coverImage: 'images/e2-biotech-clinical.jpg',
    type: 'online',
    title: 'BioNova 临床数据解读会',
    date: '2026-08-22',
    time: '15:00-16:30',
    timezone: 'HKT',
    description: 'BioNova CSO将详细解读核心管线BN-001的最新临床II期数据，并讨论PROTAC技术在肿瘤治疗领域的未来发展前景。',
    agenda: [
      { time: '15:00', topic: '开场 & 管线概览' },
      { time: '15:10', topic: 'BN-001 临床 II 期数据深度解读' },
      { time: '15:50', topic: 'PROTAC 平台技术壁垒讨论' },
      { time: '16:10', topic: 'Q&A 互动问答' },
    ],
    highlights: [
      'BN-001 最新临床数据首次公开解读',
      'CSO 现场回应市场关注的疗效与安全性问题',
      '会后可预约一对一尽调沟通',
    ],
    speakerBio: '前中科院上海药物所教授，PROTAC 平台核心技术创始人。',
    joinNote: '线上会议 · 报名成功后，会议链接将在活动前 24 小时通过站内通知及邮件发送。',
    joinUrl: 'https://meeting.tencent.com/dm/BioNova-CS',
    status: 'upcoming',
    speaker: 'Dr. 王思远 (CSO)',
    capacity: null,
    registered: 45,
  },
  {
    id: 'e3',
    projectId: 'p1',
    projectName: 'QuantumCore Technologies',
    sector: '量子计算',
    coverImage: 'images/e3-quantum-lab.jpg',
    type: 'offline',
    title: '参观日：QuantumCore 香港实验室',
    date: '2026-09-05',
    time: '10:00-12:00',
    timezone: 'HKT',
    location: '香港科学园 科技大道西 8 号 QuantumCore 量子计算中心 3 楼',
    description: '实地参观QuantumCore位于香港科学园的量子计算实验室，亲眼观看室温量子比特原型机的运行演示。名额有限，仅限已注册投资人。',
    agenda: [
      { time: '10:00', topic: '集合 & 安全须知' },
      { time: '10:20', topic: '实验室参观：室温量子比特原型机演示' },
      { time: '11:20', topic: '研发团队答疑' },
      { time: '11:50', topic: '自由交流 & 散场' },
    ],
    highlights: [
      '近距离观看室温量子比特原型机真实运行',
      'CTO 全程讲解核心技术与研发节奏',
      '可当面与技术团队深入交流尽调',
    ],
    speakerBio: 'MIT 物理学博士，主导量子比特芯片从原型到工程化的全过程。',
    joinNote: '线下 · 请于活动开始前 15 分钟凭报名手机号签到，凭预约名单入场。',
    streamUrl: 'https://live.example.com/quantumcore-lab-visit',
    status: 'upcoming',
    speaker: 'Dr. Lisa Wong (CTO)',
    capacity: 30,
    registered: 22,
  },
  {
    id: 'e4',
    projectId: 'p3',
    projectName: 'SkyNet Robotics',
    sector: '机器人',
    coverImage: 'images/e4-robot-demo.jpg',
    type: 'online',
    title: 'SkyNet 产品演示会 — AMR 仓储自动化解决方案',
    date: '2026-09-12',
    time: '14:00-15:00',
    timezone: 'HKT',
    description: 'SkyNet Robotics将进行AMR产品现场演示，展示其在真实仓储环境下的运行效果，并分享与头部物流企业的合作案例。',
    agenda: [
      { time: '14:00', topic: '开场 & 公司发展历程' },
      { time: '14:15', topic: 'AMR 实机运行演示' },
      { time: '14:40', topic: '头部物流客户合作案例' },
      { time: '15:00', topic: 'Q&A 互动问答' },
    ],
    highlights: [
      'AMR 实机在模拟仓储场景中的运行演示',
      'CEO 分享与大疆、头部物流的合作经验',
      '现场演示自研 SLAM 算法精度',
    ],
    speakerBio: '前大疆技术总监，主导 AMR 核心算法与产品架构设计。',
    joinNote: '线上会议 · 报名成功后，会议链接将在活动前 24 小时通过站内通知及邮件发送。',
    joinUrl: 'https://meeting.tencent.com/dm/SkyNet-Demo',
    status: 'upcoming',
    speaker: '林志远 (CEO)',
    capacity: null,
    registered: 88,
  },
  {
    id: 'e5',
    projectId: 'p5',
    projectName: 'Aurora FinTech',
    sector: '金融科技',
    coverImage: 'images/e5-rwa-fintech.jpg',
    type: 'online',
    title: 'Aurora FinTech — RWA 代币化如何改变私募市场',
    date: '2026-09-20',
    time: '16:00-17:30',
    timezone: 'HKT',
    description: 'Aurora FinTech CEO将分享RWA代币化的最新行业趋势、监管动态和平台的商业化策略。',
    agenda: [
      { time: '16:00', topic: 'RWA 代币化行业趋势与监管动态' },
      { time: '16:30', topic: '平台架构与合规路径' },
      { time: '17:00', topic: '商业化策略与展望' },
      { time: '17:15', topic: 'Q&A 互动问答' },
    ],
    highlights: [
      'RWA 代币化在私募二级市场的应用前景',
      '团队来自高盛、币安、腾讯的实战经验',
      '会后可预约一对一深入交流',
    ],
    speakerBio: '前高盛 VP，深谙数字资产与私募市场交叉领域。',
    joinNote: '线上会议 · 报名成功后，会议链接将在活动前 24 小时通过站内通知及邮件发送。',
    joinUrl: 'https://us06web.zoom.us/j/86523177409',
    status: 'upcoming',
    speaker: '黄天佑 (CEO)',
    capacity: null,
    registered: 92,
  },
  {
    id: 'e6',
    projectId: 'p4',
    projectName: 'GreenCell Energy',
    sector: '新能源',
    coverImage: 'images/e6-energy-ipo.jpg',
    type: 'online',
    title: 'GreenCell 上市前投资人交流会',
    date: '2026-07-20',
    time: '14:00-15:30',
    timezone: 'HKT',
    description: 'GreenCell管理层介绍上市筹备进展、未来发展战略及Pre-IPO轮投资条款。',
    agenda: [
      { time: '14:00', topic: '上市筹备进展汇报' },
      { time: '14:30', topic: '未来发展战略' },
      { time: '15:00', topic: 'Pre-IPO 轮投资条款解读' },
      { time: '15:15', topic: 'Q&A 互动问答' },
    ],
    highlights: [
      '管理层首次披露上市筹备细节',
      '固态电池量产与客户订单最新进展',
      '回放可在活动后查看',
    ],
    speakerBio: '前宁德时代研究院副院长，固态电池领域专家。',
    status: 'past',
    speaker: 'Dr. 陈国栋 (CEO)',
    capacity: null, // 线上无容量（历史残留 100 已清，2026-08-12 线上统一 capacity: null）
    registered: 95,
  },
  {
    id: 'e7',
    projectId: null,
    projectName: "HighBlock",
    sector: '财富管理',
    coverImage: 'images/e7-market-outlook.jpg',
    type: 'online',
    title: '2026 夏季私募市场展望 — 新经济赛道投资策略',
    date: '2026-09-25',
    time: '19:00-20:30',
    timezone: 'HKT',
    description: 'HighBlock 研究院年度分享：解析下半年私募市场趋势、新经济赛道估值逻辑与高净值配置建议，并预告四季度上新项目。',
    agenda: [
      { time: '19:00', topic: '下半年私募市场趋势总览' },
      { time: '19:30', topic: '新经济赛道估值逻辑拆解' },
      { time: '20:00', topic: '高净值配置建议' },
      { time: '20:15', topic: '四季度上新项目预告 & Q&A' },
    ],
    highlights: [
      '研究院下半年配置策略首次公开',
      '四季度上新项目提前预告',
      '首席策略师在线答疑',
    ],
    speakerBio: '专注大中华区另类资产配置研究，十年私募市场从业经验。',
    joinNote: '线上会议 · 报名成功后，会议链接将在活动前 24 小时通过站内通知及邮件发送。',
    joinUrl: 'https://us06web.zoom.us/j/84560219317',
    status: 'upcoming',
    speaker: 'HighBlock 研究院 · 首席策略师',
    capacity: null,
    registered: 126,
  },
];

// 后台问卷记录（2026-08-13 多用户化）：以项目为核心维度，每条记录带投资人身份（userId/investorNo/investorName）
// 用户侧消费时必须按 investorNo === getInvestorNo(currentUser.id) 过滤（ProjectDetail/ProjectMarket/Search/ProjectHeat/Subscriptions）
export const subscriptions = [
  // ── 当前用户（u1 张三 INV-0001）—— 用户侧演示数据 ──
  {
    id: 's1',
    userId: 'u1', investorNo: 'INV-0001', investorName: '张三',
    projectId: 'p4',
    projectName: 'GreenCell Energy',
    amount: 3000000,
    status: 'signed',
    createdAt: '2026-07-10 09:30:15',
    orderNo: 'SUB20260710093015',
    updatedAt: '2026-07-18 14:22:40',
    allocatedAt: '2026-07-12 11:00:00',
    freezeDeadline: '2026-07-13 11:00:00',
    notes: '已完成',
    shares: 375,
    frozenAmount: 3000000,
    // AML合规字段（2026-08-26 新增）
    amlFlags: [],                  // 无合规标记
    riskAcknowledgement: {         // 风险确认
      confirmed: true,             // 已确认
      confirmedAt: '2026-07-10 09:30:15',
      ipAddress: '192.168.1.100',
    },
    documentViewLogs: [            // 文件查看日志
      { documentType: 'agreement', viewedAt: '2026-07-18 14:18:00', duration: 120 },
    ],
    history: [
      { type: 'settled', timestamp: '2026-07-18 14:22:40', actor: 'system', note: '已标记完成', amount: -3000000 },
      { type: 'signed', timestamp: '2026-07-18 14:18:22', actor: 'platform', note: '已标记完成' },
      { type: 'allocated', timestamp: '2026-07-12 11:00:00', actor: 'platform', note: '已转客户经理跟进' },
      { type: 'submitted', timestamp: '2026-07-10 09:30:15', actor: 'user', note: '提交问卷 · 意向金额 HK$ 300 万' },
    ],
  },
  {
    id: 's2',
    userId: 'u1', investorNo: 'INV-0001', investorName: '张三',
    projectId: 'p3',
    projectName: 'SkyNet Robotics',
    amount: 1000000,
    status: 'allocated',
    createdAt: '2026-07-25 16:40:02',
    orderNo: 'SUB20260725164002',
    updatedAt: '2026-07-28 10:12:47',
    allocatedAt: '2026-07-28 10:12:47',
    freezeDeadline: null,
    notes: '客户经理跟进中',
    shares: null,
    frozenAmount: 1000000,
    // AML合规字段（2026-08-26 新增）
    amlFlags: [],                  // 无合规标记
    riskAcknowledgement: {         // 风险确认
      confirmed: true,             // 已确认
      confirmedAt: '2026-07-25 16:40:02',
      ipAddress: '192.168.1.100',
    },
    documentViewLogs: [],          // 暂无文件查看记录
    history: [
      { type: 'allocated', timestamp: '2026-07-28 10:12:47', actor: 'platform', note: '已转客户经理跟进' },
      { type: 'submitted', timestamp: '2026-07-25 16:40:02', actor: 'user', note: '提交问卷 · 意向金额 HK$ 100 万' },
    ],
  },
  {
    id: 's3',
    userId: 'u1', investorNo: 'INV-0001', investorName: '张三',
    projectId: 'p2',
    projectName: 'BioNova Therapeutics',
    amount: 3000000,
    status: 'submitted',
    createdAt: '2026-07-29 11:05:48',
    orderNo: 'SUB20260729110548',
    updatedAt: '2026-07-29 11:05:48',
    allocatedAt: null,
    freezeDeadline: null,
    notes: '意向已登记，等待线下协调额度',
    shares: null,
    frozenAmount: 0,
    // AML合规字段（2026-08-26 新增）
    amlFlags: [                    // 大额交易标记
      {
        type: 'large_transaction',
        status: 'pending',
        riskLevel: 'medium',
        reviewId: 'ltx2',
        createdAt: '2026-07-29 11:05:48',
      },
    ],
    riskAcknowledgement: {         // 风险确认
      confirmed: true,             // 已确认
      confirmedAt: '2026-07-29 11:05:48',
      ipAddress: '192.168.1.100',
    },
    documentViewLogs: [],          // 暂无文件查看记录
    history: [
      { type: 'submitted', timestamp: '2026-07-29 11:05:48', actor: 'user', note: '提交问卷 · 意向金额 HK$ 300 万' },
    ],
  },
  {
    id: 's4',
    userId: 'u1', investorNo: 'INV-0001', investorName: '张三',
    projectId: 'p6',
    projectName: 'MediConnect Health',
    amount: 500000,
    status: 'unallocated',
    createdAt: '2026-06-20 14:22:10',
    orderNo: 'SUB20260620142210',
    updatedAt: '2026-07-05 09:08:31',
    allocatedAt: null,
    freezeDeadline: null,
    notes: '本轮已结束，如有进一步意向可继续提交问卷',
    shares: null,
    frozenAmount: 0,
    // AML合规字段（2026-08-26 新增）
    amlFlags: [],                  // 无合规标记（金额较小）
    riskAcknowledgement: {         // 风险确认
      confirmed: true,             // 已确认
      confirmedAt: '2026-06-20 14:22:10',
      ipAddress: '192.168.1.100',
    },
    documentViewLogs: [],          // 暂无文件查看记录
    history: [
      { type: 'unallocated', timestamp: '2026-07-05 09:08:31', actor: 'platform', note: '本次提交暂无进一步安排' },
      { type: 'submitted', timestamp: '2026-06-20 14:22:10', actor: 'user', note: '提交问卷 · 意向金额 HK$ 50 万' },
    ],
  },

  // ── p1 QuantumCore（raising）：3 位投资人待协调（waitlist 3 人，演示排队） ──
  {
    id: 's5',
    userId: 'u11', investorNo: 'INV-5581', investorName: '陈伟强',
    projectId: 'p1',
    projectName: 'QuantumCore Technologies',
    amount: 5000000,
    status: 'submitted',
    createdAt: '2026-08-01 10:20:00',
    orderNo: 'SUB20260801102000',
    updatedAt: '2026-08-01 10:20:00',
    allocatedAt: null,
    freezeDeadline: null,
    notes: '意向已登记，等待线下协调额度',
    shares: null,
    frozenAmount: 0,
    // AML合规字段（2026-08-26 新增）
    amlFlags: [                    // 大额交易标记（二级审查）
      {
        type: 'large_transaction',
        status: 'pending',
        riskLevel: 'medium',
        reviewId: 'ltx3',
        createdAt: '2026-08-01 10:20:00',
      },
    ],
    riskAcknowledgement: {         // 风险确认
      confirmed: true,             // 已确认
      confirmedAt: '2026-08-01 10:20:00',
      ipAddress: '10.0.0.50',
    },
    documentViewLogs: [],          // 暂无文件查看记录
    history: [
      { type: 'submitted', timestamp: '2026-08-01 10:20:00', actor: 'user', note: '提交问卷 · 意向金额 HK$ 500 万' },
    ],
  },
  {
    id: 's6',
    userId: 'u12', investorNo: 'INV-3345', investorName: '刘雅婷',
    projectId: 'p1',
    projectName: 'QuantumCore Technologies',
    amount: 3000000,
    status: 'submitted',
    createdAt: '2026-08-02 14:05:00',
    orderNo: 'SUB20260802140500',
    updatedAt: '2026-08-02 14:05:00',
    allocatedAt: null,
    freezeDeadline: null,
    notes: '意向已登记，等待线下协调额度',
    shares: null,
    frozenAmount: 0,
    // AML合规字段（2026-08-26 新增）
    amlFlags: [                    // 大额交易标记
      {
        type: 'large_transaction',
        status: 'pending',
        riskLevel: 'medium',
        reviewId: 'ltx4',
        createdAt: '2026-08-02 14:05:00',
      },
    ],
    riskAcknowledgement: {         // 风险确认
      confirmed: true,             // 已确认
      confirmedAt: '2026-08-02 14:05:00',
      ipAddress: '10.0.0.51',
    },
    documentViewLogs: [],          // 暂无文件查看记录
    history: [
      { type: 'submitted', timestamp: '2026-08-02 14:05:00', actor: 'user', note: '提交问卷 · 意向金额 HK$ 300 万' },
    ],
  },
  {
    id: 's7',
    userId: 'u13', investorNo: 'INV-7721', investorName: '赵国强',
    projectId: 'p1',
    projectName: 'QuantumCore Technologies',
    amount: 10000000,
    status: 'submitted',
    createdAt: '2026-08-03 09:45:00',
    orderNo: 'SUB20260803094500',
    updatedAt: '2026-08-03 09:45:00',
    allocatedAt: null,
    freezeDeadline: null,
    notes: '意向已登记，等待线下协调额度',
    shares: null,
    frozenAmount: 0,
    // AML合规字段（2026-08-26 新增）
    amlFlags: [                    // 大额交易标记（三级审查）
      {
        type: 'large_transaction',
        status: 'pending',
        riskLevel: 'high',
        reviewId: 'ltx5',
        createdAt: '2026-08-03 09:45:00',
      },
    ],
    riskAcknowledgement: {         // 风险确认
      confirmed: true,             // 已确认
      confirmedAt: '2026-08-03 09:45:00',
      ipAddress: '10.0.0.52',
    },
    documentViewLogs: [],          // 暂无文件查看记录
    history: [
      { type: 'submitted', timestamp: '2026-08-03 09:45:00', actor: 'user', note: '提交问卷 · 意向金额 HK$ 1000 万' },
    ],
  },

  // ── p2 BioNova：2 位投资人待协调（含张三 s3） ──
  {
    id: 's8',
    userId: 'u14', investorNo: 'INV-9087', investorName: '林婉仪',
    projectId: 'p2',
    projectName: 'BioNova Therapeutics',
    amount: 1000000,
    status: 'submitted',
    createdAt: '2026-08-05 16:30:00',
    orderNo: 'SUB20260805163000',
    updatedAt: '2026-08-05 16:30:00',
    allocatedAt: null,
    freezeDeadline: null,
    notes: '意向已登记，等待线下协调额度',
    shares: null,
    frozenAmount: 0,
    // AML合规字段（2026-08-26 新增）
    amlFlags: [],                  // 无合规标记
    riskAcknowledgement: {         // 风险确认
      confirmed: true,             // 已确认
      confirmedAt: '2026-08-05 16:30:00',
      ipAddress: '10.0.0.53',
    },
    documentViewLogs: [],          // 暂无文件查看记录
    history: [
      { type: 'submitted', timestamp: '2026-08-05 16:30:00', actor: 'user', note: '提交问卷 · 意向金额 HK$ 100 万' },
    ],
  },

  // ── p3 SkyNet：4 位投资人（1 signed + 2 allocated + 1 submitted 排队，演示顺延+上位） ──
  {
    id: 's9',
    userId: 'u15', investorNo: 'INV-6604', investorName: '周志远',
    projectId: 'p3',
    projectName: 'SkyNet Robotics',
    amount: 2000000,
    status: 'allocated',
    createdAt: '2026-08-08 11:00:00',
    orderNo: 'SUB20260808110000',
    updatedAt: '2026-08-10 10:00:00',
    allocatedAt: '2026-08-10 10:00:00',
    freezeDeadline: '2026-08-11 10:00:00',
    notes: '客户经理跟进中',
    shares: null,
    frozenAmount: 2000000,
    // AML合规字段（2026-08-26 新增）
    amlFlags: [],                  // 无合规标记
    riskAcknowledgement: {         // 风险确认
      confirmed: true,             // 已确认
      confirmedAt: '2026-08-08 11:00:00',
      ipAddress: '10.0.0.54',
    },
    documentViewLogs: [],          // 暂无文件查看记录
    history: [
      { type: 'allocated', timestamp: '2026-08-10 10:00:00', actor: 'platform', note: '已转客户经理跟进' },
      { type: 'submitted', timestamp: '2026-08-08 11:00:00', actor: 'user', note: '提交问卷 · 意向金额 HK$ 200 万' },
    ],
  },
  {
    id: 's10',
    userId: 'u16', investorNo: 'INV-2219', investorName: '吴美琪',
    projectId: 'p3',
    projectName: 'SkyNet Robotics',
    amount: 1500000,
    status: 'signed',
    createdAt: '2026-07-20 15:10:00',
    orderNo: 'SUB20260720151000',
    updatedAt: '2026-07-26 09:40:00',
    allocatedAt: '2026-07-22 11:00:00',
    freezeDeadline: '2026-07-23 11:00:00',
    notes: '已完成',
    shares: 187,
    frozenAmount: 1500000,
    // AML合规字段（2026-08-26 新增）
    amlFlags: [],                  // 无合规标记
    riskAcknowledgement: {         // 风险确认
      confirmed: true,             // 已确认
      confirmedAt: '2026-07-20 15:10:00',
      ipAddress: '10.0.0.55',
    },
    documentViewLogs: [            // 文件查看日志
      { documentType: 'agreement', viewedAt: '2026-07-26 09:35:00', duration: 90 },
    ],
    history: [
      { type: 'settled', timestamp: '2026-07-26 09:40:00', actor: 'system', note: '已标记完成', amount: -1500000 },
      { type: 'signed', timestamp: '2026-07-26 09:35:00', actor: 'platform', note: '已标记完成' },
      { type: 'allocated', timestamp: '2026-07-22 11:00:00', actor: 'platform', note: '已转客户经理跟进' },
      { type: 'submitted', timestamp: '2026-07-20 15:10:00', actor: 'user', note: '提交问卷 · 意向金额 HK$ 150 万' },
    ],
  },
  {
    id: 's11',
    userId: 'u17', investorNo: 'INV-1132', investorName: '郑嘉豪',
    projectId: 'p3',
    projectName: 'SkyNet Robotics',
    amount: 10000000,
    status: 'submitted',
    createdAt: '2026-08-06 09:15:00',
    orderNo: 'SUB20260806091500',
    updatedAt: '2026-08-06 09:15:00',
    allocatedAt: null,
    freezeDeadline: null,
    notes: '意向已登记，等待线下协调额度',
    shares: null,
    frozenAmount: 0,
    // AML合规字段（2026-08-26 新增）
    amlFlags: [                    // 大额交易标记（三级审查）
      {
        type: 'large_transaction',
        status: 'pending',
        riskLevel: 'high',
        reviewId: 'ltx6',
        createdAt: '2026-08-06 09:15:00',
      },
    ],
    riskAcknowledgement: {         // 风险确认
      confirmed: true,             // 已确认
      confirmedAt: '2026-08-06 09:15:00',
      ipAddress: '10.0.0.56',
    },
    documentViewLogs: [],          // 暂无文件查看记录
    history: [
      { type: 'submitted', timestamp: '2026-08-06 09:15:00', actor: 'user', note: '提交问卷 · 意向金额 HK$ 1000 万' },
    ],
  },

  // ── 扩充数据（2026-08-13：每个项目多造几条，提升后台列表/抽屉演示体验） ──
  {
    id: 's12',
    userId: 'u18', investorNo: 'INV-4405', investorName: '黄志明',
    projectId: 'p1',
    projectName: 'QuantumCore Technologies',
    amount: 8000000,
    status: 'submitted',
    createdAt: '2026-08-04 13:40:00',
    orderNo: 'SUB20260804134000',
    updatedAt: '2026-08-04 13:40:00',
    allocatedAt: null,
    freezeDeadline: null,
    notes: '意向已登记，等待线下协调额度',
    shares: null,
    frozenAmount: 0,
    // AML合规字段（2026-08-26 新增）
    amlFlags: [                    // 大额交易标记（三级审查）
      {
        type: 'large_transaction',
        status: 'pending',
        riskLevel: 'high',
        reviewId: 'ltx7',
        createdAt: '2026-08-04 13:40:00',
      },
    ],
    riskAcknowledgement: { confirmed: true, confirmedAt: '2026-08-04 13:40:00', ipAddress: '10.0.0.57' },
    documentViewLogs: [],
    history: [
      { type: 'submitted', timestamp: '2026-08-04 13:40:00', actor: 'user', note: '提交问卷 · 意向金额 HK$ 800 万' },
    ],
  },
  {
    id: 's13',
    userId: 'u19', investorNo: 'INV-9032', investorName: '周淑怡',
    projectId: 'p1',
    projectName: 'QuantumCore Technologies',
    amount: 2000000,
    status: 'submitted',
    createdAt: '2026-08-05 10:05:00',
    orderNo: 'SUB20260805100500',
    updatedAt: '2026-08-05 10:05:00',
    allocatedAt: null,
    freezeDeadline: null,
    notes: '意向已登记，等待线下协调额度',
    shares: null,
    frozenAmount: 0,
    amlFlags: [],
    riskAcknowledgement: { confirmed: true, confirmedAt: '2026-08-05 10:05:00', ipAddress: '10.0.0.58' },
    documentViewLogs: [],
    history: [
      { type: 'submitted', timestamp: '2026-08-05 10:05:00', actor: 'user', note: '提交问卷 · 意向金额 HK$ 200 万' },
    ],
  },
  {
    id: 's14',
    userId: 'u20', investorNo: 'INV-6618', investorName: '郭子豪',
    projectId: 'p2',
    projectName: 'BioNova Therapeutics',
    amount: 4000000,
    status: 'submitted',
    createdAt: '2026-08-07 09:30:00',
    orderNo: 'SUB20260807093000',
    updatedAt: '2026-08-07 09:30:00',
    allocatedAt: null,
    freezeDeadline: null,
    notes: '意向已登记，等待线下协调额度',
    shares: null,
    frozenAmount: 0,
    amlFlags: [
      { type: 'large_transaction', status: 'pending', riskLevel: 'medium', reviewId: 'ltx8', createdAt: '2026-08-07 09:30:00' },
    ],
    riskAcknowledgement: { confirmed: true, confirmedAt: '2026-08-07 09:30:00', ipAddress: '10.0.0.59' },
    documentViewLogs: [],
    history: [
      { type: 'submitted', timestamp: '2026-08-07 09:30:00', actor: 'user', note: '提交问卷 · 意向金额 HK$ 400 万' },
    ],
  },
  {
    id: 's15',
    userId: 'u21', investorNo: 'INV-2254', investorName: '邓丽华',
    projectId: 'p2',
    projectName: 'BioNova Therapeutics',
    amount: 3000000,
    status: 'allocated',
    createdAt: '2026-08-06 15:20:00',
    orderNo: 'SUB20260806152000',
    updatedAt: '2026-08-10 14:00:00',
    allocatedAt: '2026-08-10 14:00:00',
    freezeDeadline: '2026-08-11 14:00:00',
    notes: '客户经理跟进中',
    shares: null,
    frozenAmount: 3000000,
    amlFlags: [
      { type: 'large_transaction', status: 'approved', riskLevel: 'medium', reviewId: 'ltx9', createdAt: '2026-08-06 15:20:00' },
    ],
    riskAcknowledgement: { confirmed: true, confirmedAt: '2026-08-06 15:20:00', ipAddress: '10.0.0.60' },
    documentViewLogs: [],
    history: [
      { type: 'allocated', timestamp: '2026-08-10 14:00:00', actor: 'platform', note: '已转客户经理跟进' },
      { type: 'submitted', timestamp: '2026-08-06 15:20:00', actor: 'user', note: '提交问卷 · 意向金额 HK$ 300 万' },
    ],
  },
  {
    id: 's16',
    userId: 'u22', investorNo: 'INV-7743', investorName: '罗天宇',
    projectId: 'p3',
    projectName: 'SkyNet Robotics',
    amount: 3000000,
    status: 'signed',
    createdAt: '2026-07-15 11:00:00',
    orderNo: 'SUB20260715110000',
    updatedAt: '2026-07-20 10:00:00',
    allocatedAt: '2026-07-17 09:00:00',
    freezeDeadline: '2026-07-18 09:00:00',
    notes: '已完成',
    shares: 375,
    frozenAmount: 3000000,
    history: [
      { type: 'settled', timestamp: '2026-07-20 10:00:00', actor: 'system', note: '已标记完成', amount: -3000000 },
      { type: 'signed', timestamp: '2026-07-20 09:55:00', actor: 'platform', note: '已标记完成' },
      { type: 'allocated', timestamp: '2026-07-17 09:00:00', actor: 'platform', note: '已转客户经理跟进' },
      { type: 'submitted', timestamp: '2026-07-15 11:00:00', actor: 'user', note: '提交问卷 · 意向金额 HK$ 300 万' },
    ],
  },
  {
    id: 's17',
    userId: 'u23', investorNo: 'INV-3351', investorName: '梁静怡',
    projectId: 'p3',
    projectName: 'SkyNet Robotics',
    amount: 1000000,
    status: 'unallocated',
    createdAt: '2026-07-22 10:00:00',
    orderNo: 'SUB20260722100000',
    updatedAt: '2026-07-28 16:00:00',
    allocatedAt: null,
    freezeDeadline: null,
    notes: '本轮已结束，如有进一步意向可继续提交问卷',
    shares: null,
    frozenAmount: 0,
    amlFlags: [],
    riskAcknowledgement: { confirmed: true, confirmedAt: '2026-07-22 10:00:00', ipAddress: '10.0.0.62' },
    documentViewLogs: [],
    history: [
      { type: 'unallocated', timestamp: '2026-07-28 16:00:00', actor: 'platform', note: '本次提交暂无进一步安排' },
      { type: 'submitted', timestamp: '2026-07-22 10:00:00', actor: 'user', note: '提交问卷 · 意向金额 HK$ 100 万' },
    ],
  },
  {
    id: 's18',
    userId: 'u24', investorNo: 'INV-8809', investorName: '孙建华',
    projectId: 'p4',
    projectName: 'GreenCell Energy',
    amount: 2000000,
    status: 'signed',
    createdAt: '2026-07-08 14:00:00',
    orderNo: 'SUB20260708140000',
    updatedAt: '2026-07-15 10:30:00',
    allocatedAt: '2026-07-10 10:00:00',
    freezeDeadline: '2026-07-11 10:00:00',
    notes: '已完成',
    shares: 250,
    frozenAmount: 2000000,
    amlFlags: [],
    riskAcknowledgement: { confirmed: true, confirmedAt: '2026-07-08 14:00:00', ipAddress: '10.0.0.63' },
    documentViewLogs: [
      { documentType: 'agreement', viewedAt: '2026-07-15 10:25:00', duration: 80 },
    ],
    history: [
      { type: 'settled', timestamp: '2026-07-15 10:30:00', actor: 'system', note: '已标记完成', amount: -2000000 },
      { type: 'signed', timestamp: '2026-07-15 10:25:00', actor: 'platform', note: '已标记完成' },
      { type: 'allocated', timestamp: '2026-07-10 10:00:00', actor: 'platform', note: '已转客户经理跟进' },
      { type: 'submitted', timestamp: '2026-07-08 14:00:00', actor: 'user', note: '提交问卷 · 意向金额 HK$ 200 万' },
    ],
  },
  {
    id: 's20',
    userId: 'u26', investorNo: 'INV-5562', investorName: '陈嘉敏',
    projectId: 'p6',
    projectName: 'MediConnect Health',
    amount: 300000,
    status: 'unallocated',
    createdAt: '2026-06-25 09:30:00',
    orderNo: 'SUB20260625093000',
    updatedAt: '2026-07-08 15:00:00',
    allocatedAt: null,
    freezeDeadline: null,
    notes: '本轮已结束，如有进一步意向可继续提交问卷',
    shares: null,
    frozenAmount: 0,
    history: [
      { type: 'unallocated', timestamp: '2026-07-08 15:00:00', actor: 'platform', note: '本次提交暂无进一步安排' },
      { type: 'submitted', timestamp: '2026-06-25 09:30:00', actor: 'user', note: '提交问卷 · 意向金额 HK$ 30 万' },
    ],
  },
];

// ── amlFlags 字段对齐迁移（T1）：统一 PRD 结构 {type, level, triggeredAt, resolvedAt, resolvedBy, resolutionNote} ──
// PRD 08-数据字典 §4.1：amlFlags = [{ type, level, triggeredAt, resolvedAt, resolvedBy, resolutionNote }]
// level 语义 = 标记层级（大额交易按金额派生 one/two/three；其他类型沿用风险等级低/中/高）
// 迁移为纯函数：模块加载 + Storage.load 恢复旧快照后各调用一次（旧快照绕过模块级迁移的修复点）

// 大额交易审查层级：按金额派生（300万=one / 500万=two / 800万=three）
function deriveLargeTxLevel(amount) {
  const amt = Number(amount) || 0;
  if (amt >= 8000000) return 'three';
  if (amt >= 5000000) return 'two';
  if (amt >= 3000000) return 'one';
  return null;
}

// 归一化单个 amlFlag（对象补齐 PRD 字段；兼容字符串旧格式）
function normalizeAmlFlag(flag, ctx) {
  if (typeof flag === 'string') return { type: flag, level: 'low', triggeredAt: ctx?.triggeredAt || null, resolvedAt: null, resolvedBy: null, resolutionNote: null };
  if (typeof flag !== 'object' || flag === null) return null;
  const f = { ...flag };
  // level：大额交易按金额派生审查层级；其余沿用 riskLevel（若存在）兜底 low
  if (!f.level) {
    const lv = deriveLargeTxLevel(ctx?.amount);
    if (lv) f.level = lv;
    else if (f.riskLevel) f.level = f.riskLevel;
    else f.level = 'low';
  }
  if (!f.triggeredAt) f.triggeredAt = f.createdAt || ctx?.triggeredAt || null;
  if (!f.resolvedAt) f.resolvedAt = null;
  if (!f.resolvedBy) f.resolvedBy = null;
  if (!f.resolutionNote) f.resolutionNote = f.resolvedNote || null;
  delete f.createdAt;
  delete f.resolvedNote;
  return f;
}

// subscription amlFlags 归一化
export function normalizeSubscriptionAmlFlags() {
  subscriptions.forEach(sub => {
    if (!Array.isArray(sub.amlFlags)) return;
    sub.amlFlags = sub.amlFlags
      .map(flag => normalizeAmlFlag(flag, { amount: sub.amount, triggeredAt: sub.createdAt }))
      .filter(Boolean);
  });
}

// transaction amlFlags 归一化（旧格式 string[] → object[]）
export function normalizeTransactionAmlFlags() {
  transactions.forEach(tx => {
    if (!Array.isArray(tx.amlFlags) || tx.amlFlags.length === 0) return;
    tx.amlFlags = tx.amlFlags
      .map(flag => normalizeAmlFlag(flag, { amount: tx.amount, triggeredAt: tx.createdAt || null }))
      .filter(Boolean);
    delete tx.amlNote;
  });
}

// 模块加载：对 mock 初始数据执行一次
normalizeSubscriptionAmlFlags();

export const holdings = [
  {
    id: 'h1',
    projectId: 'p4',
    projectName: 'GreenCell Energy',
    shares: 375,
    costBasis: 3000000,
    currentValue: 3600000,
    lastUpdated: '2026-07-29',
    return: 20.0,
    dividendReceived: 0,   // 累计分红（投后分红发放回流，2026-08-14）
  },
];

export const transactions = [
  {
    id: 't21',
    orderNo: genOrderNo('TX', '2026-06-20 09:00:00'),
    type: 'withdraw',
    amount: 250000,
    currency: 'HKD',
    status: 'completed',
    createdAt: '2026-06-20',
    method: '银行转账',
    reference: 'T21-202606200900',
  },
  {
    id: 't22',
    orderNo: genOrderNo('TX', '2026-06-25 14:30:00'),
    type: 'deposit',
    amount: 1500000,
    currency: 'HKD',
    status: 'completed',
    createdAt: '2026-06-25',
    method: '银行转账',
    reference: 'T22-202606251430',
  },
  {
    id: 't1',
    orderNo: genOrderNo('TX', '2026-07-05 10:00:00'),
    type: 'deposit',
    amount: 5000000,
    currency: 'HKD',
    status: 'completed',
    createdAt: '2026-07-05',
    method: '银行转账',
    reference: 'T1-202607051000',
    // 合规标记（2026-08-26 新增）
    amlFlags: ['large_amount'],
    amlNote: '单笔大额存款，需人工审核',
  },
  {
    id: 't2',
    orderNo: genOrderNo('TX', '2026-07-10 09:30:15'),
    type: 'subscription',
    amount: 3000000,
    currency: 'HKD',
    status: 'completed',
    createdAt: '2026-07-10',
    projectName: 'GreenCell Energy',
    reference: 'T2-202607100930',
    // 合规标记（2026-08-26 新增）
    amlFlags: ['large_amount'],
    amlNote: '大额意向，已完成风险评估',
  },
  {
    id: 't3',
    orderNo: genOrderNo('TX', '2026-07-15 14:00:00'),
    type: 'deposit',
    amount: 200000,
    currency: 'USD',
    status: 'completed',
    createdAt: '2026-07-15',
    method: '跨境电汇',
    reference: 'T3-202607151400',
  },
  {
    id: 't4',
    orderNo: genOrderNo('TX', '2026-07-16 11:20:00'),
    type: 'exchange',
    amount: 780000,
    currency: 'HKD',
    status: 'completed',
    createdAt: '2026-07-16',
    method: 'USD→HKD',
    reference: 'T4-202607161120',
  },
  {
    id: 't5',
    orderNo: genOrderNo('TX', '2026-07-18 16:45:00'),
    type: 'withdraw',
    amount: 500000,
    currency: 'HKD',
    status: 'completed',
    createdAt: '2026-07-18',
    method: '银行转账',
    reference: 'T5-202607181645',
  },
  {
    id: 't6',
    orderNo: genOrderNo('TX', '2026-07-20 10:15:00'),
    type: 'deposit',
    amount: 1000000,
    currency: 'CNY',
    status: 'completed',
    createdAt: '2026-07-20',
    method: '银行转账',
    reference: 'T6-202607201015',
  },
  {
    id: 't7',
    orderNo: genOrderNo('TX', '2026-07-22 15:40:00'),
    type: 'subscription',
    amount: 1500000,
    currency: 'HKD',
    status: 'completed',
    createdAt: '2026-07-22',
    projectName: 'QuantumCore Technologies',
    reference: 'T7-202607221540',
  },
  {
    id: 't8',
    orderNo: genOrderNo('TX', '2026-07-25 11:05:00'),
    type: 'exit',
    amount: 3600000,
    currency: 'HKD',
    status: 'completed',
    createdAt: '2026-07-25',
    projectName: 'GreenCell Energy',
    reference: 'T8-202607251105',
    // 合规标记（2026-08-26 新增）
    amlFlags: ['large_amount', 'frequent_exit'],
    amlNote: '大额退出，需确认资金来源',
  },
  {
    id: 't9',
    orderNo: genOrderNo('TX', '2026-07-26 09:50:00'),
    type: 'exchange',
    amount: 300000,
    currency: 'HKD',
    status: 'completed',
    createdAt: '2026-07-26',
    method: 'CNY→HKD',
    reference: 'T9-202607260950',
  },
  {
    id: 't10',
    orderNo: genOrderNo('TX', '2026-07-28 17:20:00'),
    type: 'deposit',
    amount: 2000000,
    currency: 'HKD',
    status: 'completed',
    createdAt: '2026-07-28',
    method: '银行转账',
    reference: 'T10-202607281720',
    // 合规标记（2026-08-26 新增）
    amlFlags: ['large_amount'],
    amlNote: '大额存款',
  },
  {
    id: 't11',
    orderNo: genOrderNo('TX', '2026-07-30 10:35:00'),
    type: 'subscription',
    amount: 800000,
    currency: 'HKD',
    status: 'completed',
    createdAt: '2026-07-30',
    projectName: 'BioNova Biotech',
    reference: 'T11-202607301035',
  },
  {
    id: 't12',
    orderNo: genOrderNo('TX', '2026-08-01 14:10:00'),
    type: 'withdraw',
    amount: 300000,
    currency: 'HKD',
    status: 'completed',
    createdAt: '2026-08-01',
    method: '银行转账',
    reference: 'T12-202608011410',
  },
  {
    id: 't13',
    orderNo: genOrderNo('TX', '2026-08-03 09:25:00'),
    type: 'deposit',
    amount: 500000,
    currency: 'USD',
    status: 'completed',
    createdAt: '2026-08-03',
    method: '跨境电汇',
    reference: 'T13-202608030925',
    // 合规标记（2026-08-26 新增）
    amlFlags: ['cross_border', 'suspicious'],
    amlNote: '跨境电汇，来源国高风险，需进一步调查',
  },
  {
    id: 't14',
    orderNo: genOrderNo('TX', '2026-08-04 16:30:00'),
    type: 'exchange',
    amount: 200000,
    currency: 'HKD',
    status: 'completed',
    createdAt: '2026-08-04',
    method: 'USD→HKD',
    reference: 'T14-202608041630',
  },
  {
    id: 't15',
    orderNo: genOrderNo('TX', '2026-08-05 11:45:00'),
    type: 'subscription',
    amount: 1000000,
    currency: 'HKD',
    status: 'completed',
    createdAt: '2026-08-05',
    projectName: 'SkyNet Robotics',
    reference: 'T15-202608051145',
  },
  {
    id: 't16',
    orderNo: genOrderNo('TX', '2026-08-06 15:15:00'),
    type: 'exit',
    amount: 1200000,
    currency: 'HKD',
    status: 'completed',
    createdAt: '2026-08-06',
    projectName: 'BioNova Biotech',
    reference: 'T16-202608061515',
  },
  {
    id: 't17',
    orderNo: genOrderNo('TX', '2026-08-08 10:20:00'),
    type: 'withdraw',
    amount: 400000,
    currency: 'HKD',
    status: 'completed',
    createdAt: '2026-08-08',
    method: '银行转账',
    reference: 'T17-202608081020',
  },
  {
    id: 't18',
    orderNo: genOrderNo('TX', '2026-08-10 13:40:00'),
    type: 'deposit',
    amount: 600000,
    currency: 'HKD',
    status: 'completed',
    createdAt: '2026-08-10',
    method: '银行转账',
    reference: 'T18-202608101340',
    // 合规标记（2026-08-26 新增）
    amlFlags: ['structure_break'],
    amlNote: '疑似拆分交易，需核查',
  },
  {
    id: 't19',
    orderNo: genOrderNo('TX', '2026-08-12 09:55:00'),
    type: 'subscription',
    amount: 2000000,
    currency: 'HKD',
    status: 'completed',
    createdAt: '2026-08-12',
    projectName: 'MediConnect Health',
    reference: 'T19-202608120955',
  },
  {
    id: 't20',
    orderNo: genOrderNo('TX', '2026-08-13 16:05:00'),
    type: 'exchange',
    amount: 150000,
    currency: 'HKD',
    status: 'completed',
    createdAt: '2026-08-13',
    method: 'CNY→HKD',
    reference: 'T20-202608131605',
  },
];

// ── transaction amlFlags 归一化（T1）：string[] → object[]（模块加载执行一次） ──
normalizeTransactionAmlFlags();

export const assetHistory = [
  { date: '2025-08', total: 10500000 },
  { date: '2025-09', total: 11200000 },
  { date: '2025-10', total: 12100000 },
  { date: '2025-11', total: 11700000 },
  { date: '2025-12', total: 12600000 },
  { date: '2026-01', total: 13400000 },
  { date: '2026-02', total: 13800000 },
  { date: '2026-03', total: 14200000 },
  { date: '2026-04', total: 15300000 },
  { date: '2026-05', total: 14800000 },
  { date: '2026-06', total: 16200000 },
  { date: '2026-07', total: 18100000 },
];

export function getProjectById(id) {
  return projects.find(p => p.id === id);
}

export function getEventsByProject(projectId) {
  // 项目 ↔ 路演双关联方向（2026-08-12 后台勾选路演引入 project.events 聚合）：
  // ① project.events = 项目聚合的路演 id 数组（后台可编辑，多选）
  // ② event.projectId = 路演归属项目（mock 预置数据）
  // 两方向都命中则返回该项目的相关路演（去重）。
  const proj = getProjectById(projectId);
  const byIdArray = (proj?.events || []).map(id => events.find(e => e.id === id)).filter(Boolean);
  const byOwnership = events.filter(e => e.projectId === projectId);
  const seen = new Set();
  return [...byIdArray, ...byOwnership].filter(e => (seen.has(e.id) ? false : (seen.add(e.id), true)));
}

export function getUpcomingEvents() {
  return events.filter(e => e.status === 'upcoming');
}

export function getProjectSubscriptions(projectId) {
  return subscriptions.filter(s => s.projectId === projectId);
}

export const subscriptionStatusLabels = {
  // 2026-10-22 RO 整改：申购链路整体改为问卷口径（文件已提交 → 客户经理跟进 → 已完成）
  submitted: '文件已提交',
  allocated: '客户经理跟进中',
  signed: '已完成',
  unallocated: '暂无需推进',
};

export const historyTypeLabels = {
  submitted: '提交问卷',
  allocated: '转客户经理跟进',
  frozen: '资金冻结',
  unfrozen: '资金释放',
  signed: '标记完成',
  settled: '份额确认',
  unallocated: '暂无需推进',
};

export const actorLabels = {
  user: '本人',
  platform: '平台',
  system: '系统',
};

export const projectStageColors = {
  'B轮': '#f59e0b',
  'C轮': '#f97316',
  'C+轮': '#8b5cf6',
  'Pre-IPO轮': '#2E7D32',
};

export function getProjectStageSlug(stage) {
  if (stage === 'B轮') return 'b';
  if (stage === 'C轮') return 'c';
  if (stage === 'C+轮') return 'c-plus';
  if (stage === 'Pre-IPO轮') return 'pre-ipo';
  return '';
}

export function getProjectHeroGradient(sector) {
  const gradients = {
    '量子计算': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    '生物医药': 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    '机器人': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    '新能源': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    '金融科技': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    '医疗健康': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  };
  return gradients[sector] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
}

export function getProjectHeroEmoji(sector) {
  const icons = {
    '量子计算': '⟳',
    '生物医药': '⧗',
    '机器人': '◈',
    '新能源': '⌁',
    '金融科技': '◉',
    '医疗健康': '♡',
  };
  return icons[sector] || '◉';
}

export const projectStatusLabels = {
  // 2026-10-22 RO 整改：raising 不再表达「开放申购」（募资语义），改为中性引导词；
  // closed/sold 同步中性化（分配/售罄同属卖方语义）
  raising: '了解详情',
  upcoming: '即将上线',
  closed: '已结束',
  sold: '已结束',
};

export const eventStatusLabels = {
  upcoming: '即将开始',
  past: '往期回顾',
};

export const registeredEventIds = new Set();
export const registeredEventIds_arr = []; // Array 镜像，用于 localStorage 序列化
export const eventRegistrations = {}; // { [eventId]: { accompanying: 0-3, registeredAt } }

// 报名名单（后台报名管理用）：结构化记录每位报名者信息
// 约定：event.registered 由本名单派生（口径单一真源，见 syncEventRegistered）
//   - 线下（offline）报名生成入场凭证码 checkInCode，状态 registered（未签到）/ checked-in（已签到）
//   - 线上（online）报名无凭证码（checkInCode: null，凭 joinUrl 加入），无签到维度，状态恒 registered
export const eventRegistrationsList = [
  // ---- e3 线下参观日（QuantumCore 香港实验室，2026-09-05）----
  {
    id: 'reg1',
    eventId: 'e3',
    eventName: '参观日：QuantumCore 香港实验室',
    userId: 'u9',
    investorNo: 'INV-9021',
    name: '吴世昌',
    phone: '+852 6222 3344',
    accompanying: 1,
    checkInCode: getCheckInCode('e3', 'u9', 1),
    registeredAt: '2026-08-01 10:22:33',
    status: 'registered', // registered | checked-in
    leadStatus: 'converted', // 线索跟进状态：已转化（演示）
  },
  {
    id: 'reg2',
    eventId: 'e3',
    eventName: '参观日：QuantumCore 香港实验室',
    userId: 'u10',
    investorNo: 'INV-8773',
    name: '郑婉仪',
    phone: '+852 9555 6677',
    accompanying: 0,
    checkInCode: getCheckInCode('e3', 'u10', 0),
    registeredAt: '2026-08-02 14:05:11',
    status: 'checked-in',
    checkedInAt: '2026-08-02 16:20:48',
    checkedInBy: '系统管理员',
  },
  {
    id: 'reg11',
    eventId: 'e3',
    eventName: '参观日：QuantumCore 香港实验室',
    userId: 'u12',
    investorNo: 'INV-7645',
    name: '陈嘉豪',
    phone: '+852 6333 2211',
    accompanying: 0,
    checkInCode: getCheckInCode('e3', 'u12', 0),
    registeredAt: '2026-08-05 09:15:02',
    status: 'registered',
  },
  {
    id: 'reg12',
    eventId: 'e3',
    eventName: '参观日：QuantumCore 香港实验室',
    userId: 'u13',
    investorNo: 'INV-7198',
    name: '梁美琪',
    phone: '+852 9777 1100',
    accompanying: 2,
    checkInCode: getCheckInCode('e3', 'u13', 2),
    registeredAt: '2026-08-08 15:40:19',
    status: 'registered',
    companions: [
      { name: '陈俊豪', phone: '+852 9011 2233' },
      { name: '周芷若' }, // 联系方式可选（后台补充）
    ],
  },
  {
    id: 'reg13',
    eventId: 'e3',
    eventName: '参观日：QuantumCore 香港实验室',
    userId: 'u14',
    investorNo: 'INV-6852',
    name: '罗志强',
    phone: '+852 6100 8877',
    accompanying: 0,
    checkInCode: getCheckInCode('e3', 'u14', 0),
    registeredAt: '2026-08-10 11:08:55',
    status: 'checked-in',
    checkedInAt: '2026-08-12 18:33:21',
    checkedInBy: '系统管理员',
  },
  // ---- e6 线下上市前交流会（GreenCell Energy，2026-07-20 · 往期）----
  {
    id: 'reg3',
    eventId: 'e6',
    eventName: 'GreenCell 上市前投资人交流会',
    userId: 'u11',
    investorNo: 'INV-8230',
    name: '何俊杰',
    phone: '+852 6888 9900',
    accompanying: 0,
    checkInCode: null, // e6 为线上路演，无凭证码（历史残留已清）
    registeredAt: '2026-07-18 09:41:27',
    status: 'registered',
  },
  {
    id: 'reg20',
    eventId: 'e6',
    eventName: 'GreenCell 上市前投资人交流会',
    userId: 'u15',
    investorNo: 'INV-6401',
    name: '周凯文',
    phone: '+852 9200 3300',
    accompanying: 1,
    checkInCode: null, // e6 为线上路演，无凭证码
    registeredAt: '2026-07-15 14:12:08',
    status: 'registered',
  },
  // ---- e1 线上路演（QuantumCore，2026-08-15）----
  {
    id: 'reg4',
    eventId: 'e1',
    eventName: 'QuantumCore 线上路演 — 量子计算的商业化路径',
    userId: 'u16',
    investorNo: 'INV-5587',
    name: '黄俊杰',
    phone: '+852 9666 8800',
    accompanying: 0,
    checkInCode: null, // 线上无凭证码
    registeredAt: '2026-07-28 10:00:12',
    status: 'registered',
    leadStatus: 'contacted', // 已联系（演示）
  },
  {
    id: 'reg5',
    eventId: 'e1',
    eventName: 'QuantumCore 线上路演 — 量子计算的商业化路径',
    userId: 'u17',
    investorNo: 'INV-5123',
    name: '刘倩',
    phone: '+852 9333 4477',
    accompanying: 0,
    checkInCode: null,
    registeredAt: '2026-07-30 16:22:45',
    status: 'registered',
    leadStatus: 'paused', // 暂不跟进（演示）
  },
  {
    id: 'reg6',
    eventId: 'e1',
    eventName: 'QuantumCore 线上路演 — 量子计算的商业化路径',
    userId: 'u18',
    investorNo: 'INV-4790',
    name: '杨志明',
    phone: '+852 6555 8899',
    accompanying: 0,
    checkInCode: null,
    registeredAt: '2026-08-03 09:05:31',
    status: 'registered',
  },
  {
    id: 'reg7',
    eventId: 'e1',
    eventName: 'QuantumCore 线上路演 — 量子计算的商业化路径',
    userId: 'u19',
    investorNo: 'INV-4312',
    name: '林晓彤',
    phone: '+852 9088 2233',
    accompanying: 0,
    checkInCode: null,
    registeredAt: '2026-08-07 19:44:02',
    status: 'registered',
  },
  // ---- e2 线上临床数据解读会（BioNova，2026-08-22）----
  {
    id: 'reg8',
    eventId: 'e2',
    eventName: 'BioNova 临床数据解读会',
    userId: 'u20',
    investorNo: 'INV-3998',
    name: '张伟明',
    phone: '+852 9222 6655',
    accompanying: 0,
    checkInCode: null,
    registeredAt: '2026-08-01 11:30:27',
    status: 'registered',
    leadStatus: 'invited', // 已邀约（演示）
  },
  {
    id: 'reg9',
    eventId: 'e2',
    eventName: 'BioNova 临床数据解读会',
    userId: 'u21',
    investorNo: 'INV-3564',
    name: '陈丽华',
    phone: '+852 6777 9900',
    accompanying: 0,
    checkInCode: null,
    registeredAt: '2026-08-06 14:18:53',
    status: 'registered',
  },
  {
    id: 'reg10',
    eventId: 'e2',
    eventName: 'BioNova 临床数据解读会',
    userId: 'u22',
    investorNo: 'INV-3109',
    name: '王浩然',
    phone: '+852 9455 7788',
    accompanying: 0,
    checkInCode: null,
    registeredAt: '2026-08-10 08:52:40',
    status: 'registered',
  },
  // ---- e4 线上产品演示会（SkyNet，2026-09-12）----
  {
    id: 'reg14',
    eventId: 'e4',
    eventName: 'SkyNet 产品演示会 — AMR 仓储自动化解决方案',
    userId: 'u23',
    investorNo: 'INV-2875',
    name: '郑子谦',
    phone: '+852 9111 4477',
    accompanying: 0,
    checkInCode: null,
    registeredAt: '2026-08-03 13:25:16',
    status: 'registered',
  },
  {
    id: 'reg15',
    eventId: 'e4',
    eventName: 'SkyNet 产品演示会 — AMR 仓储自动化解决方案',
    userId: 'u24',
    investorNo: 'INV-2451',
    name: '吴凯琳',
    phone: '+852 6888 2200',
    accompanying: 0,
    checkInCode: null,
    registeredAt: '2026-08-09 17:02:58',
    status: 'registered',
  },
  {
    id: 'reg16',
    eventId: 'e4',
    eventName: 'SkyNet 产品演示会 — AMR 仓储自动化解决方案',
    userId: 'u25',
    investorNo: 'INV-2017',
    name: '黄思远',
    phone: '+852 9660 3344',
    accompanying: 0,
    checkInCode: null,
    registeredAt: '2026-08-11 10:47:21',
    status: 'registered',
  },
  // ---- e5 线上 RWA 分享（Aurora FinTech，2026-09-20）----
  {
    id: 'reg17',
    eventId: 'e5',
    eventName: 'Aurora FinTech — RWA 代币化如何改变私募市场',
    userId: 'u26',
    investorNo: 'INV-1768',
    name: '何秀英',
    phone: '+852 6000 9911',
    accompanying: 0,
    checkInCode: null,
    registeredAt: '2026-08-05 09:33:44',
    status: 'registered',
  },
  {
    id: 'reg18',
    eventId: 'e5',
    eventName: 'Aurora FinTech — RWA 代币化如何改变私募市场',
    userId: 'u27',
    investorNo: 'INV-1324',
    name: '许志宏',
    phone: '+852 9333 5566',
    accompanying: 0,
    checkInCode: null,
    registeredAt: '2026-08-10 15:20:09',
    status: 'registered',
  },
  // ---- e7 线上市场展望（HighBlock，2026-09-25）----
  {
    id: 'reg22',
    eventId: 'e7',
    eventName: '2026 夏季私募市场展望 — 新经济赛道投资策略',
    userId: 'u28',
    investorNo: 'INV-0890',
    name: '苏慧敏',
    phone: '+852 9444 1177',
    accompanying: 0,
    checkInCode: null,
    registeredAt: '2026-08-06 12:11:35',
    status: 'registered',
  },
  {
    id: 'reg23',
    eventId: 'e7',
    eventName: '2026 夏季私募市场展望 — 新经济赛道投资策略',
    userId: 'u29',
    investorNo: 'INV-0456',
    name: '谢志华',
    phone: '+852 6777 8833',
    accompanying: 0,
    checkInCode: null,
    registeredAt: '2026-08-09 18:26:50',
    status: 'registered',
  },
  {
    id: 'reg24',
    eventId: 'e7',
    eventName: '2026 夏季私募市场展望 — 新经济赛道投资策略',
    userId: 'u30',
    investorNo: 'INV-0030',
    name: '邓美玲',
    phone: '+852 9200 6644',
    accompanying: 0,
    checkInCode: null,
    registeredAt: '2026-08-12 09:40:12',
    status: 'registered',
  },
  // reg25：与 reg4（黄俊杰 INV-5587）同手机号报名 e7 —— 演示"同客户多场报名"聚合（客户价值信号）
  {
    id: 'reg25',
    eventId: 'e7',
    eventName: '2026 夏季私募市场展望 — 新经济赛道投资策略',
    userId: 'u16',
    investorNo: 'INV-5587',
    name: '黄俊杰',
    phone: '+852 9666 8800',
    accompanying: 0,
    checkInCode: null,
    registeredAt: '2026-08-05 20:15:40',
    status: 'registered',
    leadStatus: 'contacted', // 与 reg4 同客户：已联系
  },
];
// 专属顾问池（账户级属性：每个 KYC 用户关联一位专属顾问；报名通过 userId 派生，不冗余存储）
export const accountManagers = [
  { id: 'am1', name: '王慧敏', role: '专属顾问', phone: '+852 9300 1122' },
  { id: 'am2', name: '陈志豪', role: '专属顾问', phone: '+852 9188 5566' },
  { id: 'am3', name: '李雅婷', role: '专属顾问', phone: '+852 9777 3344' },
];

// mock 用户 → 专属顾问映射（顾问 = KYC 用户账户级属性；报名通过 userId 派生顾问，见 getManagerForUser）
// let + Storage 持久化：用户管理可分配专属顾问（#38），接后端由账户体系管理
let userAccountManagers = {
  u1: 'am1', u2: 'am1', u3: 'am1', u9: 'am1', u10: 'am2', u11: 'am3', u12: 'am1', u13: 'am2', u14: 'am3',
  u15: 'am1', u16: 'am2', u17: 'am3', u18: 'am1', u19: 'am2', u20: 'am3',
  u21: 'am1', u22: 'am2', u23: 'am3', u24: 'am1', u25: 'am2', u26: 'am3',
  u27: 'am1', u28: 'am2', u29: 'am3', u30: 'am1',
};

// 报名关联的专属顾问 = 该报名 KYC 用户（userId）的顾问（派生，不冗余存储）
export function getManagerForUser(userId) {
  return accountManagers.find(m => m.id === userAccountManagers[userId]) || null;
}

// 姓名/联系方式脱敏（PDPO：列表不暴露个人可识别信息；抽屉内授权查看全量）
export function maskName(name) {
  if (!name) return '';
  const s = String(name).trim();
  if (s.length <= 1) return s;
  if (s.length === 2) return `${s[0]}*`;
  return `${s[0]}**`;
}
export function maskPhone(phone) {
  if (!phone) return '';
  const s = String(phone).trim();
  if (s.length <= 8) return `${s.slice(0, 2)}****`;
  // 保留区号 + 首数字 + 尾 4 位：+852 6*** 3344
  return `${s.slice(0, 5)}${s.slice(5, 6)}***${s.slice(-4)}`;
}
export function maskEmail(email) {
  if (!email) return '';
  const [local, domain] = String(email).split('@');
  if (!domain) return String(email).replace(/./g, '*');
  const head = local.length <= 2 ? local.slice(0, 1) : local.slice(0, 2);
  return `${head}${'*'.repeat(local.length - head.length)}@${domain}`;
}

// 补充陪同人（仅后台维护：一人报名多人参加，陪同人也是潜在客户，维护姓名+可选联系方式）
export function addCompanion(regId, { name, phone = '', email = '' }) {
  const r = eventRegistrationsList.find(x => x.id === regId);
  if (!r || !name || !name.trim()) return false;
  r.companions = r.companions || [];
  r.companions.push({ name: name.trim(), phone: phone.trim(), email: email.trim() });
  Storage.save();
  return true;
}
export function removeCompanion(regId, index) {
  const r = eventRegistrationsList.find(x => x.id === regId);
  if (!r || !r.companions) return false;
  r.companions.splice(index, 1);
  Storage.save();
  return true;
}

// 问卷提交 → 当前用户报名线索自动"已转化"（报名客户进入跟进漏斗，与问卷记录语义联动）
export function convertLeadsToSubscribed() {
  let changed = false;
  eventRegistrationsList.forEach(r => {
    if (r.userId === currentUser.id && (r.leadStatus || 'new') !== 'converted') {
      r.leadStatus = 'converted';
      changed = true;
    }
  });
  if (changed) Storage.save();
  return changed;
}

// 报名线索跟进状态机（客户发掘 · 销售漏斗，2026-08-12 与业务对齐重定义）：
//   new 新线索（报名后待首联）→ contacted 已联系（客户经理已破冰）
//   → invited 已邀约（已邀进一步沟通：一对一尽调/下场活动）
//   → converted 已转化（【= 已提交问卷】报名客户进入项目跟进漏斗，与问卷记录语义联动）
//   ↘ paused 暂缓（客户婉拒/暂不参与）
// 待跟进 = new/contacted/invited（未转化未暂缓）；已转化后客户到「问卷记录」跟进
export const regLeadStatusLabels = {
  new: '新线索',
  contacted: '已联系',
  invited: '已邀约',
  converted: '已转化',
  paused: '暂缓',
};

// 客户跟进日志（CRM 核心留痕：状态是"当前快照"，动作是"历史"——
// updateClientLeadStatus 每次变更写入，客户经理可追溯"谁、何时、通过什么方式、聊了什么"）
// 预置 mock 日志供演示（与名单 leadStatus 状态对应；接后端由 CRM 跟进记录替换）
export const leadFollowups = [
  // 吴世昌（u9 · INV-9021，converted）——完整转化链
  { id: 'f1', userId: 'u9', at: '2026-08-01 11:20:00', operator: '王慧敏', from: 'new', to: 'contacted', note: '电话首联，客户对量子计算商业化路径感兴趣，约下期路演' },
  { id: 'f2', userId: 'u9', at: '2026-08-05 15:30:00', operator: '王慧敏', from: 'contacted', to: 'invited', note: '发送参观日邀请，客户确认出席并携带 1 人' },
  { id: 'f3', userId: 'u9', at: '2026-09-05 17:40:00', operator: '王慧敏', from: 'invited', to: 'converted', note: '参观日现场跟进，客户提交问卷（转化）' },
  // 刘倩（u17 · INV-5123，paused）——暂缓链
  { id: 'f4', userId: 'u17', at: '2026-08-02 14:45:00', operator: '陈志豪', from: 'new', to: 'contacted', note: '微信联系，对新能源方向有配置意愿' },
  { id: 'f5', userId: 'u17', at: '2026-08-06 10:00:00', operator: '陈志豪', from: 'contacted', to: 'paused', note: '客户近期资金安排变动，暂缓跟进，Q4 再联系' },
  // 张伟明（u20 · INV-3998，invited）——邀约链
  { id: 'f6', userId: 'u20', at: '2026-08-02 09:10:00', operator: '李雅婷', from: 'new', to: 'contacted', note: '电话首联，对生物医药临床数据感兴趣' },
  { id: 'f7', userId: 'u20', at: '2026-08-07 17:05:00', operator: '李雅婷', from: 'contacted', to: 'invited', note: '邀约临床数据解读会，客户已报名确认' },
  // 黄俊杰（u16 · INV-5587，contacted）
  { id: 'f8', userId: 'u16', at: '2026-08-05 10:30:00', operator: '陈志豪', from: 'new', to: 'contacted', note: '邮件首联，客户已报名夏季市场展望，兴趣一般待跟进' },
  // 梁美琪（u13 · INV-7198，new）
  { id: 'f9', userId: 'u13', at: '2026-08-05 16:40:00', operator: '陈志豪', from: 'new', to: 'contacted', note: '电话联系，客户带 2 位同行参与参观日' },
];

// 客户级跟进状态：更新该账户（userId）全部报名记录的 leadStatus（CRM「客户是实体，报名是事件」——
// 跟进动作发生在客户身上，改一次联动该客户所有报名，杜绝"同客户多条各自独立状态"）
// note/operator：跟进备注 + 操作人（写入 leadFollowups 留痕——CRM 核心：状态是快照，动作是历史）
export function updateClientLeadStatus(userId, status, note = '', operator = '') {
  if (!regLeadStatusLabels[status]) return false;
  const from = getLeadClients().find(c => c.userId === userId)?.leadStatus || 'new';
  let changed = false;
  eventRegistrationsList.forEach(r => {
    if (r.userId === userId && (r.leadStatus || 'new') !== status) {
      r.leadStatus = status;
      changed = true;
    }
  });
  if (changed) {
    leadFollowups.push({
      id: `f${Date.now()}`,
      userId,
      at: formatNow(),
      operator: operator || '系统',
      from,
      to: status,
      note,
    });
    logAudit({ operator: operator || '系统', category: 'lead', action: 'update', target: getLeadClients().find(c => c.userId === userId)?.name || '', targetId: userId, note: `客户跟进：${regLeadStatusLabels[from] || from} → ${regLeadStatusLabels[status]}` });
    Storage.save();
  }
  return changed;
}

// 客户线索 = 按账户（userId）聚合派生：客户是实体，报名是事件（CRM 标准）
// 每个客户 = 一份跟进状态 + N 条报名明细；列表按客户去重，抽屉看全部报名
export function getLeadClients() {
  const map = new Map();
  for (const r of eventRegistrationsList) {
    const key = r.userId || r.phone;
    if (!map.has(key)) {
      map.set(key, {
        userId: r.userId,
        investorNo: r.investorNo,
        name: r.name,
        phone: r.phone,
        email: r.email,
        leadStatus: r.leadStatus || 'new',
        regs: [],
        latestAt: '',
      });
    }
    const c = map.get(key);
    c.regs.push(r);
    // 展示信息 + 客户级跟进状态都取最新一条（registeredAt 最大，2026-08-15 修复：
    //   原实现按数组顺序最后一条覆盖，而 registerEvent unshift 让最新报名在数组头 → 取到最老一条的 bug）
    if (String(r.registeredAt) > String(c.latestAt)) {
      c.name = r.name; c.email = r.email; c.investorNo = r.investorNo;
      // 线上报名手机选填：空值不覆盖历史有效号码
      if (r.phone) c.phone = r.phone;
      c.latestAt = r.registeredAt;
      c.leadStatus = r.leadStatus || 'new';
    }
  }
  return [...map.values()].map(c => ({
    ...c,
    eventCount: c.regs.length,
    regIds: c.regs.map(x => x.id),
    companions: c.regs.flatMap(x => x.companions || []), // 全部报名陪同人
    followups: leadFollowups
      .filter(f => f.userId === c.userId)
      .sort((a, b) => String(b.at).localeCompare(String(a.at))), // 跟进日志倒序（最新在前）
  }));
}

// 名单派生总数：event.registered 与 eventRegistrationsList 数量严格一致（口径单一真源）
// 用户在用户侧报名/取消后，registerEvent/unregisterEvent 均调用本函数重算，杜绝"名单与总人数对不上账"
export function syncEventRegistered() {
  events.forEach(ev => {
    ev.registered = eventRegistrationsList.filter(r => r.eventId === ev.id).length;
  });
}
syncEventRegistered();
// 报名人联系方式：mock email 按 investorNo 派生（避免手写 21 条；接后端由真实邮箱替换）
eventRegistrationsList.forEach(r => {
  if (!r.email) r.email = `investor${String(r.investorNo).replace('INV-', '')}@example.com`;
});

// 用户报名：写入报名名单（后台报名管理可查）
// phone/email = 报名表单联系方式（用户可改）——报名表是客户线索（发掘潜在客户），联系方式为核心字段
export function registerEvent(id, accompanying = 0, phone = '', email = '') {
  const evt = events.find(e => e.id === id);
  const regPhone = String(phone || '').trim();
  const regEmail = String(email || currentUser.email || '').trim();
  const isOffline = evt && evt.type === 'offline';
  // 线下活动必须留联系电话；线上活动选填（没有短信通道，仅用于人工联络）
  if (isOffline && !regPhone) return false;
  if (!regEmail) return false;
  registeredEventIds.add(id);
  registeredEventIds_arr.push(id);
  const registeredAt = new Date().toISOString();
  eventRegistrations[id] = { accompanying, registeredAt };
  // 新报名跟进状态（2026-08-15 方案 C：中段继承 + 终态重置）
  //   CRM 客户级跟进不因新报名倒退：已联系/已邀约客户报新场 = 持续兴趣 → 继承当前状态；
  //   已转化/暂缓客户复报 = 新机会 → 重置"待联系"（重新激活）
  const existingLead = getLeadClients().find(c => c.userId === currentUser.id);
  const inheritStatus = existingLead && !['converted', 'paused'].includes(existingLead.leadStatus)
    ? existingLead.leadStatus
    : 'new';
  eventRegistrationsList.unshift({
    id: `reg${Date.now()}`,
    eventId: id,
    eventName: evt ? evt.title : id,
    userId: currentUser.id,
    investorNo: getInvestorNo(currentUser.id),
    name: currentUser.name || '',
    phone: regPhone,
    email: regEmail,
    accompanying,
    companions: [], // 陪同人姓名（仅后台维护：一人报名多人参加）
    // 凭证码仅线下生成（线上凭 joinUrl 加入会议，无入场签到概念）
    // userId 派生：同一手机号（家庭/公司共用）不会撞码
    checkInCode: isOffline ? getCheckInCode(id, currentUser.id, accompanying) : null,
    registeredAt,
    status: 'registered',
    leadStatus: inheritStatus,
    // 专属顾问不冗余存储：通过 userId → KYC 用户 → accountManager 派生（getManagerForUser）
  });
  syncEventRegistered(); // 名单派生总数
  logAudit({ operator: currentUser.name || '投资人', category: 'registration', action: 'register', target: evt ? evt.title : id, targetId: id, note: `报名活动（陪同 ${accompanying} 人）` });
  Storage.save();
  return true;
}

export function unregisterEvent(id) {
  registeredEventIds.delete(id);
  const idx = registeredEventIds_arr.indexOf(id);
  if (idx > -1) registeredEventIds_arr.splice(idx, 1);
  delete eventRegistrations[id];
  const li = eventRegistrationsList.findIndex(r => r.eventId === id && r.userId === currentUser.id);
  if (li > -1) eventRegistrationsList.splice(li, 1);
  syncEventRegistered(); // 名单派生总数
  logAudit({ operator: currentUser.name || '投资人', category: 'registration', action: 'unregister', target: events.find(e => e.id === id)?.title || id, targetId: id, note: '取消报名' });
  Storage.save();
}

// 按凭证码查找报名（后台签到核验）。eventId 可选：凭证码与路演绑定，核验时限定路演范围
export function getRegistrationByCode(code, eventId) {
  if (!code) return null;
  return eventRegistrationsList.find(r => r.checkInCode === code && (!eventId || r.eventId === eventId)) || null;
}

// 签到：registered → checked-in（记录留痕：谁、何时、对谁——老板 2026-08-06"全流程留痕审计"）
export function checkInRegistration(regId, operator = '') {
  const r = eventRegistrationsList.find(x => x.id === regId);
  if (!r || r.status !== 'registered') return false;
  r.status = 'checked-in';
  r.checkedInAt = formatNow();
  r.checkedInBy = operator || '系统';
  logAudit({ operator: operator || '系统', category: 'registration', action: 'checkin', target: r.name, targetId: regId, note: '现场签到核验' });
  Storage.save();
  return true;
}

// 撤销签到：checked-in → registered（现场误操作纠错，清留痕）
export function undoCheckInRegistration(regId) {
  const r = eventRegistrationsList.find(x => x.id === regId);
  if (!r || r.status !== 'checked-in') return false;
  r.status = 'registered';
  delete r.checkedInAt;
  delete r.checkedInBy;
  logAudit({ operator: '系统', category: 'registration', action: 'uncheckin', target: r.name, targetId: regId, note: '撤销签到（现场纠错）' });
  Storage.save();
  return true;
}

export function isEventRegistered(id) {
  return registeredEventIds.has(id);
}

export function getEventRegistration(id) {
  return eventRegistrations[id] || null;
}

// 报名表预填：取当前用户最近一条「非空」报名手机号（线上空值不覆盖）
export function getLastContactPhone(userId = currentUser.id) {
  const list = eventRegistrationsList
    .filter(r => r.userId === userId && r.phone)
    .sort((a, b) => String(b.registeredAt).localeCompare(String(a.registeredAt)));
  return list[0]?.phone || '';
}

// 判断事件是否正在进行（基于当前时间）
export function isEventLive(event) {
  if (event.status === 'past') return false;
  if (event.status !== 'upcoming') return false;
  if (!event.date || !event.time) return false; // 无日期/时间（如后台新建未填完整）→ 不判进行中
  const now = new Date();
  const [year, month, day] = event.date.split('-').map(Number);
  const timeParts = event.time.split('-');
  if (timeParts.length < 2) return false;
  const [startHour, startMin] = timeParts[0].split(':').map(Number);
  const [endHour, endMin] = timeParts[1].split(':').map(Number);
  if ([startHour, startMin, endHour, endMin].some(Number.isNaN)) return false;
  const start = new Date(year, month - 1, day, startHour, startMin);
  const end = new Date(year, month - 1, day, endHour, endMin);
  return now >= start && now <= end;
}

// 判断事件是否"已过结束时间但未归档"（upcoming + 结束时刻已过 → 辅助运营归档，不自动切换）
export function isEventOverdue(event) {
  if (!event || event.status !== 'upcoming') return false;
  if (!event.date || !event.time) return false;
  const [y, m, d] = event.date.split('-').map(Number);
  const parts = event.time.split('-');
  if (parts.length < 2) return false;
  const [eh, em] = parts[1].split(':').map(Number);
  if ([y, m, d, eh, em].some(Number.isNaN)) return false;
  return new Date(y, m - 1, d, eh, em) < new Date();
}

export function getCheckInCode(eventId, regKey, accompanying = 0) {
  const src = `${eventId}|${regKey || ''}|${accompanying}`;
  let h1 = 0;
  let h2 = 0;
  for (let i = 0; i < src.length; i++) {
    h1 = (h1 * 31 + src.charCodeAt(i)) >>> 0;
    h2 = (h2 * 17 + src.charCodeAt(i)) >>> 0;
  }
  const seg = (n) => {
    const s = n.toString(36).toUpperCase();
    return s.padStart(4, '0').slice(-4);
  };
  return `${seg(h1)}-${seg(h2)}`;
}

export const notifications = [
  {
    id: 'n1',
    type: 'subscription',
    title: '问卷进度更新',
    body: '您在 SkyNet Robotics 的问卷已转客户经理跟进，顾问会与您联系。',
    createdAt: '2026-07-28 18:00',
    read: false,
  },
  {
    id: 'n2',
    type: 'event',
    title: '路演提醒',
    body: 'QuantumCore 线上路演将于 8 月 15 日 14:00 开始，会议链接将在活动前 24 小时通过站内通知及邮件发送。',
    createdAt: '2026-07-30 10:00',
    read: false,
  },
  {
    id: 'n3',
    type: 'event',
    title: '路演报名成功',
    body: '您已成功报名 SkyNet 产品演示会，请于活动前查收会议链接。',
    createdAt: '2026-07-24 16:40',
    read: true,
  },
  {
    id: 'n5',
    type: 'service',
    title: '专属顾问服务',
    body: '您的专属客户经理王慧敏已为您服务，可在「我的」页面随时联系。',
    createdAt: '2026-07-01 09:00',
    read: true,
  },
];

// 通知类型语义元数据（2026-08-14 广播台账化）：后台/用户侧统一语义
// subscription 主色蓝 / event 金 / wallet 绿 / service 橙（对齐用户侧 Notifications.jsx typeMeta）
export const NOTICE_TYPE_META = {
  subscription: { label: '问卷', cls: 'admin-status-notify-sub' },
  event: { label: '活动', cls: 'admin-status-notify-event' },
  wallet: { label: '资金', cls: 'admin-status-notify-wallet' },
  service: { label: '服务', cls: 'admin-status-notify-service' },
};

// 广播台账（2026-08-14 通知触达页广播台账化 · 方案 A）：
// 平台发送动作的独立实体——与用户侧 notifications（收件箱）解耦。
// 字段：orderNo 广播单号 / type 类型 / title 标题 / body 正文 / target 目标受众 / operator 发送人 / createdAt
//      / status 发送状态（sent 已发送 / scheduled 已排期·定时）/ scheduledAt 计划发送时间（定时才有）
// 预置 3 条演示广播（覆盖多类型 + 多发送人）；接后端由服务端广播记录替换
export const broadcastLogs = [
  {
    id: 'b1',
    orderNo: genOrderNo('BR', '2026-08-11 14:00:00'),
    type: 'event',
    title: 'QuantumCore 线上路演提醒',
    body: 'QuantumCore 线上路演将于 8 月 15 日 14:00 开始，会议链接将在活动前 24 小时通过站内通知及邮件发送。',
    target: '全部投资人',
    operator: '系统管理员',
    createdAt: '2026-08-11 14:00:00',
    status: 'sent',
    scheduledAt: null,
  },
  {
    id: 'b2',
    orderNo: genOrderNo('BR', '2026-08-12 10:30:00'),
    type: 'subscription',
    title: '问卷进度说明',
    body: '近期项目问卷已陆续转客户经理跟进，请留意「问卷记录」页面的状态更新。',
    target: '全部投资人',
    operator: '运营专员',
    createdAt: '2026-08-12 10:30:00',
    status: 'sent',
    scheduledAt: null,
  },
  {
    id: 'b3',
    orderNo: genOrderNo('BR', '2026-08-13 16:45:00'),
    type: 'service',
    title: '专属顾问服务升级',
    body: '专属顾问团队已全面升级服务，可在「我的」页面随时联系您的专属顾问。',
    target: '全部投资人',
    operator: '客服专员',
    createdAt: '2026-08-13 16:45:00',
    status: 'sent',
    scheduledAt: null,
  },
];

export function markNotificationRead(id) {
  const n = notifications.find(item => item.id === id);
  if (n) n.read = true;
}

export function pushNotification(item, userId) {
  // userId 为空 = 全员（系统自动通知/全员广播）；给定时写入 toUserId，收件箱侧按当前用户过滤
  notifications.unshift({
    id: `n${Date.now()}`,
    read: false,
    ...(userId ? { toUserId: userId } : {}),
    ...item,
  });
  Storage.save();
}

// 用户侧通知收口（2026-08-13 P1 #25）：单条删除 / 清空（2026-09-11 定向通知后：清空仅作用于当前用户可见通知，保留其他用户的定向通知）
export function removeNotification(id) {
  const idx = notifications.findIndex(n => n.id === id);
  if (idx >= 0) { notifications.splice(idx, 1); Storage.save(); }
}
export function clearNotifications(userId) {
  if (!userId) {
    notifications.length = 0;
  } else {
    const kept = notifications.filter(n => n.toUserId && n.toUserId !== userId);
    notifications.splice(0, notifications.length, ...kept);
  }
  Storage.save();
}

// 实际派发广播（立即发送 / 定时到期共用）：推收件箱（定向按 userId 逐个推送；全员单次）+ 审计留痕 + 台账状态置已发送
function deliverBroadcast(log) {
  const payload = { type: log.type, title: log.title, body: log.body, fromAdmin: log.operator };
  if (log.targetUserIds && log.targetUserIds.length) {
    log.targetUserIds.forEach(uid => pushNotification(payload, uid));
  } else {
    pushNotification(payload);
  }
  logAudit({ operator: log.operator, category: 'admin', action: 'broadcast', target: log.title, note: `发送通知（${log.type}）${log.target ? `· ${log.target}` : ''}` });
  log.status = 'sent';
}

// 后台运营发广播（通知触达管理，2026-08-14 广播台账化 · 方案 A；同轮定时发送；2026-09-11 定向发送）：
// 立即发送 = 三写（broadcastLogs 台账 + notifications 收件箱 + logAudit 审计）；
// 定时发送（scheduledAt 晚于当前）= 先写台账（status scheduled 已排期），到点由 processDueBroadcasts 派发（收件箱 + 审计 + status sent）。
// target 显示文案（全部投资人 / 定向 N 人）；targetUserIds 数组非空 = 定向（空/缺省 = 全员）。
// 接后端：broadcastLogs 由服务端广播记录替换、notifications 由各用户收件箱替换（台账 vs 收件箱数据模型已分离，零返工）
export function sendBroadcastNotification({ type, title, body, target, targetUserIds, scheduledAt }, operator = '') {
  const createdAt = formatNow();
  const log = {
    id: `b${Date.now()}`,
    orderNo: genOrderNo('BR', createdAt),
    type, title, body,
    target: target || '全部投资人',
    targetUserIds: targetUserIds && targetUserIds.length ? [...new Set(targetUserIds)] : undefined,
    operator: operator || '系统',
    createdAt,
    status: 'sent',
    scheduledAt: null,
  };
  const scheduledTime = scheduledAt ? new Date(scheduledAt.replace(' ', 'T')).getTime() : 0;
  if (scheduledAt && scheduledTime > Date.now()) {
    log.status = 'scheduled';
    log.scheduledAt = scheduledAt;
    broadcastLogs.unshift(log);
    Storage.save();
  } else {
    broadcastLogs.unshift(log);
    deliverBroadcast(log); // deliverBroadcast 内 pushNotification 已 Storage.save
  }
  return { ok: true, orderNo: log.orderNo, status: log.status };
}

// 定时广播调度：把已到期的 scheduled 广播派发（模拟后端定时任务；接后端由服务端调度替换）
export function processDueBroadcasts() {
  const now = Date.now();
  let changed = false;
  broadcastLogs.forEach(l => {
    if (l.status === 'scheduled' && l.scheduledAt && new Date(l.scheduledAt.replace(' ', 'T')).getTime() <= now) {
      deliverBroadcast(l);
      changed = true;
    }
  });
  if (changed) Storage.save();
}

// mock 调度器：每 5 秒检查一次到期定时广播（.unref() 使 node 测试环境不阻塞进程退出；浏览器无影响）
setInterval(processDueBroadcasts, 5000)?.unref?.();

export function getInvestorNo(userId) {
  const n = parseInt(String(userId || 'u0').replace(/\D/g, ''), 10) || 0;
  return `INV-${String(n).padStart(4, '0')}`;
}

// 三语文本 helper（2026-10-19 上移至 faqItems 之前：FAQ 三语化直接引用，避免 const TDZ；
// 原位于 agreements 区，此前 2026-09-20 也因同类引用上移过一次）
const AG = (zhCN, zhHK, en) => ({ 'zh-CN': zhCN, 'zh-HK': zhHK, en });


// 帮助中心 FAQ（2026-10-19 三语化：q/a 为 { 'zh-CN','zh-HK','en' } 结构，Help 页按当前语言直读，不再走 i18n 词条）。
// 现有 6 条的繁/英译文自 i18n 词条表（zhHK.js/en.js）原样搬运，渲染结果与迁移前逐字一致。
// 后台「系统配置」可增删改（addFaqItem/updateFaqItem/removeFaqItem），新增条目三语录入，繁/英留空回退简体。
export const faqItems = [
  {
    q: AG('问卷提交后需要做什么？', '問卷提交後需要做什麼？', 'What should I do after submitting the questionnaire?'),
    a: AG('问卷提交后，客户经理会与您联系，确认进一步需求，期间无需额外操作。', '問卷提交後，客戶經理會與您聯繫，確認進一步需求，期間無需額外操作。', 'After submitting the questionnaire, your account manager will contact you to confirm next steps. No additional action is required from you during this period.'),
  },
  {
    q: AG('问卷提交会冻结资金吗？', '問卷提交會凍結資金嗎？', 'Does submitting the questionnaire freeze any funds?'),
    a: AG('不会。问卷仅为兴趣表达，不冻结任何资金，也不构成任何投资承诺。', '不會。問卷僅為興趣表達，不凍結任何資金，亦不構成任何投資承諾。', 'No. The questionnaire is simply an expression of interest. It does not freeze any funds and does not constitute any investment commitment.'),
  },
  {
    q: AG('「暂无进一步安排」是什么意思？', '「暫無進一步安排」是什麼意思？', 'What does "no further action" mean?'),
    a: AG('本轮已结束，本次提交暂无需进一步安排。如有进一步意向，可重新填写问卷。', '本輪已結束，本次提交暫無需進一步安排。如有進一步意向，可重新填寫問卷。', 'This round has ended and no further action is required for this submission. You may submit a new questionnaire if your interest changes.'),
  },
  {
    q: AG('如何联系我的专属客户经理？', '如何聯繫我的專屬客戶經理？', 'How do I contact my dedicated account manager?'),
    a: AG('在「我的」页面点击客户经理卡片即可查看其联系方式，包括电话、邮箱与 WhatsApp。经理未响应时可转在线客服。', '在「我的」頁面點擊客戶經理卡片即可查看其聯繫方式，包括電話、郵箱與 WhatsApp。經理未響應時可轉在線客服。', 'Click on your dedicated account manager card in the "My" section to view their contact information, including phone, email and WhatsApp. If your manager does not respond, you may escalate to online customer service.'),
  },
  {
    q: AG('如何保证我的信息与资金安全？', '如何保證我的資訊與資金安全？', 'How is my information and funds security guaranteed?'),
    a: AG('平台采用金融级数据加密，账户已开启双重验证（2FA），资金托管于持牌托管机构，交易全程合规留痕。', '平台採用金融級數據加密，賬戶已開啟雙重驗證（2FA），資金託管於持牌託管機構，交易全程合規留痕。', 'The platform uses financial-grade data encryption, your account has two-factor authentication (2FA) enabled, funds are custodied with licensed custodians, and all transactions leave a full compliance audit trail.'),
  },
];

// FAQ 增删改（后台系统配置页可配置——Help 页实时读取共享数组，配置即生效）
// 校验 + 审计 + 持久化；繁/英留空回退简体（Help 渲染 item.q[lang] || item.q['zh-CN']）
export function addFaqItem({ q, a }, operator = '') {
  const qCN = (q?.['zh-CN'] || '').trim();
  const aCN = (a?.['zh-CN'] || '').trim();
  if (!qCN || !aCN) return { ok: false, error: '问题与答案的简体内容必填' };
  faqItems.push({
    q: AG(qCN, (q?.['zh-HK'] || '').trim(), (q?.en || '').trim()),
    a: AG(aCN, (a?.['zh-HK'] || '').trim(), (a?.en || '').trim()),
  });
  logAudit({ operator, category: 'config', action: 'update', target: '帮助FAQ', targetId: '', note: `新增 FAQ：${qCN}` });
  Storage.save();
  return { ok: true };
}

export function updateFaqItem(index, { q, a }, operator = '') {
  if (index < 0 || index >= faqItems.length) return { ok: false, error: 'FAQ 条目不存在' };
  const qCN = (q?.['zh-CN'] || '').trim();
  const aCN = (a?.['zh-CN'] || '').trim();
  if (!qCN || !aCN) return { ok: false, error: '问题与答案的简体内容必填' };
  faqItems[index] = {
    q: AG(qCN, (q?.['zh-HK'] || '').trim(), (q?.en || '').trim()),
    a: AG(aCN, (a?.['zh-HK'] || '').trim(), (a?.en || '').trim()),
  };
  logAudit({ operator, category: 'config', action: 'update', target: '帮助FAQ', targetId: '', note: `修改 FAQ：${qCN}` });
  Storage.save();
  return { ok: true };
}

export function removeFaqItem(index, operator = '') {
  if (index < 0 || index >= faqItems.length) return { ok: false, error: 'FAQ 条目不存在' };
  const removed = faqItems[index];
  faqItems.splice(index, 1);
  logAudit({ operator, category: 'config', action: 'update', target: '帮助FAQ', targetId: '', note: `删除 FAQ：${removed.q['zh-CN']}` });
  Storage.save();
  return { ok: true };
}

export const companyPolicies = [
  {
    id: 'cp1',
    title: '公司简介',
    file: 'highblock-profile.pdf',
    date: '2026-06-30',
    size: '1.2 MB',
  },
  {
    id: 'cp2',
    title: '牌照及监管信息',
    file: 'license-info.pdf',
    date: '2026-06-30',
    size: '0.8 MB',
  },
  {
    id: 'cp3',
    title: '隐私政策',
    file: 'privacy-policy.pdf',
    date: '2026-06-30',
    size: '1.5 MB',
  },
  {
    id: 'cp4',
    title: '使用条款',
    file: 'user-agreement.pdf',
    date: '2026-06-30',
    size: '2.1 MB',
  },
  {
    id: 'cp5',
    title: '风险披露声明及免责声明',
    file: 'risk-disclosure.pdf',
    date: '2026-06-30',
    size: '1.0 MB',
  },
];

// ========== 协议中心（2026-09-15 · 对齐公司协议签署实践案例） ==========
// 第一性原理：凡用户做出法律承诺/授权的节点，必须满足 ① 明示同意（默认不勾）② 同意对象可查（文档可达、版本可追溯）③ 同意行为留痕（版本+时间固化）。
// 协议全文（多语言）放本数据源，不进 i18n 对象——防止 I18N 大文件膨胀引发渲染 key 静默丢失（2026-08-31 教训八）。
// 结构：{ id, version, effectiveAt, titleKey(三语标题), sections: [{ h, p }] }；titleKey.i18n = i18n 对象中的标题 key（UI 标签），正文全在 sections。

// AG 已上移至 faqItems 之前（2026-10-19，FAQ 三语化引用；避免 const TDZ 与重复声明）

// ---- 法定声明文本（来源：公司协议签署实践案例 · YUiNQxqL/QDZq2ovV/TKCPH5Vk；主体名替换为本平台） ----
// 2026-09-20 上移至 agreements 之前：pi-declaration 协议条目直接引用，避免 const TDZ
// KYC「04 协议签署」步骤声明（零售版全文；PI 为独立审核流，其附加段见 PI_CONFIRM_EXTRA_TEXT）
export const KYC_DECLARATION_TEXT = AG(
  '本人特此无条件且不可撤销地声明，本人已阅读并同意遵守{{BRAND}}提供的隐私信息收集声明（PICS）、条款与条件、风险披露声明及其他所要求的相关文件。本人在此表格中提供的所有资料均真实、准确且完整。如{{BRAND}}提出要求，本人将提供{{BRAND}}可能需要验证上述资料的进一步补充信息或文件。如未能提供所需信息或文件，本人明白{{BRAND}}可能无法提供相关服务。本人同意并授权{{BRAND}}不时向本人索取进一步资料或文件，并承诺在资料发生变更时及时通知{{BRAND}}（或其继承人或受让人）。本人认可并同意，{{BRAND}}可进行反洗钱审查或为了解客户所需，将本人资料用于{{BRAND}}提供的产品和/或服务。',
  '本人特此無條件且不可撤銷地聲明，本人已閱讀並同意遵守{{BRAND}}提供的隱私信息收集聲明（PICS）、條款與條件、風險披露聲明及其他所要求的相關文件。本人在此表格中提供的所有資料均真實、準確且完整。如{{BRAND}}提出要求，本人將提供{{BRAND}}可能需要驗證上述資料的進一步補充信息或文件。如未能提供所需信息或文件，本人明白{{BRAND}}可能無法提供相關服務。本人同意並授權{{BRAND}}不時向本人索取進一步資料或文件，並承諾在資料發生變更時及時通知{{BRAND}}（或其繼承人或受讓人）。本人認可並同意，{{BRAND}}可進行反洗錢審查或為了解客戶所需，將本人資料用於{{BRAND}}提供的產品和/或服務。',
  'I hereby unconditionally and irrevocably declare that I have read and agree to abide by the Personal Information Collection Statement (PICS), Terms and Conditions, Risk Disclosure Statement and other required documents provided by {{BRAND}}. All information provided by me in this form is true, accurate, and complete. Upon request by {{BRAND}}, I will provide any additional information or documents that may be required to verify the aforementioned details. I understand that failure to provide the requested information or documents may result in {{BRAND}} being unable to offer the relevant services. I agree and authorize {{BRAND}} to request further information or documents from me from time to time and commit to promptly notifying {{BRAND}} (or its successors or assigns) of any changes to the provided information. I acknowledge and agree that {{BRAND}} may use my information for anti-money laundering checks or Know Your Customer (KYC) purposes as required for the provision of its products and/or services.'
);

// PI 认证附加确认段（在 KYC 声明基础上追加，对齐实践案例"个人专业投资者"版本）
export const PI_CONFIRM_EXTRA_TEXT = AG(
  '本人进一步确认：本人已知悉并理解成为专业投资者的身份及其适用的法律后果，并已同意接受专业投资者身份的权利、义务及风险。',
  '本人進一步確認：本人已知悉並理解成為專業投資者的身份及其適用的法律後果，並已同意接受專業投資者身份的權利、義務及風險。',
  'I further confirm that I am aware of and understand the identity of a professional investor and the legal consequences that apply, and I have agreed to accept the rights, obligations, and risks associated with the status of a professional investor.'
);

export const agreements = [
  // 2026-10-22：公司正式法务文本替换原型占位稿（正文见 mock/legalTexts.js，一段一条）
  {
    id: 'user-agreement',
    version: 'v1.2',
    effectiveAt: '2026-09-01',
    title: AG('使用条款', '使用條款', 'Terms and Conditions'),
    sections: termsOfUseSections,
  },
  {
    id: 'privacy-policy',
    version: 'v1.2',
    effectiveAt: '2026-09-01',
    title: AG('隐私政策', '隱私政策', 'Privacy Policy'),
    sections: privacyPolicySections,
  },
  {
    id: 'risk-disclosure',
    version: 'v1.1',
    effectiveAt: '2026-06-30',
    title: AG('风险披露声明及免责声明', '風險披露聲明及免責聲明', 'Risk Disclosure Statements and Disclaimers'),
    sections: riskDisclosureSections,
  },
  {
    id: 'pi-terms',
    version: 'v1.0',
    effectiveAt: '2026-09-01',
    title: AG('专业投资者业务条款及风险披露声明书', '專業投資者業務條款及風險披露聲明書', 'Professional Investor Terms and Risk Disclosure'),
    sections: [
      { h: AG('一、身份认定', '一、身份認定', '1. Determination of Status'), p: AG(
        '专业投资者指《证券及期货条例》附表 1 第 1 条所定义的专业投资者，含机构专业投资者及个人专业投资者（如持有不少于 HK$8,000,000 投资组合的个人）。',
        '專業投資者指《證券及期貨條例》附表 1 第 1 條所定義的專業投資者，含機構專業投資者及個人專業投資者（如持有不少於 HK$8,000,000 投資組合的個人）。',
        'Professional Investors are as defined in section 1 of Schedule 1 to the SFO, including institutional and individual PIs (e.g. individuals with a portfolio of not less than HK$8,000,000).'
      ) },
      { h: AG('二、监管保护差异', '二、監管保護差異', '2. Reduced Protections'), p: AG(
        '被认定为专业投资者后，部分适用于零售投资者的监管保障将不再适用（含部分产品审慎性审查、披露要求及冷静期安排）。您确认理解并接受该等差异。',
        '被認定為專業投資者後，部分適用於零售投資者的監管保障將不再適用（含部分產品審慎性審查、披露要求及冷靜期安排）。您確認理解並接受該等差異。',
        'Once treated as a Professional Investor, certain regulatory protections applicable to retail investors will not apply (including certain suitability assessments, disclosure requirements and cooling-off arrangements). You confirm you understand and accept such differences.'
      ) },
      { h: AG('三、复核与告知义务', '三、覆核與告知義務', '3. Review and Notification'), p: AG(
        '您的专业投资者资格将被定期复核。若您的资产状况不再符合资格标准，或身份信息发生变化，您应在 30 日内通知本平台。',
        '您的專業投資者資格將被定期覆核。若您的資產狀況不再符合資格標準，或身份信息發生變化，您應在 30 日內通知本平台。',
        'Your PI status will be periodically reviewed. You must notify the Platform within 30 days if you cease to meet the qualification criteria or if your information changes.'
      ) },
    ],
  },
  {
    id: 'bank-card-service',
    version: 'v1.0',
    effectiveAt: '2026-09-01',
    title: AG('银行卡及出入金服务协议', '銀行卡及出入金服務協議', 'Bank Card and Transfer Service Agreement'),
    sections: [
      { h: AG('一、白名单机制', '一、白名單機制', '1. Whitelist Mechanism'), p: AG(
        '出入金仅限您名下已通过白名单验证的银行卡。新卡须由本人账户向平台收款账户完成指定金额验证转账，经财务核对到账后方可加入白名单。',
        '出入金僅限您名下已通過白名單驗證的銀行卡。新卡須由本人賬戶向平台收款賬戶完成指定金額驗證轉賬，經財務核對到賬後方可加入白名單。',
        'Transfers are allowed only via your own whitelisted bank cards. A new card must pass a verification transfer from your own account, confirmed by the Platform, before being whitelisted.'
      ) },
      { h: AG('二、账户同名要求', '二、賬戶同名要求', '2. Same-Name Requirement'), p: AG(
        '出入金银行卡持卡人必须与您在本平台实名身份一致。第三方代付/代收将被拒绝入账并触发合规审查。',
        '出入金銀行卡持卡人必須與您在本平台實名身份一致。第三方代付/代收將被拒絕入賬並觸發合規審查。',
        'Cards must be held in your own verified name. Third-party payments will be rejected and may trigger compliance review.'
      ) },
      { h: AG('三、信息保管', '三、信息保管', '3. Data Handling'), p: AG(
        '您提供的银行卡信息仅用于出入金处理与合规核验，平台将依法加密存储并按隐私政策限制使用。',
        '您提供的銀行卡信息僅用於出入金處理與合規核驗，平台將依法加密存儲並按隱私政策限制使用。',
        'Card information is used solely for transfer processing and compliance checks, stored encrypted and used in accordance with the Privacy Policy.'
      ) },
    ],
  },
  {
    // 2026-09-20：PI 声明全文抽屉化——与 pi-terms / privacy-policy 同走 AgreementModal，三链接交互一致
    id: 'pi-declaration',
    version: 'v1.0',
    effectiveAt: '2026-09-01',
    title: AG('专业投资者声明', '專業投資者聲明', 'Professional Investor Declaration'),
    sections: [
      { h: AG('一、声明全文', '一、聲明全文', '1. Declaration'), p: KYC_DECLARATION_TEXT },
      { h: AG('二、专业投资者附加确认', '二、專業投資者附加確認', '2. PI Additional Confirmation'), p: PI_CONFIRM_EXTRA_TEXT },
    ],
  },
  // 2026-10-22 RO 整改：路演报名框「专业投资者定义」解释链接的正文——
  // 采用与 pi-terms §1 同一法律表述，走 AgreementModal（与关于页政策文件、PI 声明同一交互），不新造口径
  {
    id: 'pi-definition',
    version: 'v1.0',
    effectiveAt: '2026-09-01',
    title: AG('专业投资者定义', '專業投資者定義', 'Professional Investor Definition'),
    sections: [
      { h: AG('一、定义', '一、定義', '1. Definition'), p: AG(
        '专业投资者指《证券及期货条例》附表 1 第 1 条所定义的专业投资者，含机构专业投资者及个人专业投资者（如持有不少于 HK$8,000,000 投资组合的个人）。',
        '專業投資者指《證券及期貨條例》附表 1 第 1 條所定義的專業投資者，含機構專業投資者及個人專業投資者（如持有不少於 HK$8,000,000 投資組合的個人）。',
        'Professional investors are as defined in section 1 of Schedule 1 to the SFO, including institutional and individual professional investors (e.g. individuals with a portfolio of not less than HK$8,000,000).'
      ) },
      { h: AG('二、资格核验', '二、資格核驗', '2. Verification'), p: AG(
        '资格核验以香港证监会持牌人及注册机构登记册的公开记录为准，核验结果作为能否参与平台服务与活动的依据。',
        '資格核驗以香港證監會持牌人及註冊機構登記冊的公開記錄為準，核驗結果作為能否參與平台服務與活動的依據。',
        'Eligibility is verified against the public registers of the SFC, and the outcome determines whether you may use the platform services and attend its events.'
      ) },
    ],
  },
  // 2026-10-22：cp1/cp2 由占位模板替换为正式内容（依据 SFC 牌照证书 2026-08-31）。
  //   官网 highblockhk.com 当前只有邮件 MX、无 A 记录（www 为 NXDOMAIN），先不展示官网链接；
  //   注册编号 / 注册地址 / 董事名单仍未提供，暂不写入。
  {
    id: 'company-profile',
    version: 'v1.0',
    effectiveAt: '2026-09-01',
    title: AG('公司简介', '公司簡介', 'Company Profile'),
    sections: [
      { h: AG('一、公司概况', '一、公司概況', '1. Overview'), p: AG(
        'HighBlock Securities Limited（「本公司」）为根据香港《公司条例》注册成立的有限公司，持有香港证券及期货事务监察委员会第 1、4、9 类牌照（中央编号 BWW124）。本平台现阶段面向专业投资者提供私募市场资讯、项目研究及路演活动等服务。平台所载资料仅供一般参考，不构成投资建议、要约或招揽。任何投资机会及相关安排（如有）均以适用的正式文件为准。',
        'HighBlock Securities Limited（「本公司」）為根據香港《公司條例》註冊成立的有限公司，持有香港證券及期貨事務監察委員會第 1、4、9 類牌照（中央編號 BWW124）。本平台現階段面向專業投資者提供私募市場資訊、項目研究及路演活動等服務。平台所載資料僅供一般參考，不構成投資建議、要約或招攬。任何投資機會及相關安排（如有）均以適用的正式文件為準。',
        'HighBlock Securities Limited (the "Company") is a limited company incorporated in Hong Kong under the Companies Ordinance. It holds SFC Type 1, 4 and 9 licences (Central Entity No. BWW124). At this stage, the platform provides private market information, deal research and roadshow events to professional investors. Information contained on the platform is for general reference only and does not constitute investment advice, an offer or solicitation. Any investment opportunities and related arrangements (if any) are subject to the applicable formal documents.'
      ) },
      { h: AG('二、监管资料', '二、監管資料', '2. Regulatory Status'), p: AG(
        '本公司获发牌照日期为 2026 年 8 月 31 日（首次发牌日期为 2026 年 8 月 5 日）。按牌照条件，第 4 类（就证券提供意见）及第 9 类（提供资产管理）受规管活动仅可向专业投资者提供服务。有关牌照资料、状态及条件，请以香港证券及期货事务监察委员会持牌人及注册机构公众纪录册为准。',
        '本公司獲發牌照日期為 2026 年 8 月 31 日（首次發牌日期為 2026 年 8 月 5 日）。按牌照條件，第 4 類（就證券提供意見）及第 9 類（提供資產管理）受規管活動僅可向專業投資者提供服務。有關牌照資料、狀態及條件，請以香港證券及期貨事務監察委員會持牌人及註冊機構公眾紀錄冊為準。',
        'The licence was issued on 31 August 2026 (first granted on 5 August 2026). Under the licence conditions, Type 4 (advising on securities) and Type 9 (asset management) services may only be provided to professional investors. For licence details, status and conditions, please refer to the public Register of Licensed Persons and Registered Institutions of the Securities and Futures Commission of Hong Kong.'
      ) },
      { h: AG('', '', ''), p: AG(
        '本网站资料仅供一般参考，不构成投资建议、要约、招揽或任何投资承诺。',
        '本網站資料僅供一般參考，不構成投資建議、要約、招攬或任何投資承諾。',
        'The information on this website is for general reference only and does not constitute investment advice, an offer, solicitation or any investment commitment.'
      ) },
    ],
  },
  {
    id: 'license-info',
    version: 'v1.0',
    effectiveAt: '2026-09-01',
    title: AG('牌照及监管信息', '牌照及監管信息', 'Licence & Regulatory Information'),
    sections: [
      { h: AG('一、监管牌照', '一、監管牌照', '1. Licence'), p: AG(
        'HighBlock Securities Limited 为香港证券及期货事务监察委员会持牌法团，中央编号（CE No.）与平台展示的牌照编号（SFC NO）同为 BWW124。发牌日期为 2026 年 8 月 31 日，首次发牌日期为 2026 年 8 月 5 日。持牌信息可于香港证监会持牌人及注册机构登记册（apps.sfc.hk）公开核实。',
        'HighBlock Securities Limited 為香港證券及期貨事務監察委員會持牌法團，中央編號（CE No.）與平台展示的牌照編號（SFC NO）同為 BWW124。發牌日期為 2026 年 8 月 31 日，首次發牌日期為 2026 年 8 月 5 日。持牌信息可於香港證監會持牌人及註冊機構登記冊（apps.sfc.hk）公開核實。',
        'HighBlock Securities Limited is a licensed corporation with the Securities and Futures Commission of Hong Kong. The Central Entity Number (CE No.) and the licence number shown on the platform (SFC NO) are both BWW124. The licence was issued on 31 August 2026 and first granted on 5 August 2026. Licence status is publicly verifiable via the SFC Register of Licensed Persons and Registered Institutions (apps.sfc.hk).'
      ) },
      { h: AG('二、受监管活动', '二、受監管活動', '2. Regulated Activities'), p: AG(
        '第 1 类：证券交易；第 4 类：就证券提供意见；第 9 类：提供资产管理。按牌照条件，第 4 类及第 9 类受规管活动仅可向专业投资者提供服务；「专业投资者」的定义见《证券及期货条例》及其附属法例。',
        '第 1 類：證券交易；第 4 類：就證券提供意見；第 9 類：提供資產管理。按牌照條件，第 4 類及第 9 類受規管活動僅可向專業投資者提供服務；「專業投資者」的定義見《證券及期貨條例》及其附屬法例。',
        'Type 1: dealing in securities; Type 4: advising on securities; Type 9: asset management. Under the licence conditions, Type 4 and Type 9 services may only be provided to professional investors, as defined in the Securities and Futures Ordinance and its subsidiary legislation.'
      ) },
    ],
  },
];

export function getAgreementById(id, translate = (s) => s) {
  // 返回时做品牌插值（浅拷贝 sections）：协议 mock 源以 {{BRAND*}}/{{LICENSE_TYPE}} 占位，
  // 展示为 Admin 配置的真实主体名。version/effectiveAt 元数据原样保留（固化语义）。
  const found = agreements.find(a => a.id === id);
  if (!found) return null;
  return {
    ...found,
    // 递归插值：h/p 可能是字符串、三语字典，或段落数组（正式法务文本一段一条）
    sections: (found.sections || []).map(s => ({
      ...s,
      h: resolveNode(s.h, translate),
      p: resolveNode(s.p, translate),
    })),
  };
}

// 递归品牌插值：字符串 / 三语字典 / 段落数组
function resolveNode(node, translate) {
  if (typeof node === 'string') return resolveBrand(node, translate);
  if (Array.isArray(node)) return node.map(x => resolveNode(x, translate));
  if (node && typeof node === 'object') {
    const out = {};
    Object.keys(node).forEach(k => { out[k] = resolveNode(node[k], translate); });
    return out;
  }
  return node;
}

// （2026-09-20：KYC_DECLARATION_TEXT / PI_CONFIRM_EXTRA_TEXT 上移至 agreements 数组之前——
//   pi-declaration 协议条目需引用两常量，原定义在数组之后会触发 const TDZ ReferenceError）

// 电子签名法律提示（对齐实践案例 §3.7）
export const E_SIGNATURE_NOTICE_TEXT = AG(
  '通过在上方提供本人的电子签名，本人确认并同意此电子签名构成本人手写签名的合法且有约束力的表示。该等电子签署的文件将具有有效性和法律效力，与用笔和纸签署的实体合同具有同等有效性。在电子签署前，本人已经仔细审阅了{{BRAND}}的有关条款和条件，并且完全理解并同意受其所载之权利和义务的约束。',
  '通過在上方提供本人的電子簽名，本人確認並同意此電子簽名構成本人手寫簽名的合法且有約束力的表示。該等電子簽署的文件將具有有效性和法律效力，與用筆和紙簽署的實體合同具有同等有效性。在電子簽署前，本人已經仔細審閱了{{BRAND}}的有關條款和條件，並且完全理解並同意受其所載之權利和義務的約束。',
  'By providing my electronic signature above, I confirm and agree that such electronic signature constitutes a legal and binding representation of my handwritten signature. Electronically signed documents shall be valid and enforceable to the same effect as a contract executed by pen and paper. Before electronically signing, I have carefully reviewed the relevant terms and conditions of {{BRAND}} and fully understand and agree to be bound by the rights and obligations contained therein.'
);

// ---- 协议签署留痕（2026-09-15 · 全局统一台账） ----
// type: register(注册) / pi(PI 声明) / bank-card(银行卡协议) / terms-update(条款更新重同意)
// （2026-09-15 裁决：KYC 内声明/电子签署移除，KYC 不再产生签署留痕）
export const agreementRecords = [
  // 预置：approved 账号已完成注册留痕
  { id: 'ar1', userId: 'u1', type: 'register', agreementIds: ['user-agreement', 'privacy-policy', 'risk-disclosure'], versions: ['v1.2', 'v1.2', 'v1.1'], signedAt: '2026-05-09 11:20:00', signatureImage: null },
];

export function recordAgreement({ type, agreementIds = [], signatureImage = null, userId = null }, operator = '系统') {
  const versions = agreementIds.map(id => getAgreementById(id)?.version || '—');
  const rec = {
    id: `ar${Date.now()}`,
    userId: userId || currentUser.id,
    type,
    agreementIds,
    versions,
    signedAt: formatNow(),
    signatureImage,
  };
  agreementRecords.unshift(rec);
  logAudit({
    operator: operator || '用户',
    category: type === 'pi' ? 'pi' : 'kyc',
    action: 'sign',
    target: `${(currentUser.name || '用户')}`,
    targetId: rec.id,
    note: `协议签署留痕（${type}）：${agreementIds.join(', ')} · 版本 ${versions.join('/')}${signatureImage ? ' · 含电子签名' : ''}`,
  });
  Storage.save();
  return rec;
}

// 开户协议签署判定（2026-10-15 · UC 对齐）：基金业务协议（三件套）后置到 KYC 通过后首次进 APP
// 的开户闸门签署——注册=集团 UC 身份层开户，不再承载业务协议。判定按 userId 查 agreementRecords，
// 快照持久化（Storage.save），签一次终身有效；条款更新重同意走 termsState/TermsUpdateGate 既有机制。
export function hasAgreedOnboarding(userId = null) {
  const uid = userId || currentUser.id;
  return agreementRecords.some(r => r.userId === uid && r.type === 'onboarding');
}

// 条款版本与重新同意（对齐实践案例"条款更新 → 弹窗通知 → 重新勾选"） ----
export const termsState = {
  currentVersion: 'v1.3',      // 当前生效条款版本
  agreedVersion: 'v1.3',       // 当前用户已同意的版本（< currentVersion 时登录后弹重同意弹窗；默认一致不弹，后台「发布新版」后触发——2026-09-15 拍板）
  updatedAt: '2026-09-15 09:00:00',
};

export function bumpTermsVersion(operator = '系统管理员') {
  const n = Number(termsState.currentVersion.replace('v', '')) + 0.1;
  termsState.currentVersion = `v${n.toFixed(1)}`;
  termsState.updatedAt = formatNow();
  logAudit({ operator, category: 'config', action: 'update', target: '条款版本', targetId: '', note: `发布新版条款 ${termsState.currentVersion}（用户端将重新征求同意）` });
  Storage.save();
  return termsState.currentVersion;
}

export function agreeTermsUpdate(operator = '用户') {
  termsState.agreedVersion = termsState.currentVersion;
  recordAgreement({ type: 'terms-update', agreementIds: ['user-agreement', 'privacy-policy', 'risk-disclosure'] }, operator);
}

function formatNow() {
  return formatDeadlineFrom(Date.now());
}

// 业务单号生成（2026-08-14）：类型前缀 + 日期时间数字，如 DR20260812091522
// 前缀约定：DR 充值 / WR 提现 / SUB 申购 / EXT 退出 / DIV 投后分红 / TX 资金流水 / BR 广播通知
// datetime 缺省用当前时间；预置数据按 createdAt 派生保证单号稳定
export function genOrderNo(prefix, datetime) {
  const d = (datetime || formatNow()).replace(/[-: ]/g, '');
  return `${prefix}${d}`;
}

// 毫秒时间戳 → 本地 'YYYY-MM-DD HH:mm:ss'（时间格式工具）
function formatDeadlineFrom(ms) {
  const d = new Date(ms);
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function toHkd(currency, amount) {
  if (currency === 'HKD') return amount;
  const rate = exchangeRates[`${currency.toLowerCase()}-hkd`];
  return rate ? amount * rate.rate : amount;
}

function updateLatestTotal(deltaHkd) {
  const last = assetHistory[assetHistory.length - 1];
  last.total = Math.round(last.total + deltaHkd);
}

export function depositFunds({ currency, amount, method }) {
  const key = walletKeyOf(currency) || currency.toLowerCase();
  const w = wallet[key];
  if (!w || !amount || amount <= 0) return false;
  w.balance += amount;
  if (currentUser.account[key] !== undefined) currentUser.account[key] = w.balance;
  updateLatestTotal(toHkd(currency, amount));
  transactions.unshift({
    id: `t${Date.now()}`,
    orderNo: genOrderNo('TX'),
    type: 'deposit',
    amount,
    currency,
    status: 'completed',
    createdAt: formatNow(),
    method: method || '银行转账',
    reference: `REF${Date.now()}`,
  });
  pushNotification({
    type: 'wallet',
    title: '入金到账',
    body: `您的${w.label}入金 ${w.symbol}${amount.toLocaleString()} 已到账，可用资金已更新。`,
  });
  Storage.save();
  return true;
}

export function withdrawFunds({ currency, amount, method }) {
  if (getFreezeState().frozen) return false; // INV-5 凡动必冻：安全冻结期内阻断出金（数据层兜底）
  const key = walletKeyOf(currency) || currency.toLowerCase();
  const w = wallet[key];
  if (!w || !amount || amount <= 0) return false;
  if (amount > w.balance) return false;
  w.balance -= amount;
  if (currentUser.account[key] !== undefined) currentUser.account[key] = w.balance;
  updateLatestTotal(-toHkd(currency, amount));
  transactions.unshift({
    id: `t${Date.now()}`,
    orderNo: genOrderNo('TX'),
    type: 'withdraw',
    amount,
    currency,
    status: 'completed',
    createdAt: formatNow(),
    method: method || '银行转账',
    reference: `REF${Date.now()}`,
  });
  pushNotification({
    type: 'wallet',
    title: '提现成功',
    body: `您的${w.label}提现 ${w.symbol}${amount.toLocaleString()} 已发起，资金将在 1-2 个工作日到账。`,
  });
  Storage.save();
  return true;
}

// ========== 平台品牌信息（后台系统配置页可维护；About 页/登录页消费，2026-08-14 配置页清单化时纳入） ==========
export const platformBrand = {
  nameZh: 'HighBlock',              // 简称（登录页品牌区）
  nameFullZh: 'HighBlock Securities Limited', // 全称（About 品牌卡 / 版权；上架·持牌主体）
  nameEn: 'HighBlock Securities Limited',
  licenseNo: 'BWW124',              // 牌照编号（SFC NO；2026-10-22 RO 整改：不用 CE No. 措辞）
  licenseType: '香港证监会第 1、4、9 类牌照',    // 牌照类型（About 合规卡 / 公司政策列表）
  licenseDesc: '证券交易 · 就证券提供意见 · 资产管理', // 受规管活动明细（2026-10-22 定版：以正式《风险披露声明》所载 1/4/9 类为准）
  appVersion: '2.0.0',             // 应用版本号（About 版本行；与应用市场注册版本保持一致）
};

// 法定文本品牌插值（2026-10-19）：协议/基金名 mock 源以 {{BRAND_FULL}}/{{BRAND}} 占位，
// 渲染时替换为 Admin 配置的真实主体名——改真实主体只需后台改品牌信息，不动法务文案源。
// 语义注记：替换发生在渲染时，协议文本随品牌配置变化；「版本固化」指 version/effectiveAt
// 元数据，正文主体名以当前配置为准（原型阶段无签署时文本快照，真实接入时由后端固化）。
export function resolveBrand(text, translate = (s) => s) {
  if (!text || text.indexOf('{{') === -1) return text;
  // 2026-10-22：translate 供三语渲染传入 t()——牌照类型/业务描述本身是词条源文，
  // 内联在法务文本里也要随界面语言切换（否则英文协议里夹中文牌照类型）
  return String(text)
    .split('{{BRAND_FULL}}').join(platformBrand.nameFullZh)
    .split('{{BRAND}}').join(platformBrand.nameZh)
    .split('{{LICENSE_TYPE}}').join(translate(platformBrand.licenseType))
    .split('{{LICENSE_DESC}}').join(translate(platformBrand.licenseDesc))
    .split('{{LICENSE_NO}}').join(platformBrand.licenseNo);
}

export function updatePlatformBrand(fields, operator) {
  const clean = {
    nameZh: String(fields.nameZh || '').trim(),
    nameFullZh: String(fields.nameFullZh || '').trim(),
    nameEn: String(fields.nameEn || '').trim(),
    licenseNo: String(fields.licenseNo || '').trim(),
    licenseType: String(fields.licenseType || '').trim(),
    licenseDesc: String(fields.licenseDesc || '').trim(),
    appVersion: String(fields.appVersion || '').trim(),
  };
  if (!clean.nameZh || !clean.nameFullZh || !clean.nameEn || !clean.licenseNo) return { ok: false, error: '请完整填写品牌信息（简称/全称/英文名/牌照编号）' };
  if (!clean.licenseType || !clean.appVersion) return { ok: false, error: '请完整填写牌照类型与应用版本号' };
  Object.assign(platformBrand, clean);
  logAudit({ operator, category: 'config', action: 'update', target: '平台品牌信息', targetId: '', note: `更新平台品牌（${clean.nameZh} / SFC NO ${clean.licenseNo} / ${clean.licenseType} / v${clean.appVersion}）` });
  Storage.save();
  return { ok: true };
}

// ========== 商务合作联系方式（对外公开，游客可见） ==========
export const businessContact = {
  intro: '如有意向将项目提交至本平台路演、寻求机构合作或其他业务合作，请通过以下方式联系我们。',
  email: 'partners@highblockhk.com',
  phone: '+852 3568 8888',
  whatsapp: '+852 3568 8888',
};

// ========== 平台资金账户（后台系统配置页可维护；充值入金/提现出金的账户载体，接后端为必要配置） ==========
// 2026-08-19 老板确认：未来业务银行统一使用星展银行（DBS）
export const platformAccounts = {
  deposit: { bank: '星展银行（香港）', accountName: 'HKBTC Limited', accountNo: '016-456-000-1234', currency: 'HKD' },
  withdraw: { bank: '星展银行（香港）', accountName: 'HKBTC Limited', accountNo: '016-456-000-1234', currency: 'HKD' },
};

// EDDA 授权状态（2026-08-19 老板确认：香港本土 eDDA 快捷入金通道）
// status: 'authorized' | 'unauthorized' —— 授权后充值可走 eDDA 通道（简化演示：一键模拟授权）
export const eddaAuth = {
  status: 'unauthorized',
  bank: '中国银行（香港）',
  accountMasked: '**** 8901',
  authorizedAt: null,
};

export function authorizeEdda() {
  eddaAuth.status = 'authorized';
  eddaAuth.authorizedAt = formatNow();
  pushNotification({
    type: 'wallet',
    title: 'eDDA 授权成功',
    body: `已授权从 ${eddaAuth.bank}（${eddaAuth.accountMasked}）快捷扣款入金。`,
  });
  logAudit({ operator: currentUser.name || '投资人', category: 'fund', action: 'apply', target: 'eDDA 授权', targetId: '', note: 'eDDA 快捷入金授权（模拟完成）' });
  Storage.save();
  return true;
}

export function updatePlatformAccounts(kind, account, operator) {
  if (!platformAccounts[kind]) return { ok: false, error: '未知账户类型' };
  const clean = { bank: String(account.bank || '').trim(), accountName: String(account.accountName || '').trim(), accountNo: String(account.accountNo || '').trim(), currency: account.currency || 'HKD' };
  if (!clean.bank || !clean.accountName || !clean.accountNo) return { ok: false, error: '请完整填写银行 / 户名 / 账号' };
  platformAccounts[kind] = clean;
  logAudit({ operator, category: 'config', action: 'update', target: '平台资金账户', targetId: kind, note: `更新${kind === 'deposit' ? '收款' : '打款'}账户：${clean.bank} ${clean.accountNo}（${clean.currency}）` });
  Storage.save();
  return { ok: true };
}


// ========== 项目行业分类（2026-08-07 从 Search.jsx 迁入） ==========
export const sectors = ['量子计算', '生物医药', '机器人', '新能源', '金融科技', '医疗健康'];

// ========== 后台管理系统（2026-08-12 · P0 核心闭环） ==========

// 后台登录账号与角色（简版；页面/菜单命名"后台账号"——本集合含全部角色，非仅"管理员"super）
// role: super 超级管理员 / ops 运营 / compliance 合规 / service 客服 / finance 财务 / advisor 专属顾问
export let adminUsers = [
  { id: 'ad1', username: 'admin', password: 'admin123', name: '系统管理员', role: 'super', roleLabel: '超级管理员', email: 'admin@highblockhk.com' },
  { id: 'ad2', username: 'ops', password: 'ops123', name: '王运营', role: 'ops', roleLabel: '运营专员', email: 'ops@highblockhk.com' },
  { id: 'ad3', username: 'compliance', password: 'compliance123', name: '李合规', role: 'compliance', roleLabel: '合规专员', email: 'compliance@highblockhk.com' },
  { id: 'ad4', username: 'service', password: 'service123', name: '张客服', role: 'service', roleLabel: '客服专员', email: 'service@highblockhk.com' },
  // 财务专员（2026-08-24 上线沟通简报待拍板项落地·方案 A）：只关注资金进出（充值/提现/换汇审核 + 流水对账）
  { id: 'ad8', username: 'fin1', password: 'fin123456', name: '王财务', role: 'finance', roleLabel: '财务专员', email: 'finance@highblockhk.com' },
  // 专属顾问账号（线索池核心使用者：客户分散给各顾问跟进，各自只看自己的客户；managerId 关联 accountManagers）
  { id: 'ad5', username: 'advisor1', password: 'advisor123', name: '王慧敏', role: 'advisor', roleLabel: '专属顾问', managerId: 'am1', email: 'wanghuimin@highblockhk.com' },
  { id: 'ad6', username: 'advisor2', password: 'advisor123', name: '陈志豪', role: 'advisor', roleLabel: '专属顾问', managerId: 'am2', email: 'chenzhihao@highblockhk.com' },
  { id: 'ad7', username: 'advisor3', password: 'advisor123', name: '李雅婷', role: 'advisor', roleLabel: '专属顾问', managerId: 'am3', email: 'liyating@highblockhk.com' },
];

// ===== 角色权限管理（2026-08-24 · 预置角色可配置）=====
// 角色集合固定 6 个预置岗位（不开放自定义角色）：行内逻辑绑定具体角色（advisor 需 managerId、
// compliance 有 PI 到期预警等），自定义角色会产出"能配置但配不出正确行为"的假功能。
// 可配置的是"角色→菜单"映射：代码默认值（roleMenuKeys）+ localStorage 覆盖层，
// 与密码 override 同构模式；读取一律走 getRoleMenuKeys()，勿直连 roleMenuKeys。

// 角色单一真源（AdminAdmins 表单下拉/筛选、AdminRoles 角色列表共用；roleLabel 快照由此派生）
export const ADMIN_ROLES = [
  { key: 'super', label: '超级管理员' },
  { key: 'ops', label: '运营专员' },
  { key: 'compliance', label: '合规专员' },
  { key: 'service', label: '客服专员' },
  { key: 'finance', label: '财务专员' },
  { key: 'advisor', label: '专属顾问' },
];

// 后台菜单清单（key/label/hash/group 数据真源；icon 属 UI 层由 AdminSidebar 映射，AdminRoles 分组勾选共用）
// 排序 = 业务联动性配对 + 生命周期（详见 AdminSidebar 头注）
export const ADMIN_MENUS = [
  { key: 'kyc', label: 'KYC 审核', hash: '#admin/kyc', group: '用户' },
  { key: 'pi', label: 'PI 认证', hash: '#admin/pi', group: '用户' },
  { key: 'users', label: '用户管理', hash: '#admin/users', group: '用户' },
  { key: 'my-clients', label: '我的客户', hash: '#admin/my-clients', group: '用户' },
  { key: 'events', label: '路演管理', hash: '#admin/events', group: '路演' },
  { key: 'registrations', label: '报名管理', hash: '#admin/registrations', group: '路演' },
  { key: 'projects', label: '项目管理', hash: '#admin/projects', group: '项目' },
  // 2026-10-16 口径修订：问卷记录（线上收集投资意愿，后台跟进登记）；
  // 资金/交易监控/投后 10 模块保持摘除（funds/transactions/transaction-monitor/large-tx/
  // anomaly/str/edd/spvs/dividends/exits）——2026-10-22 RO 整改：SPV 概念整体移除。
  { key: 'subscriptions', label: '问卷记录', hash: '#admin/subscriptions', group: '项目' },
  // 2026-10-28 基金一期闭环：基金交易（申购/赎回人工确认）+ 资金审核（充值/提现/换汇核销）恢复。
  // 前者是交易域（钱换份额），后者是资金域（银行 ↔ 平台），两者不合并。
  { key: 'fund-trades', label: '基金交易', hash: '#admin/fund-trades', group: '项目' },
  { key: 'funds', label: '资金审核', hash: '#admin/funds', group: '资金' },
  { key: 'broadcast', label: '通知触达', hash: '#admin/broadcast', group: '运营' },
  { key: 'messages', label: '客户消息', hash: '#admin/messages', group: '运营' }, // 客服工作台（2026-08-24）：响应式 1v1 咨询，与广播（主动触达）相邻成对；service+super
  { key: 'audit', label: '审计日志', hash: '#admin/audit', group: '系统' },
  { key: 'roles', label: '角色权限', hash: '#admin/roles', group: '系统' }, // 仅 super 可见可配（见 DEFAULT_ROLE_MENUS.super 锁定）
  { key: 'admins', label: '后台账号', hash: '#admin/admins', group: '系统' },
  { key: 'config', label: '系统配置', hash: '#admin/config', group: '系统' },
];

// 角色 → 可见后台菜单 key 默认值（AdminSidebar/AdminRoles 经 getRoleMenuKeys 读，App.jsx 路由守卫同源）
// users：账户视图（所有人靠这份数据工作——运营管账户、合规看认证、客服看客户）
// audit：审计日志（合规审计角色；super 系统负责）
export const roleMenuKeys = {
  // 超级管理员 = 最高权限：全部菜单（2026-08-15 用户确认"所有页面所有功能都有"——my-clients 原 advisor 专属，补上）；锁定不可编辑
  // 2026-10-16 口径修订：问卷记录恢复（意向收集链），其余资金/交易/投后 10 key 保持摘除
  super: ['kyc', 'pi', 'users', 'my-clients', 'projects', 'events', 'registrations', 'subscriptions', 'fund-trades', 'funds', 'broadcast', 'messages', 'audit', 'roles', 'admins', 'config'],
  ops: ['projects', 'events', 'registrations', 'subscriptions', 'fund-trades', 'funds', 'broadcast', 'users', 'config'],
  // 合规角色：KYC审核 + PI认证 + 用户管理 + 问卷记录 + 审计日志（交易监控类 7 key 随资金流下线摘除）
  compliance: ['kyc', 'pi', 'users', 'subscriptions', 'audit'],
  // 客服：看问卷 + 客户账户 + 通知触达（主动）+ 客户消息（响应式 1v1 咨询，2026-08-24）；不跟进线索（线索是顾问的职责）
  service: ['subscriptions', 'users', 'broadcast', 'messages'],
  // 财务专员：资金核销（充值到账/提现打款/换汇确认）+ 基金交易确认（2026-10-28 一期闭环恢复）
  finance: ['funds', 'fund-trades'],
  // 专属顾问：「我的客户」单一工作视图（2026-08-15 方案 A——顾问工作单元 = 客户而非模块，
  // 名下客户列表 + 跨模块任务聚合 + 客户详情；替代报名管理，线索跟进并入我的客户「跟进」）
  advisor: ['my-clients'],
};

// 权限覆盖持久化（localStorage 快照优先于默认值；"恢复默认"按钮清覆盖逃生——防代码更新默认值被旧快照屏蔽）
// 2026-10-28：key 升 v2。旧 v1 快照是「菜单裁剪期」保存的，缺少新恢复的 funds/fund-trades 两个 key，
// 沿用会让新菜单在老浏览器里整片消失（getRoleMenuKeys 只做 VALID 过滤，不会补默认值）。
const ROLE_MENUS_KEY = 'zhifu-admin-role-menus-v2';
function getRoleMenuOverrides() {
  try {
    const raw = localStorage.getItem(ROLE_MENUS_KEY);
    const saved = raw ? JSON.parse(raw) : null;
    return saved && typeof saved === 'object' ? saved : {};
  } catch (e) { return {}; }
}

// 读角色生效菜单（唯一入口；未知角色 fallback super 全量——沿用原 roleMenuKeys[role] || super 语义）
// 2026-10-16：返回前过滤 VALID_MENU_KEYS——localStorage 旧快照可能存有已下线模块的 key
//（首期裁剪前勾选过），不过滤会让 App.jsx 路由守卫放行死路由
export function getRoleMenuKeys(role) {
  const overrides = getRoleMenuOverrides();
  return (overrides[role] || roleMenuKeys[role] || roleMenuKeys.super).filter(k => VALID_MENU_KEYS.has(k));
}

const VALID_MENU_KEYS = new Set(ADMIN_MENUS.map(m => m.key));

// 保存角色菜单配置（保护规则防自锁：super 锁定 / 至少 1 菜单 / advisor 的 my-clients 不可取消）
// 全量校验后才写入——不做部分保存（半生效状态比拒绝更难排查）
export function updateRoleMenus(role, keys, operator = '') {
  if (role === 'super') return { ok: false, error: '超级管理员为最高权限，不可修改' };
  const roleDef = ADMIN_ROLES.find(r => r.key === role);
  if (!roleDef) return { ok: false, error: '角色不存在' };
  const unique = [...new Set(Array.isArray(keys) ? keys : [])];
  if (!unique.length) return { ok: false, error: '至少保留一个可见菜单' };
  if (unique.some(k => !VALID_MENU_KEYS.has(k))) return { ok: false, error: '包含未知的菜单项' };
  if (role === 'advisor' && !unique.includes('my-clients')) return { ok: false, error: '「我的客户」是专属顾问唯一工作页，不可取消' };
  try {
    const map = getRoleMenuOverrides();
    map[role] = unique;
    localStorage.setItem(ROLE_MENUS_KEY, JSON.stringify(map));
  } catch (e) { return { ok: false, error: '保存失败（存储不可用）' }; }
  logAudit({ operator, category: 'admin', action: 'update', target: roleDef.label, targetId: `role:${role}`, note: `调整「${roleDef.label}」角色权限（${unique.length} 个菜单）` });
  return { ok: true };
}

// 恢复角色默认权限（清该角色 localStorage 覆盖，逃生舱）
export function resetRoleMenus(role, operator = '') {
  if (role === 'super') return { ok: false, error: '超级管理员为最高权限，无自定义配置可恢复' };
  const roleDef = ADMIN_ROLES.find(r => r.key === role);
  if (!roleDef) return { ok: false, error: '角色不存在' };
  try {
    const map = getRoleMenuOverrides();
    if (!map[role]) return { ok: false, error: '该角色为默认配置，无需恢复' };
    delete map[role];
    localStorage.setItem(ROLE_MENUS_KEY, JSON.stringify(map));
  } catch (e) { return { ok: false, error: '操作失败（存储不可用）' }; }
  logAudit({ operator, category: 'admin', action: 'update', target: roleDef.label, targetId: `role:${role}`, note: `恢复「${roleDef.label}」角色为默认权限` });
  return { ok: true };
}

// 角色是否有自定义覆盖（AdminRoles 标记"已自定义"徽标）
export function hasRoleMenuOverride(role) {
  return !!getRoleMenuOverrides()[role];
}

// ========== 在线客服会话（2026-08-24 · 双端最小闭环：APP #support ↔ 后台「客户消息」）==========
// 两级服务模型：智能助手秒答常见问题（status:'bot' 自助层，后台不可见）→「转人工」进客服工作台
// （status:'open'）→ 客服关闭（'closed'）。后台只承接转过人工的会话，避免自助闲聊噪音。
// badge 口径 = "球在客服这边"：open 且最后一条消息来自投资人（客服回复即消角标，追问再亮起）。
// 接后端：supportTickets 由服务端会话表替换，通道可换第三方 SDK，工作台/台账零返工。
export let supportTickets = [
  {
    id: 'st1',
    userId: 'u1', name: '张三',
    status: 'open',            // 已转人工，待客服回复（badge 演示 + 双端回复闭环）
    staffName: null,
    createdAt: '2026-08-24 09:41:00',
    updatedAt: '2026-08-24 09:43:26',
    messages: [
      { from: 'bot', text: '您好，我是平台智能助手。常见问题可以直接问我；如需人工服务，请点击下方「转人工」。', time: '09:40' },
      { from: 'user', text: '想了解下一期项目研究什么时候发布？需要提前准备什么材料？', time: '09:41' },
      { from: 'bot', text: '项目研究与路演安排由投研团队统一规划，发布前会通过消息通知推送。涉及具体档期的问题，建议转人工获取准确答复。', time: '09:42' },
      { from: 'user', text: '好的，帮我转人工客服吧。', time: '09:43' },
    ],
  },
  {
    id: 'st2',
    userId: 'u16', name: '黄俊杰',
    status: 'closed',
    staffName: '张客服',
    createdAt: '2026-08-22 14:02:11',
    updatedAt: '2026-08-22 14:20:47',
    messages: [
      { from: 'user', text: '问卷提交后，我的资料谁会跟进？', time: '14:02' },
      { from: 'staff', text: '您好，问卷提交后由您的专属客户经理接手跟进，会尽快与您联系确认进一步需求。如有疑问欢迎随时联系。', time: '14:18' },
      { from: 'user', text: '明白了，谢谢！', time: '14:20' },
    ],
  },
];

const nowHM = () => new Date().toTimeString().slice(0, 5);
const nowFull = () => formatNow();

// 当前用户的客服会话（活跃优先取最近一条非 closed；无则 null 由调用方按需创建）
export function getSupportTicketsForUser(userId) {
  return supportTickets.filter(t => t.userId === userId);
}
export function getLatestUserTicket(userId) {
  const list = getSupportTicketsForUser(userId);
  return list.length ? list[list.length - 1] : null;
}

// 后台工作台全量视图：只含转过人工的会话（status:'bot' 自助阶段不进队列）
export function getStaffTickets() {
  return supportTickets.filter(t => t.status !== 'bot');
}

function persistTickets() {
  Storage.save();
}

// 投资人发消息（APP #support）：无会话则自动创建（bot 自助阶段）；返回目标会话
export function sendUserMessage(userId, userName, text) {
  let ticket = getLatestUserTicket(userId);
  if (!ticket || ticket.status === 'closed') {
    ticket = {
      id: `st${Date.now()}`,
      userId,
      name: userName, // 与种子数据字段一致（后台列表渲染 t.name）
      status: 'bot',
      staffName: null,
      createdAt: nowFull(),
      updatedAt: nowFull(),
      messages: [{ from: 'bot', text: '您好，我是平台智能助手。常见问题可以直接问我；如需人工服务，请点击下方「转人工」。', time: nowHM() }],
    };
    supportTickets.push(ticket);
  }
  ticket.messages.push({ from: 'user', text, time: nowHM() });
  ticket.updatedAt = nowFull();
  persistTickets();
  return ticket;
}

// 待回复判定（单一真源：getMenuBadges 角标与后台工作台标签共用）
// 口径：open 且"球在客服这边"——忽略 bot 消息后，最后一条来自投资人，
// 或转人工后客服从未回复（bot 刚应答完就转人工的场景，球同样在客服）。
export function isTicketPendingReply(t) {
  if (t.status !== 'open') return false;
  const humanMsgs = t.messages.filter(m => m.from !== 'bot');
  if (!humanMsgs.length) return true; // 只有 bot 消息即转人工：客服未接待
  return humanMsgs[humanMsgs.length - 1].from === 'user';
}

// 智能助手应答落库（bot 阶段专用；转人工后组件不再调用）
// 竞态守卫（2026-08-24 复盘）：发消息 800ms 应答延迟内若用户已点「转人工」，
// status 已变 open——迟到的 bot 应答不得追进人工会话（直接丢弃）
export function appendBotMessage(ticketId, text) {
  const t = supportTickets.find(x => x.id === ticketId);
  if (!t || t.status !== 'bot') return;
  t.messages.push({ from: 'bot', text, time: nowHM() });
  t.updatedAt = nowFull();
  persistTickets();
}

// 转人工：bot → open（进入后台工作台队列 + 角标亮起），留痕
export function escalateToStaff(ticketId, operator = '') {
  const t = supportTickets.find(x => x.id === ticketId);
  if (!t) return { ok: false, error: '会话不存在' };
  if (t.status !== 'bot') return { ok: false, error: '该会话已转接或已关闭' };
  t.status = 'open';
  t.updatedAt = nowFull();
  logAudit({ operator: t.name, category: 'service', action: 'escalate', target: t.name, targetId: t.id, note: '投资人发起转人工，会话进入客服队列' });
  pushNotification({ type: 'service', title: '已为您转接人工客服', body: '客服将尽快回复您的咨询，请留意本会话消息。' });
  return { ok: true };
}

// 客服回复（后台工作台）：记录接待人；球交还投资人
export function sendStaffReply(ticketId, text, staffName = '') {
  const t = supportTickets.find(x => x.id === ticketId);
  if (!t) return { ok: false, error: '会话不存在' };
  if (t.status !== 'open') return { ok: false, error: '仅进行中的会话可回复' };
  if (!text.trim()) return { ok: false, error: '回复内容不能为空' };
  t.messages.push({ from: 'staff', text: text.trim(), time: nowHM() });
  if (!t.staffName) t.staffName = staffName;
  t.updatedAt = nowFull();
  logAudit({ operator: staffName, category: 'service', action: 'reply', target: t.name, targetId: t.id, note: `回复客户咨询：${text.trim().slice(0, 30)}${text.length > 30 ? '…' : ''}` });
  return { ok: true };
}

// 客服关闭会话（closed 只读；投资人再咨询将开新会话）
export function closeSupportTicket(ticketId, operator = '') {
  const t = supportTickets.find(x => x.id === ticketId);
  if (!t) return { ok: false, error: '会话不存在' };
  if (t.status !== 'open') return { ok: false, error: '仅进行中的会话可关闭' };
  t.status = 'closed';
  t.updatedAt = nowFull();
  logAudit({ operator, category: 'service', action: 'close', target: t.name, targetId: t.id, note: '关闭客服会话' });
  return { ok: true };
}

// 侧边栏菜单待办 Badge（2026-08-14：工作台移除，待办信号下沉到各菜单角标——AntD Sider Badge 惯例）
// 单一真源：与各模块页头计数同源（同 AdminDashboard 既有计算）；角色过滤由 getRoleMenuKeys 承担，本函数只算数。
// 调用时机：AdminSidebar 每次渲染时计算（路由切换/刷新/登录后更新；抽屉内操作后滞后到下次导航——mock 阶段可接受，接后端由轮询/WebSocket 承载）。
export function getMenuBadges(role, admin) {
  const now = Date.now();

  const pendingKyc = kycSubmissions.filter(k => k.status === 'PENDING_REVIEW').length;
  const pendingDeposits = depositRequests.filter(r => r.status === 'pending').length;
  const pendingWithdraws = withdrawRequests.filter(r => r.status === 'pending').length;
  const pendingExits = exitEvents.filter(r => r.status === 'announced' || r.status === 'paying').length; // 退出分配待办（待确认 + 打款中）
  const pendingDividends = dividendRequests.filter(r => r.status === 'pending').length;
  // 客服待回复："球在客服这边"的会话数（isTicketPendingReply 单一真源）
  const pendingTickets = supportTickets.filter(isTicketPendingReply).length;

  // 客户线索待跟进：advisor 统计自己客户，其余角色全量
  const allLeads = getLeadClients();
  const isPendingLead = c => !['converted', 'paused'].includes(c.leadStatus || 'new');
  const leadPendingCount = role === 'advisor'
    ? allLeads.filter(c => getManagerForUser(c.userId)?.id === admin?.managerId && isPendingLead(c)).length
    : allLeads.filter(isPendingLead).length;

  // 待协调（submitted）+ 待签（allocated）
  const pendingAlloc = subscriptions.filter(s => s.status === 'submitted').length;
  const pendingSignSubs = subscriptions.filter(s => s.status === 'allocated').length;

  // PI 认证到期预警（compliance 专属，30 天内到期并入 PI badge——2026-08-14 独立审核流后归 PI 菜单）
  const piExpiresAt = currentUser?.pi?.expiresAt || null;
  const piDaysLeft = piExpiresAt ? Math.ceil((new Date(piExpiresAt).getTime() - now) / 86400000) : null;
  const piExpiring = role === 'compliance' && piDaysLeft !== null && piDaysLeft >= 0 && piDaysLeft <= 30 ? 1 : 0;

  // PI 认证待审核（独立审核队列，2026-08-14）
  const pendingPi = piSubmissions.filter(s => s.status === PI_STATUS.PENDING_REVIEW).length;

  // 我的客户任务（advisor 专属，2026-08-15）：名下客户待办合计——顾问待办口径
  // （待跟进 + 跟进中待办；资金/退出审批属运营/合规职责，非顾问任务不计）
  const myClientsBadge = (() => {
    if (role !== 'advisor' || !admin?.managerId) return 0;
    let n = 0;
    getMyClientUserIds(admin.managerId).forEach(uid => {
      const t = getClientTasks(uid);
      n += t.pendingLead + t.pendingSign;
    });
    return n;
  })();

  return {
    kyc: pendingKyc,
    pi: pendingPi + piExpiring,
    funds: pendingDeposits + pendingWithdraws,
    // 基金交易待确认（2026-10-28）：申购/赎回单据，财务/运营的日常待办
    'fund-trades': fundOrders.filter(o => o.status === FUND_ORDER_STATUS.PENDING).length,
    subscriptions: pendingAlloc + pendingSignSubs,
    dividends: pendingDividends,
    exits: pendingExits,
    messages: pendingTickets,
    registrations: leadPendingCount,
    'my-clients': myClientsBadge,
    // 合规工作台待办（T12：大额交易审查/异常检测/STR/EDD 待办徽章）
    'large-tx': largeTransactionReviews.filter(r => r.status === COMPLIANCE_STATUS.PENDING).length,
    anomaly: anomalyDetectionLogs.filter(r => r.status === COMPLIANCE_STATUS.PENDING).length,
    str: strReports.filter(r =>
      r.assessmentStatus === STR_ASSESSMENT_STATUS.PENDING
      || r.assessmentStatus === STR_ASSESSMENT_STATUS.IN_PROGRESS
      || r.reportStatus === STR_REPORT_STATUS.PENDING_APPROVAL
    ).length,
    edd: enhancedDueDiligence.filter(r => r.status === COMPLIANCE_STATUS.PENDING).length,
  };
}

export function verifyAdmin(username, password) {
  const list = getAdminUsers();
  const u = list.find(a => a.username === username);
  if (!u) return null;
  if (u.disabled) return null; // 被禁用的后台账号不可登录（2026-08-13 后台账号管理）
  const effectivePwd = getAdminPwdOverride(u.username) || u.password;
  return effectivePwd === password ? { ...u } : null;
}

// 管理员密码持久化覆盖：adminUsers 为 mock 初始密码，修改后的密码存 localStorage
// （登录态 zhifu-admin-login 已持久化，密码修改若只在内存，刷新后新密码失效 = 演示闭环断裂）
const ADMIN_PWD_KEY = 'zhifu-admin-passwords';
function getAdminPwdOverride(username) {
  try {
    const raw = localStorage.getItem(ADMIN_PWD_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw);
    return map[username] || null;
  } catch (e) { return null; }
}

// 修改管理员密码（mock：覆盖写 localStorage 持久化，刷新后新密码仍有效；接后端时改服务端）
// 返回 { ok: true } 或 { ok: false, error: '...' }
export function changeAdminPassword(username, oldPassword, newPassword) {
  const list = getAdminUsers();
  const u = list.find(a => a.username === username);
  if (!u) return { ok: false, error: '账号不存在' };
  const effectiveOld = getAdminPwdOverride(username) || u.password;
  if (effectiveOld !== oldPassword) return { ok: false, error: '原密码错误' };
  if (!newPassword || newPassword.length < 6) return { ok: false, error: '新密码至少 6 位' };
  try {
    const raw = localStorage.getItem(ADMIN_PWD_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[username] = newPassword;
    localStorage.setItem(ADMIN_PWD_KEY, JSON.stringify(map));
  } catch (e) { return { ok: false, error: '密码保存失败' }; }
  return { ok: true };
}

// ===== 管理员账号管理（2026-08-13 P1 板块 B）=====
// adminUsers 持久化：增/删/改/禁用/重置密码全量写 localStorage（zhifu-admin-users），
// 刷新后保持（接后端时改服务端，adminUsers 为 mock 初始集合）。
// 写函数一律以 getAdminUsers() 为基础（localStorage 快照优先），改后同步 adminUsers + persist。
const ADMIN_USERS_KEY = 'zhifu-admin-users';
// 角色标签快照来源 = ADMIN_ROLES 单一真源（新增角色只改 ADMIN_ROLES，addAdmin/updateAdmin 自动生效）
const ADMIN_ROLE_LABELS = Object.fromEntries(ADMIN_ROLES.map(r => [r.key, r.label]));

// 当前管理员集合：localStorage 快照（上次会话增删改）> mock 初始
// 缺省兼容：旧快照（绑定邮箱字段加入前）无 email，补空串（编辑时必填校验兜底）
// 迁移补丁（2026-08-24 复盘）：旧版快照（finance 角色加入前的增删改）不含 fin1——快照优先会导致
// 财务演示账号消失、无法登录（演示翻车）。检测缺失则补入 mock 新增账号；只补新增、不触碰其余
// 快照内容（用户自建/删除的账号不受影响；fin1 若被手动删除后刷新会复活，mock 阶段可接受）。
const MOCK_ADDED_ADMIN_IDS = ['ad8']; // 本次版本新增的 mock 初始账号 id
export function getAdminUsers() {
  try {
    const raw = localStorage.getItem(ADMIN_USERS_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (Array.isArray(saved) && saved.length) {
        const list = saved.map(a => ({ email: '', ...a }));
        MOCK_ADDED_ADMIN_IDS.forEach(id => {
          const seed = adminUsers.find(a => a.id === id);
          if (seed && !list.some(a => a.id === id)) list.push({ email: '', ...seed });
        });
        return list;
      }
    }
  } catch (e) { /* 快照损坏则回退 mock 初始 */ }
  return [...adminUsers];
}

const EMAIL_RE = /^\S+@\S+\.\S+$/;

function persistAdminUsers(list) {
  adminUsers = list; // 同步模块变量（后续 changeAdminPassword / verifyAdmin 读最新集合）
  try { localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(list)); } catch (e) { /* 隐私模式等不可用则静默 */ }
}

// 新增后台账号（角色专属校验：advisor 需 managerId 关联专属顾问）
// 绑定联系方式（2026-08-14 · 方案 A）：email 必填（找回密码/安全通知/审计唯一化主通道）
export function addAdmin({ username, password, name, role, managerId, email }, operator = '') {
  const list = getAdminUsers();
  if (!username || !name) return { ok: false, error: '请填写用户名和姓名' };
  if (list.some(a => a.username === username)) return { ok: false, error: '用户名已存在' };
  if (!password || password.length < 6) return { ok: false, error: '密码至少 6 位' };
  if (role === 'advisor' && !managerId) return { ok: false, error: '专属顾问需指定关联客户经理' };
  if (!email || !EMAIL_RE.test(email)) return { ok: false, error: '请填写有效邮箱（找回密码/安全通知主通道）' };
  const newAdmin = { id: `ad${Date.now()}`, username, password, name, role, roleLabel: ADMIN_ROLE_LABELS[role] || role, email, ...(managerId ? { managerId } : {}) };
  list.push(newAdmin);
  persistAdminUsers(list);
  logAudit({ operator, category: 'admin', action: 'create', target: name, targetId: newAdmin.id, note: `新增后台账号 ${username}（${newAdmin.roleLabel}）` });
  return { ok: true, id: newAdmin.id };
}

export function updateAdmin(id, patch, operator = '') {
  const list = getAdminUsers();
  const idx = list.findIndex(a => a.id === id);
  if (idx < 0) return { ok: false, error: '账号不存在' };
  const cur = list[idx];
  if (patch.username && patch.username !== cur.username && list.some(a => a.username === patch.username)) return { ok: false, error: '用户名已存在' };
  if (patch.email !== undefined && !patch.email) return { ok: false, error: '请填写有效邮箱（找回密码/安全通知主通道）' };
  if (patch.email && !EMAIL_RE.test(patch.email)) return { ok: false, error: '请填写有效邮箱' };
  const next = { ...cur, ...patch };
  if (next.role) next.roleLabel = ADMIN_ROLE_LABELS[next.role] || next.role;
  if (next.role !== 'advisor') delete next.managerId;
  list[idx] = next;
  persistAdminUsers(list);
  logAudit({ operator, category: 'admin', action: 'update', target: cur.name, targetId: id, note: `更新后台账号 ${next.username}` });
  return { ok: true };
}

export function deleteAdmin(id, operator = '') {
  const list = getAdminUsers();
  const cur = list.find(a => a.id === id);
  if (!cur) return { ok: false, error: '账号不存在' };
  const activeSupers = list.filter(a => a.role === 'super' && !a.disabled);
  if (cur.role === 'super' && activeSupers.length <= 1) return { ok: false, error: '至少保留一名启用状态的超级管理员' };
  persistAdminUsers(list.filter(a => a.id !== id));
  logAudit({ operator, category: 'admin', action: 'delete', target: cur.name, targetId: id, note: `删除后台账号 ${cur.username}` });
  return { ok: true };
}

export function toggleAdminDisabled(id, operator = '') {
  const list = getAdminUsers();
  const cur = list.find(a => a.id === id);
  if (!cur) return { ok: false, error: '账号不存在' };
  if (!cur.disabled) {
    const activeSupers = list.filter(a => a.role === 'super' && !a.disabled);
    if (cur.role === 'super' && activeSupers.length <= 1) return { ok: false, error: '至少保留一名启用状态的超级管理员' };
  }
  const next = list.map(a => a.id === id ? { ...a, disabled: !a.disabled } : a);
  persistAdminUsers(next);
  const after = next.find(a => a.id === id);
  logAudit({ operator, category: 'admin', action: after.disabled ? 'disable' : 'enable', target: cur.name, targetId: id, note: `${after.disabled ? '禁用' : '启用'}后台账号 ${cur.username}` });
  return { ok: true };
}

// 重置密码：直接写 adminUsers.password + 清除该用户 localStorage 密码覆盖（新密码立即生效）
export function resetAdminPassword(id, newPassword, operator = '') {
  const list = getAdminUsers();
  const cur = list.find(a => a.id === id);
  if (!cur) return { ok: false, error: '账号不存在' };
  if (!newPassword || newPassword.length < 6) return { ok: false, error: '密码至少 6 位' };
  persistAdminUsers(list.map(a => a.id === id ? { ...a, password: newPassword } : a));
  try {
    const raw = localStorage.getItem(ADMIN_PWD_KEY);
    if (raw) {
      const map = JSON.parse(raw);
      delete map[cur.username];
      localStorage.setItem(ADMIN_PWD_KEY, JSON.stringify(map));
    }
  } catch (e) { /* 无覆盖则忽略 */ }
  logAudit({ operator, category: 'admin', action: 'reset_password', target: cur.name, targetId: id, note: `重置 ${cur.username} 密码` });
  return { ok: true };
}

// KYC 审核队列（多用户 mock，后台审核工作台用）
export const kycSubmissions = [
  {
    id: 'k1',
    userId: 'u35',
    name: '陈美琪',
    email: 'chen.meiqi@example.com',
    status: KYC_STATUS.PENDING_REVIEW,
    submittedAt: '2026-08-10 10:12:33',
    rejectReason: null,
    history: [{ at: '2026-08-10 10:12:33', operator: '系统', action: 'submitted', note: '用户提交认证资料' }],
    profile: {
      fullName: '陈美琪',
      fullNameEn: 'CHAN MEI KI',
      gender: 'F',
      birthDate: '1988-03-12',
      nationality: '中国香港',
      piType: 'professional',
      piCertified: true,
      idDocType: 'HK_ID',
      idDocNumber: 'R345678(2)',
      idDocFront: 'images/demo-id-front.jpg',
      idDocBack: 'images/demo-id-back.jpg',
      idDocHandheld: null,
      ekycResult: {               // eKYC 核验结果（T3 · PRD §3.10 技术证据层）
        status: 'passed',
        score: 0.91,
        vendorRef: 'EKYC202608101013002',
        livenessPass: true,
        ocrPass: true,
        verifiedAt: '2026-08-10 10:13:02',
        failReason: null,
      },
      addressProofType: 'utility',
      addressProof: 'images/demo-address.jpg',
      addressLine: '香港九龙尖沙咀弥敦道 132 号',
    },
    // 制裁/PEP筛查字段（2026-08-26 任务5新增）
    pepStatus: PEP_STATUS.FOREIGN,
    riskLevel: RISK_LEVEL.HIGH,
    lastRiskAssessment: '2026-08-20',
    sanctionsScreening: {
      status: 'flagged',         // 'clear' | 'flagged' | 'pending'
      screenedAt: '2026-08-20 10:00:00',
      screenedBy: '系统',
      hits: [
        { list: '某国制裁名单', matchScore: 0.92, matchType: 'name', note: '姓名高度匹配' },
        { list: 'PEP数据库', matchScore: 0.85, matchType: 'identity', note: '前政府部长关联' },
      ],
    },
  },
  {
    id: 'k2',
    userId: 'u4',
    name: '林大伟',
    email: 'lin.dawei@example.com',
    status: KYC_STATUS.PENDING_REVIEW,
    submittedAt: '2026-08-11 09:45:02',
    rejectReason: null,
    history: [{ at: '2026-08-11 09:45:02', operator: '系统', action: 'submitted', note: '用户提交认证资料' }],
    profile: {
      fullName: '林大伟',
      fullNameEn: 'LAM TAI WAI',
      gender: 'M',
      birthDate: '1975-07-25',
      nationality: '中国大陆',
      piType: 'asset',
      piCertified: true,
      idDocType: 'PASSPORT',
      idDocNumber: 'E9988776',
      idDocFront: 'images/demo-id-front.jpg',
      idDocBack: null,
      idDocHandheld: null,
      addressProofType: 'bank',
      addressProof: 'images/demo-address.jpg',
      addressLine: '深圳市南山区科技园路 88 号',
    },
    // 制裁/PEP筛查字段（2026-08-26 任务5新增）
    pepStatus: PEP_STATUS.NONE,
    riskLevel: RISK_LEVEL.LOW,
    lastRiskAssessment: '2026-08-21',
    sanctionsScreening: {
      status: 'clear',
      screenedAt: '2026-08-21 09:45:02',
      screenedBy: '系统',
      hits: [],
    },
  },
  {
    id: 'k3',
    userId: 'u5',
    name: '周芷若',
    email: 'zhou.zhiruo@example.com',
    status: KYC_STATUS.PENDING_REVIEW,
    submittedAt: '2026-08-12 08:30:15',
    rejectReason: null,
    history: [{ at: '2026-08-12 08:30:15', operator: '系统', action: 'submitted', note: '用户提交认证资料' }],
    profile: {
      fullName: '周芷若',
      fullNameEn: 'CHAU CHI YEUK',
      gender: 'F',
      birthDate: '1990-11-08',
      nationality: '中国香港',
      piType: 'professional',
      piCertified: true,
      idDocType: 'HK_ID',
      idDocNumber: 'M765432(1)',
      idDocFront: 'images/demo-id-front.jpg',
      idDocBack: 'images/demo-id-back.jpg',
      idDocHandheld: null,
      addressProofType: 'utility',
      addressProof: 'images/demo-address.jpg',
      addressLine: '香港湾仔告士打道 200 号',
    },
    // 制裁/PEP筛查字段（2026-08-26 任务5新增）
    pepStatus: PEP_STATUS.NONE,
    riskLevel: RISK_LEVEL.LOW,
    lastRiskAssessment: '2026-08-22',
    sanctionsScreening: {
      status: 'clear',
      screenedAt: '2026-08-22 08:30:15',
      screenedBy: '系统',
      hits: [],
    },
  },
  {
    id: 'k4',
    userId: 'u6',
    name: '吴世昌',
    email: 'wu.shichang@example.com',
    status: KYC_STATUS.PENDING_REVIEW,
    submittedAt: '2026-08-12 14:05:41',
    rejectReason: null,
    history: [{ at: '2026-08-12 14:05:41', operator: '系统', action: 'submitted', note: '用户提交认证资料' }],
    profile: {
      fullName: '吴世昌',
      fullNameEn: 'NG SAI CHEONG',
      gender: 'M',
      birthDate: '1972-01-15',
      nationality: '中国香港',
      piType: 'professional',
      piCertified: true,
      idDocType: 'PASSPORT',
      idDocNumber: 'K5566778',
      idDocFront: 'images/demo-id-front.jpg',
      idDocBack: null,
      idDocHandheld: null,
      addressProofType: 'bank',
      addressProof: 'images/demo-address.jpg',
      addressLine: '香港铜锣湾希慎道 33 号',
    },
    // 制裁/PEP筛查字段（2026-08-26 任务5新增）
    pepStatus: PEP_STATUS.NONE,
    riskLevel: RISK_LEVEL.LOW,
    lastRiskAssessment: '2026-08-22',
    sanctionsScreening: {
      status: 'clear',
      screenedAt: '2026-08-22 14:05:41',
      screenedBy: '系统',
      hits: [],
    },
  },
  {
    id: 'k5',
    userId: 'u7',
    name: '刘倩',
    email: 'liu.qian@example.com',
    status: KYC_STATUS.PENDING_REVIEW,
    submittedAt: '2026-08-13 09:20:17',
    rejectReason: null,
    history: [{ at: '2026-08-13 09:20:17', operator: '系统', action: 'submitted', note: '用户提交认证资料' }],
    profile: {
      fullName: '刘倩',
      fullNameEn: 'LAU SIN',
      gender: 'F',
      birthDate: '1986-09-28',
      nationality: '中国香港',
      piType: 'asset',
      piCertified: true,
      idDocType: 'HK_ID',
      idDocNumber: 'R1122334(2)',
      idDocFront: 'images/demo-id-front.jpg',
      idDocBack: 'images/demo-id-back.jpg',
      idDocHandheld: null,
      addressProofType: 'gov',
      addressProof: 'images/demo-address.jpg',
      addressLine: '香港荃湾大河道 88 号',
    },
    // 制裁/PEP筛查字段（2026-08-26 任务5新增）
    pepStatus: PEP_STATUS.NONE,
    riskLevel: RISK_LEVEL.LOW,
    lastRiskAssessment: '2026-08-23',
    sanctionsScreening: {
      status: 'clear',
      screenedAt: '2026-08-23 09:20:17',
      screenedBy: '系统',
      hits: [],
    },
  },
  {
    id: 'k6',
    userId: 'u8',
    name: '赵明轩',
    email: 'zhao.mingxuan@example.com',
    status: KYC_STATUS.PENDING_REVIEW,
    submittedAt: '2026-08-13 11:45:03',
    rejectReason: null,
    history: [{ at: '2026-08-13 11:45:03', operator: '系统', action: 'submitted', note: '用户提交认证资料' }],
    profile: {
      fullName: '赵明轩',
      fullNameEn: 'CHIU MING HIN',
      gender: 'M',
      birthDate: '1991-03-02',
      nationality: '中国台湾',
      piType: 'professional',
      piCertified: true,
      idDocType: 'CMNH',
      idDocNumber: 'Q12345678',
      idDocFront: 'images/demo-id-front.jpg',
      idDocBack: 'images/demo-id-back.jpg',
      idDocHandheld: null,
      addressProofType: 'utility',
      addressProof: 'images/demo-address.jpg',
      addressLine: '台北市信义区松寿路 1 号',
    },
    // 制裁/PEP筛查字段（2026-08-26 任务5新增）
    pepStatus: PEP_STATUS.NONE,
    riskLevel: RISK_LEVEL.LOW,
    lastRiskAssessment: '2026-08-23',
    sanctionsScreening: {
      status: 'pending',
      screenedAt: null,
      screenedBy: null,
      hits: [],
    },
  },
  {
    id: 'k7',
    userId: 'u9',
    name: '孙雅婷',
    email: 'sun.yating@example.com',
    status: KYC_STATUS.PENDING_REVIEW,
    submittedAt: '2026-08-13 15:30:52',
    rejectReason: null,
    history: [{ at: '2026-08-13 15:30:52', operator: '系统', action: 'submitted', note: '用户提交认证资料' }],
    profile: {
      fullName: '孙雅婷',
      fullNameEn: 'SUEN NGA TING',
      gender: 'F',
      birthDate: '1988-12-19',
      nationality: '中国香港',
      piType: 'professional',
      piCertified: true,
      idDocType: 'HK_ID',
      idDocNumber: 'N8877665(3)',
      idDocFront: 'images/demo-id-front.jpg',
      idDocBack: 'images/demo-id-back.jpg',
      idDocHandheld: null,
      addressProofType: 'bank',
      addressProof: 'images/demo-address.jpg',
      addressLine: '香港九龙观塘开源道 55 号',
    },
    // 制裁/PEP筛查字段（2026-08-26 任务5新增）
    pepStatus: PEP_STATUS.NONE,
    riskLevel: RISK_LEVEL.LOW,
    lastRiskAssessment: '2026-08-23',
    sanctionsScreening: {
      status: 'clear',
      screenedAt: '2026-08-23 15:30:52',
      screenedBy: '系统',
      hits: [],
    },
  },
  {
    id: 'k8',
    userId: 'u10',
    name: '郑国豪',
    email: 'zheng.guohao@example.com',
    status: KYC_STATUS.APPROVED,
    submittedAt: '2026-08-11 10:08:29',
    rejectReason: null,
    history: [
      { at: '2026-08-11 10:08:29', operator: '系统', action: 'submitted', note: '用户提交认证资料' },
      { at: '2026-08-11 16:44:10', operator: '合规专员', action: 'approved', note: '审核通过' },
    ],
    profile: {
      fullName: '郑国豪',
      fullNameEn: 'CHENG KWOK HO',
      gender: 'M',
      birthDate: '1978-06-08',
      nationality: '中国香港',
      piType: 'asset',
      piCertified: true,
      idDocType: 'HK_ID',
      idDocNumber: 'P3344556(4)',
      idDocFront: 'images/demo-id-front.jpg',
      idDocBack: 'images/demo-id-back.jpg',
      idDocHandheld: null,
      addressProofType: 'utility',
      addressProof: 'images/demo-address.jpg',
      addressLine: '香港沙田银城街 100 号',
    },
    // 制裁/PEP筛查字段（2026-08-26 任务5新增）
    pepStatus: PEP_STATUS.NONE,
    riskLevel: RISK_LEVEL.LOW,
    lastRiskAssessment: '2026-08-11',
    sanctionsScreening: {
      status: 'clear',
      screenedAt: '2026-08-11 10:08:29',
      screenedBy: '系统',
      hits: [],
    },
  },
  {
    id: 'k9',
    userId: 'u31', // 何嘉欣独立账户（不与 subscriptions u11 陈伟强冲突，2026-08-13 用户管理聚合发现）
    name: '何嘉欣',
    email: 'ho.kayan@example.com',
    status: KYC_STATUS.REJECTED,
    submittedAt: '2026-08-10 13:22:36',
    rejectReason: '证件照片不清晰，请重新上传',
    history: [
      { at: '2026-08-10 13:22:36', operator: '系统', action: 'submitted', note: '用户提交认证资料' },
      { at: '2026-08-11 09:51:20', operator: '合规专员', action: 'rejected', note: '证件照片不清晰，请重新上传' },
    ],
    profile: {
      fullName: '何嘉欣',
      fullNameEn: 'HO KA YAN',
      gender: 'F',
      birthDate: '1994-07-30',
      nationality: '中国香港',
      piType: 'professional',
      piCertified: true,
      idDocType: 'PASSPORT',
      idDocNumber: 'L9988776',
      idDocFront: 'images/demo-id-front.jpg',
      idDocBack: null,
      idDocHandheld: null,
      addressProofType: 'utility',
      addressProof: 'images/demo-address.jpg',
      addressLine: '香港将军澳唐贤街 9 号',
    },
    // 制裁/PEP筛查字段（2026-08-26 任务5新增）
    pepStatus: PEP_STATUS.NONE,
    riskLevel: RISK_LEVEL.LOW,
    lastRiskAssessment: '2026-08-10',
    sanctionsScreening: {
      status: 'clear',
      screenedAt: '2026-08-10 13:22:36',
      screenedBy: '系统',
      hits: [],
    },
  },
];

// ========== PI 认证审核队列（2026-08-14 · 独立 PI 审核流） ==========
// 独立于 kycSubmissions：PI = 资格认证（资产证明 ≥800 万 / 持牌资质），KYC = 实名认证。
// 结构对齐 kycSubmissions（userId 关联 + history 留痕 + 通知 + 审计），后台 AdminPI 独立审核页消费。
export const piSubmissions = [
  {
    id: 'pi1',
    userId: 'u35',
    name: '陈美琪',
    email: 'chen.meiqi@example.com',
    status: PI_STATUS.PENDING_REVIEW,
    piType: 'asset',
    piProof: 'images/demo-pi-proof.jpg',
    piCertified: true,
    submittedAt: '2026-08-12 15:20:44',
    rejectReason: null,
    history: [{ at: '2026-08-12 15:20:44', operator: '系统', action: 'submitted', note: '用户提交 PI 资格声明与资产证明' }],
  },
  {
    id: 'pi2',
    userId: 'u6',
    name: '吴世昌',
    email: 'wu.shichang@example.com',
    status: PI_STATUS.PENDING_REVIEW,
    piType: 'professional',
    piProof: null,
    piCertified: true,
    submittedAt: '2026-08-13 09:10:18',
    rejectReason: null,
    history: [{ at: '2026-08-13 09:10:18', operator: '系统', action: 'submitted', note: '用户提交 PI 资格声明（持牌人士）' }],
  },
  {
    id: 'pi3',
    userId: 'u13',
    name: '郑国豪',
    email: 'cheng.kokho@example.com',
    status: PI_STATUS.APPROVED,
    piType: 'asset',
    piProof: 'images/demo-pi-proof.jpg',
    piCertified: true,
    submittedAt: '2026-08-05 10:05:00',
    rejectReason: null,
    verifiedAt: '2026-08-06 11:00:00',
    history: [
      { at: '2026-08-05 10:05:00', operator: '系统', action: 'submitted', note: '用户提交 PI 资格声明与资产证明' },
      { at: '2026-08-06 11:00:00', operator: '合规专员', action: 'approved', note: '资产证明核验通过（≥800 万港币）' },
    ],
  },
  {
    id: 'pi4',
    userId: 'u21',
    name: '赵明轩',
    email: 'zhao.mingxuan@example.com',
    status: PI_STATUS.REJECTED,
    piType: 'asset',
    piProof: 'images/demo-pi-proof.jpg',
    piCertified: true,
    submittedAt: '2026-08-08 14:30:00',
    rejectReason: '资产证明文件日期过期，请提供近 3 个月内账单',
    history: [
      { at: '2026-08-08 14:30:00', operator: '系统', action: 'submitted', note: '用户提交 PI 资格声明与资产证明' },
      { at: '2026-08-09 10:20:00', operator: '合规专员', action: 'rejected', note: '资产证明文件日期过期，请提供近 3 个月内账单' },
    ],
  },
];

// PI 认证到期派生：APPROVED 且 expiresAt 已过 → EXPIRED（激活死状态，重认证走重新提交）
export function getPiStatusForUser(userId) {
  // 预置 approved 账号（张三/王五）直接读 testAccounts.pi（已认证，含到期派生）
  // 不再依赖 currentUser 单例——后台/跨账号查询时也能得到正确状态
  const seed = Object.values(testAccounts).find(u => u.id === userId);
  if (seed?.isPI && seed.pi?.status === 'verified') {
    const expiresAt = seed.pi.expiresAt;
    if (expiresAt && new Date(expiresAt).getTime() < Date.now()) return PI_STATUS.EXPIRED;
    return PI_STATUS.APPROVED;
  }
  const sub = piSubmissions.filter(s => s.userId === userId).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];
  if (!sub) return PI_STATUS.NOT_SUBMITTED;
  return sub.status;
}

// 用户侧 KYCPI 提交 PI 申请：写入 piSubmissions（userId 关联）+ 当前用户 pi 状态 pending + 通知 + 审计
// 幂等：已有 PENDING/APPROVED 申请时不允许重复提交（REJECTED/EXPIRED 可重新提交）
export function submitPiCertification({ piType, piProof, piCertified, piLicenseNo = null, piLicenseOrg = null }, operator = '系统') {
  const existing = piSubmissions.filter(s => s.userId === currentUser.id);
  const active = existing.find(s => [PI_STATUS.PENDING_REVIEW, PI_STATUS.APPROVED].includes(s.status));
  if (active) return { ok: false, error: '已有待审核或已认证的 PI 申请' };
  const submittedAt = formatNow();
  piSubmissions.unshift({
    id: `pi${Date.now()}`,
    userId: currentUser.id,
    name: currentUser.name,
    email: currentUser.email,
    status: PI_STATUS.PENDING_REVIEW,
    piType, piProof, piCertified,
    // 持牌信息（2026-09-20：professional 类型凭 SFC 牌照编号在 SFC 公开记录核验；asset 类型为 null）
    piLicenseNo, piLicenseOrg,
    // PI 声明签署留痕（2026-09-15 · 对齐协议签署实践）：声明全文版本随申请固化
    piAgreementVersion: getAgreementById('pi-terms')?.version || 'v1.0',
    submittedAt,
    rejectReason: null,
    history: [{ at: submittedAt, operator, action: 'submitted', note: '用户提交 PI 资格声明' }],
  });
  // 同步用户侧（mock 单真实用户；接后端按真实账户同步）
  if (currentUser.pi) {
    currentUser.pi.status = 'pending';
    currentUser.pi.verifiedAt = null;
    currentUser.pi.expiresAt = null;
    currentUser.pi.category = null;
    currentUser.pi.basis = null;
  }
  pushNotification({ type: 'service', title: 'PI 认证审核中', body: '您的专业投资者认证申请已提交，我们将在 1-3 个工作日内完成审核。' });
  logAudit({ operator, category: 'pi', action: 'submit', target: currentUser.name, targetId: currentUser.id, note: '用户提交 PI 资格认证申请' });
  Storage.save();
  return { ok: true, id: piSubmissions[0].id };
}

// 后台 PI 审核通过：核验资格（资产证明/持牌）达标 → isPI=true + pi.status=verified + 到期时间
// checks：核验判定结果 { '核验项': 'pass' | 'fail' }（2026-08-14 方案 A 逐项三态判定——
// 全部判定 pass 才可调用通过；数据层防御：含 fail 或未判定项时拒绝通过，防前端绕过）
const PI_CHECKLISTS = {
  asset: ['资产证明文件真实有效（银行月结单 / 投资组合账单）', '投资组合 ≥ HK$8,000,000（专业投资者门槛）', '文件日期为近 3 个月内（非过期账单）', '文件持有人姓名与申请人一致'],
  professional: ['申请人身份为香港证监会持牌人士或注册机构', '持牌/注册资格在有效期内（SFC NO 可查询）'],
};
export function approvePiSubmission(pid, operator = '系统', checks = null) {
  const s = piSubmissions.find(x => x.id === pid);
  if (!s || s.status !== PI_STATUS.PENDING_REVIEW) return false;
  // 数据层防御（方案 A）：全量判定且全 pass 才通过（前端已拦截，此层兜底防绕过）
  const fullList = PI_CHECKLISTS[s.piType] || [];
  if (!checks || typeof checks !== 'object' || Object.keys(checks).length !== fullList.length) return false;
  const vals = Object.values(checks);
  if (vals.some(v => v !== 'pass')) return false;
  s.status = PI_STATUS.APPROVED;
  s.verifiedAt = formatNow();
  s.history = s.history || [];
  const checkNote = buildPiCheckNote(checks);
  s.history.push({ at: formatNow(), operator, action: 'approved', note: checkNote ? `PI 资格核验通过 · ${checkNote}` : 'PI 资格核验通过', checks });
  if (s.userId && currentUser.id === s.userId) {
    currentUser.isPI = true;
    currentUser.piVerified = true;
    currentUser.pi.status = 'verified';
    currentUser.pi.verifiedAt = formatNow();
    currentUser.pi.expiresAt = '2027-08-14'; // mock 一年期，接后端按策略设置
    currentUser.pi.category = s.piType === 'asset' ? '专业投资者' : '专业投资者';
    currentUser.pi.basis = s.piType === 'asset' ? '持有至少 HK$8,000,000 的投资组合' : '持牌人士或注册机构';
  }
  pushNotification({ type: 'service', title: 'PI 认证通过', body: `${s.name} 的专业投资者资格已核验通过，可使用平台资讯与咨询服务。` });
  logAudit({ operator, category: 'pi', action: 'approve', target: s.name, targetId: pid, note: checkNote ? `PI 资格审核通过（核验：${checkNote}）` : 'PI 资格审核通过（专业投资者认证）' });
  Storage.save();
  return true;
}

// 后台 PI 审核拒绝：资质未达标/材料不符 → isPI=false，原因通知用户侧（可重新提交）
export function rejectPiSubmission(pid, reason, operator = '系统') {
  const s = piSubmissions.find(x => x.id === pid);
  if (!s || s.status !== PI_STATUS.PENDING_REVIEW) return false;
  if (!reason || !reason.trim()) return false;
  s.status = PI_STATUS.REJECTED;
  s.rejectReason = reason.trim();
  s.history = s.history || [];
  s.history.push({ at: formatNow(), operator, action: 'rejected', note: s.rejectReason });
  if (s.userId && currentUser.id === s.userId) {
    currentUser.isPI = false;
    currentUser.piVerified = false;
    currentUser.pi.status = 'rejected'; // 用户侧状态页区分 rejected（KYC 拒绝用 kyc_status，PI 独立）
    currentUser.kyc_profile.rejectReason = s.rejectReason;
  }
  pushNotification({ type: 'service', title: 'PI 认证未通过', body: `${s.name} 的专业投资者资格未通过审核，原因：${s.rejectReason}` });
  logAudit({ operator, category: 'pi', action: 'reject', target: s.name, targetId: pid, note: `PI 拒绝原因：${s.rejectReason}` });
  Storage.save();
  return true;
}

// 核验判定明细 → 留痕文本（方案 A 三态：pass 符合 ✓ / fail 不符合 ✗）
// 如「✓ 文件有效 / ✗ 资产门槛未达 800 万」，未判定项不出现（未核验 = 无留痕）
function buildPiCheckNote(checks) {
  if (!checks || typeof checks !== 'object') return '';
  const entries = Object.entries(checks);
  if (entries.length === 0) return '';
  return entries.map(([k, v]) => `${v === 'pass' ? '✓' : '✗'} ${k.split('（')[0].trim()}`).join(' / ');
}

export function getPendingPi() {
  return piSubmissions.filter(s => s.status === PI_STATUS.PENDING_REVIEW);
}

// ========== 用户管理（2026-08-13 · 后台 P0：投资人账户统一视图） ==========
// 账户是"人"的载体，所有资产/资金/申购/持仓都挂账户下——此前投资人数据分散在
// testAccounts（注册）/ kycSubmissions（KYC 申请人）/ eventRegistrationsList（报名客户）
// / subscriptions（申购者）5 处，后台无统一档案。本函数聚合为统一投资人账户视图。

// 账户状态：禁用集合（mock 持久化；禁用 = 风控冻结账户，接后端由服务端校验登录/操作）
export const disabledUserIds = new Set();

export function getInvestorUsers() {
  const map = new Map();
  const put = (u) => map.set(u.userId, { ...(map.get(u.userId) || {}), ...u, sources: (map.get(u.userId)?.sources || []).concat(u.sources || []) });

  // PI 状态派生（2026-08-14 独立审核流）：precompute 每 userId 的 PI 状态（piSubmissions 最新一条）
  const piStatusByUser = new Map();
  piSubmissions.forEach(s => {
    const prev = piStatusByUser.get(s.userId);
    // 保留最新提交（按 submittedAt 排序取后）+ 若非 rejected/not-submitted 以已认证/待审优先
    if (!prev || s.submittedAt > prev.submittedAt) piStatusByUser.set(s.userId, s.status);
  });

  // 1. 注册账户（testAccounts：最完整的账户档案）
  Object.values(testAccounts).forEach(a => {
    put({
      userId: a.id, name: a.name, email: a.email,
      investorNo: a.pi?.investorNo || getInvestorNo(a.id),
      kycStatus: a.kyc_status,
      // 2026-08-14：PI 独立审核流——预置 approved 账号读 pi.status（已认证），其余按 piSubmissions 派生
      piStatus: (a.pi?.status === 'verified' ? PI_STATUS.APPROVED : null) || (piStatusByUser.get(a.id) || PI_STATUS.NOT_SUBMITTED),
      piExpiry: a.pi?.expiresAt || '',
      registeredAt: '2026-01-15 10:00:00',
      account: { hkd: a.account?.hkd ?? 0, frozen: a.account?.frozen ?? 0 },
      sources: ['registered'],
    });
  });

  // 2. KYC 申请人（认证状态 + 档案；testAccounts 已含的覆盖认证状态）
  // 2026-08-14：piStatus 不再由 KYC 状态派生（独立审核流），改按 piSubmissions 派生
  kycSubmissions.forEach(k => {
    put({
      userId: k.userId, name: k.name, email: k.email,
      investorNo: getInvestorNo(k.userId),
      kycStatus: k.status,
      rejectReason: k.status === KYC_STATUS.REJECTED ? k.rejectReason : null,
      piStatus: piStatusByUser.get(k.userId) || PI_STATUS.NOT_SUBMITTED,
      registeredAt: k.submittedAt,
      sources: ['kyc'],
    });
  });

  // 3. 报名客户（获客来源：报名数——只补计数，不覆盖身份；身份唯一来源 = 账户档案
  //    [testAccounts / kycSubmissions]，业务记录不承载身份，避免 mock 数据 userId 冲突污染账户名）
  const regByUser = new Map();
  eventRegistrationsList.forEach(r => {
    if (!r.userId) return;
    if (!regByUser.has(r.userId)) regByUser.set(r.userId, []);
    regByUser.get(r.userId).push(r);
  });
  regByUser.forEach((regs, uid) => {
    const exist = map.get(uid);
    put({
      userId: uid,
      regCount: regs.length,
      // 仅当该用户无账户档案时才用报名信息兜底身份（如仅报名的游客）
      ...(exist ? {} : { name: regs[0].name, email: regs[0].email, investorNo: regs[0].investorNo || getInvestorNo(uid), kycStatus: KYC_STATUS.NOT_STARTED, piStatus: PI_STATUS.NOT_SUBMITTED }),
      sources: ['registration'],
    });
  });

  // 4. 申购者（投资维度：申购笔数 + 累计意向金额——只补计数，不覆盖身份）
  const subByUser = new Map();
  subscriptions.forEach(s => {
    if (!s.userId) return;
    if (!subByUser.has(s.userId)) subByUser.set(s.userId, []);
    subByUser.get(s.userId).push(s);
  });
  subByUser.forEach((subs, uid) => {
    const exist = map.get(uid);
    put({
      userId: uid,
      subCount: subs.length,
      subTotal: subs.reduce((acc, s) => acc + (s.amount || 0), 0),
      ...(exist ? {} : { name: subs[0].investorName, investorNo: subs[0].investorNo || getInvestorNo(uid), kycStatus: KYC_STATUS.NOT_STARTED, piStatus: PI_STATUS.NOT_SUBMITTED }),
      sources: ['subscription'],
    });
  });

  // 5. 持仓（mock holdings 为当前用户视角，仅 u1 有值）
  if (holdings.length > 0) {
    const cur = map.get(currentUser.id);
    if (cur) cur.holdingCount = holdings.length;
  }

  return [...map.values()].map(u => {
    const mgr = getManagerForUser(u.userId);
    // 2026-08-14：PI EXPIRED 派生——已认证但 expiresAt 已过 → 过期（需重认证）
    let piStatus = u.piStatus || PI_STATUS.NOT_SUBMITTED;
    if (piStatus === PI_STATUS.APPROVED && u.piExpiry) {
      const t = new Date(u.piExpiry.replace(' ', 'T')).getTime();
      if (!Number.isNaN(t) && t < Date.now()) piStatus = PI_STATUS.EXPIRED;
    }
    return {
      ...u,
      piStatus,
      regCount: u.regCount || 0,
      subCount: u.subCount || 0,
      subTotal: u.subTotal || 0,
      holdingCount: u.holdingCount || 0,
      managerId: mgr?.id || null,
      managerName: mgr?.name || '—',
      disabled: disabledUserIds.has(u.userId),
      registeredAt: u.registeredAt || '—',
    };
  });
}

// ========== 我的客户（2026-08-15 · 专属顾问工作视图） ==========
// 顾问的工作单元 = 客户（人），不是模块——名下客户跨模块任务聚合（服务断点：客户从线索进入
// 申购/资金/投后阶段后，顾问看不到自己客户在干什么/有什么要催。本视图 = 顾问的客户工作台）
export function getClientTasks(userId) {
  const subs = subscriptions.filter(s => s.userId === userId);
  const pendingSign = subs.filter(s => s.status === 'allocated').length; // 客户经理跟进中
  // 退出分配（事件驱动）：事件为项目级无 userId，按持仓项目关联（mock holdings 即当前客户视角，2026-08-21 重构）
  const myProjectIds = new Set(holdings.map(h => h.projectId));
  const pendingFunds = [
    ...depositRequests.filter(r => r.userId === userId && r.status === 'pending'),
    ...withdrawRequests.filter(r => r.userId === userId && r.status === 'pending'),
    ...exitEvents.filter(ev => (ev.status === 'announced' || ev.status === 'paying') && myProjectIds.has(ev.projectId)),
  ].length; // 资金/退出分配待办（平台审核职责，非顾问任务）
  const lead = getLeadClients().find(c => c.userId === userId); // 线索跟进状态（仅报名过的客户有）
  const leadStatus = lead ? (lead.leadStatus || 'new') : null;
  const pendingLead = lead && leadStatus && !['converted', 'paused'].includes(leadStatus) ? 1 : 0; // 待跟进线索
  return {
    pendingSign, pendingFunds, leadStatus, pendingLead,
    // 顾问待办口径（资金审批由运营/合规处理，非顾问任务）
    hasTask: pendingSign > 0 || pendingLead > 0,
  };
}

// 名下客户 userId 集合（专属顾问 = 分配了该顾问的账户；单一真源 userAccountManagers）
export function getMyClientUserIds(managerId) {
  if (!managerId) return new Set();
  return new Set(getInvestorUsers().filter(u => u.managerId === managerId).map(u => u.userId));
}

// 分配专属顾问（账户级属性：用户管理入口；报名通过 userId 派生自动跟随）
export function assignAccountManager(userId, managerId, operator = '') {
  const u = getInvestorUsers().find(x => x.userId === userId);
  if (!u || !accountManagers.some(m => m.id === managerId)) return { ok: false, error: '用户或顾问不存在' };
  const oldMgr = getManagerForUser(userId)?.name || '未分配';
  const newMgr = accountManagers.find(m => m.id === managerId).name;
  userAccountManagers[userId] = managerId;
  logAudit({ operator: operator || '系统', category: 'user', action: 'assign', target: u.name, targetId: userId, note: `专属顾问：${oldMgr} → ${newMgr}` });
  Storage.save();
  return { ok: true };
}

// 禁用 / 启用账户（风控动作：确认态执行；禁用 = 冻结登录与操作，接后端服务端校验）
export function toggleUserDisabled(userId, operator = '') {
  const u = getInvestorUsers().find(x => x.userId === userId);
  if (!u) return { ok: false, error: '用户不存在' };
  const disabled = disabledUserIds.has(userId);
  if (disabled) disabledUserIds.delete(userId); else disabledUserIds.add(userId);
  logAudit({ operator: operator || '系统', category: 'user', action: disabled ? 'enable' : 'disable', target: u.name, targetId: userId, note: disabled ? '恢复启用账户' : '禁用账户（风控冻结）' });
  Storage.save();
  return { ok: true, disabled: !disabled };
}

export function getPendingKyc() {
  return kycSubmissions.filter(k => k.status === KYC_STATUS.PENDING_REVIEW);
}

export function approveKycSubmission(kid, operator = '系统') {
  const k = kycSubmissions.find(x => x.id === kid);
  if (!k || k.status !== KYC_STATUS.PENDING_REVIEW) return false;
  k.status = KYC_STATUS.APPROVED;
  k.history = k.history || [];
  k.history.push({ at: formatNow(), operator, action: 'approved', note: '审核通过' });
  // 同步用户侧（userId 关联；mock 下 currentUser 是唯一真实用户，接后端按真实账户同步）
  // 2026-08-14：KYC 通过只代表实名认证，不再自动置 PI——PI 是独立审核流（AdminPI），需单独申报+核验
  if (k.userId && currentUser.id === k.userId) {
    currentUser.kyc_status = KYC_STATUS.APPROVED;
  }
  pushNotification({
    type: 'service',
    title: 'KYC 审核通过',
    body: `${k.name} 的专业投资者认证已通过，可正常使用平台服务。`,
  });
  logAudit({ operator, category: 'kyc', action: 'approve', target: k.name, targetId: kid, note: 'KYC 审核通过（专业投资者认证）' });
  Storage.save();
  return true;
}

export function rejectKycSubmission(kid, reason, operator = '系统') {
  const k = kycSubmissions.find(x => x.id === kid);
  if (!k || k.status !== KYC_STATUS.PENDING_REVIEW) return false;
  k.status = KYC_STATUS.REJECTED;
  k.rejectReason = reason || '资料不完整';
  k.history = k.history || [];
  k.history.push({ at: formatNow(), operator, action: 'rejected', note: k.rejectReason });
  // 同步用户侧（userId 关联；接后端按真实账户同步）
  if (k.userId && currentUser.id === k.userId) {
    currentUser.kyc_status = KYC_STATUS.REJECTED;
    currentUser.kyc_profile.rejectReason = k.rejectReason;
  }
  pushNotification({
    type: 'service',
    title: 'KYC 审核未通过',
    body: `${k.name} 的认证资料未通过审核，原因：${k.rejectReason}。`,
  });
  logAudit({ operator, category: 'kyc', action: 'reject', target: k.name, targetId: kid, note: `拒绝原因：${k.rejectReason}` });
  Storage.save();
  return true;
}

// 退回补件（2026-08-13 P1 补件状态机）：PENDING_REVIEW → REQUIRES_ACTION，原因必填；
// 用户侧 KYCSubmitted 显示"材料需补充 + 原因 + 重新提交"，重提后回 PENDING_REVIEW
export function requireKycAction(kid, reason, operator = '系统') {
  const k = kycSubmissions.find(x => x.id === kid);
  if (!k || k.status !== KYC_STATUS.PENDING_REVIEW) return false;
  if (!reason || !reason.trim()) return false;
  k.status = KYC_STATUS.REQUIRES_ACTION;
  k.rejectReason = reason.trim(); // 补件原因（复用 rejectReason 字段：拒绝/补件共用"未通过原因"展示位）
  k.history = k.history || [];
  k.history.push({ at: formatNow(), operator, action: 'requires_action', note: k.rejectReason });
  // 同步用户侧（mock 单真实用户；接后端按真实账户同步）
  if (k.userId && currentUser.id === k.userId) {
    currentUser.kyc_status = KYC_STATUS.REQUIRES_ACTION;
    currentUser.kyc_profile.rejectReason = k.rejectReason;
  }
  pushNotification({
    type: 'service',
    title: 'KYC 材料需补充',
    body: `${k.name} 的认证资料需补充：${k.rejectReason}。请登录后在认证状态页查看并重新提交。`,
  });
  logAudit({ operator, category: 'kyc', action: 'requires_action', target: k.name, targetId: kid, note: `补件原因：${k.rejectReason}` });
  Storage.save();
  return true;
}

// 模拟银行转账回单 SVG（2026-08-20 凭证可查看：财务审核需核对回单金额/参考号，原型阶段用 SVG 模拟回单；接后端由真实上传文件 URL 替换）
export function makeReceiptSvg({ bank = '汇丰银行', orderNo = '', refNo = '', amount = 0, currency = 'HKD', time = '' } = {}) {
  const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const sym = currency === 'USD' ? '$' : currency === 'CNY' ? '¥' : 'HK$';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="460" viewBox="0 0 760 460">
  <rect width="760" height="460" fill="#ffffff"/>
  <rect x="14" y="14" width="732" height="432" fill="none" stroke="#d8dee6" stroke-width="1.5"/>
  <text x="34" y="52" font-family="Arial, 'Helvetica Neue', sans-serif" font-size="22" font-weight="700" fill="#14171f">${bank}</text>
  <text x="726" y="52" font-family="Arial, 'Helvetica Neue', sans-serif" font-size="12" fill="#8a919c" text-anchor="end">电子转账回单</text>
  <text x="34" y="92" font-family="Arial, 'Helvetica Neue', sans-serif" font-size="13" fill="#8a919c">回单号</text>
  <text x="726" y="92" font-family="Arial, 'Helvetica Neue', sans-serif" font-size="13" fill="#14171f" text-anchor="end">${refNo}</text>
  <line x1="34" y1="108" x2="726" y2="108" stroke="#eceff3" stroke-width="1"/>
  <text x="380" y="196" font-family="Arial, 'Helvetica Neue', sans-serif" font-size="14" fill="#8a919c" text-anchor="middle">到账金额</text>
  <text x="380" y="248" font-family="Arial, 'Helvetica Neue', sans-serif" font-size="40" font-weight="700" fill="#14171f" text-anchor="middle">${sym}${fmt(amount)}</text>
  <text x="380" y="282" font-family="Arial, 'Helvetica Neue', sans-serif" font-size="13" fill="#8a919c" text-anchor="middle">交易时间 ${time}</text>
  <line x1="34" y1="304" x2="726" y2="304" stroke="#eceff3" stroke-width="1"/>
  <text x="34" y="336" font-family="Arial, 'Helvetica Neue', sans-serif" font-size="13" fill="#8a919c">付款人</text>
  <text x="150" y="336" font-family="Arial, 'Helvetica Neue', sans-serif" font-size="13" fill="#14171f">申请人（投资人）</text>
  <text x="420" y="336" font-family="Arial, 'Helvetica Neue', sans-serif" font-size="13" fill="#8a919c">收款人</text>
  <text x="530" y="336" font-family="Arial, 'Helvetica Neue', sans-serif" font-size="13" fill="#14171f">${platformBrand.nameZh}（持牌平台）</text>
  <text x="34" y="368" font-family="Arial, 'Helvetica Neue', sans-serif" font-size="13" fill="#8a919c">币种</text>
  <text x="150" y="368" font-family="Arial, 'Helvetica Neue', sans-serif" font-size="13" fill="#14171f">${currency}</text>
  <text x="420" y="368" font-family="Arial, 'Helvetica Neue', sans-serif" font-size="13" fill="#8a919c">关联单号</text>
  <text x="530" y="368" font-family="Arial, 'Helvetica Neue', sans-serif" font-size="13" fill="#14171f">${orderNo}</text>
  <g transform="rotate(-28 680 84)">
    <text x="680" y="84" font-family="Arial, 'Helvetica Neue', sans-serif" font-size="34" font-weight="700" fill="#e8ecf1">DEMO</text>
  </g>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// 凭证预览兜底：老快照 evidence 无 preview 字段时按请求数据动态生成（渲染层统一使用，保证任何历史数据可查看）
export function getEvidencePreview(req) {
  if (!req || !req.evidence) return '';
  if (req.evidence.preview) return req.evidence.preview;
  return makeReceiptSvg({ bank: req.bank, orderNo: req.orderNo, refNo: req.bankRef, amount: req.amount, currency: req.currency, time: req.createdAt });
}

// 充值申请（入金）：前台提交申请 → 后台确认到账
export const depositRequests = [
  {
    id: 'dr1',
    orderNo: genOrderNo('DR', '2026-08-12 09:15:22'),
    userId: 'u1',
    userName: '张三',
    currency: 'HKD',
    amount: 3000000,
    method: '银行转账',
    bank: '汇丰银行',
    cardNo: '6222 0234 5678 4567',
    bankRef: 'BK20260812091522001',
    evidence: { name: '转账凭证_20260812.png', size: '1.2 MB', uploadedAt: '2026-08-12 09:16:01', preview: makeReceiptSvg({ bank: '汇丰银行', orderNo: genOrderNo('DR', '2026-08-12 09:15:22'), refNo: 'BK20260812091522001', amount: 3000000, currency: 'HKD', time: '2026-08-12 09:15:22' }) },   // 转账凭证（2026-08-19 线下充值凭证核销）
    status: 'pending',
    createdAt: '2026-08-12 09:15:22',
    handledAt: null,
    handledBy: null,
    rejectReason: null,
    requestEvidenceReason: null,
  },
  {
    id: 'dr5',
    orderNo: genOrderNo('DR', '2026-08-12 11:40:33'),
    userId: 'u1',
    userName: '张三',
    currency: 'HKD',
    amount: 1500000,
    method: '银行转账',
    bank: '汇丰银行',
    cardNo: '6222 0234 5678 4567',
    bankRef: 'BK20260812114033001',
    evidence: { name: '转账凭证_20260812.png', size: '0.8 MB', uploadedAt: '2026-08-12 11:41:05', preview: makeReceiptSvg({ bank: '汇丰银行', orderNo: genOrderNo('DR', '2026-08-12 11:40:33'), refNo: 'BK20260812114033001', amount: 1500000, currency: 'HKD', time: '2026-08-12 11:40:33' }) },
    status: 'requires_evidence',   // 异常态：财务核对时凭证模糊，要求补传（2026-08-19）
    createdAt: '2026-08-12 11:40:33',
    handledAt: '2026-08-12 14:02:11',
    handledBy: '系统管理员',
    rejectReason: null,
    requestEvidenceReason: '凭证模糊，请补传清晰的转账凭证',
  },
  {
    id: 'dr2',
    orderNo: genOrderNo('DR', '2026-08-11 14:32:08'),
    userId: 'u13',
    userName: '吴世昌',
    currency: 'USD',
    amount: 200000,
    method: '银行转账',
    bank: '中国银行（香港）',
    cardNo: '6217 8501 2345 8901',
    bankRef: 'BK20260811143208001',
    status: 'approved',
    createdAt: '2026-08-11 14:32:08',
    handledAt: '2026-08-11 15:02:11',
    handledBy: '系统管理员',
    rejectReason: null,
  },
  {
    id: 'dr3',
    orderNo: genOrderNo('DR', '2026-08-10 10:05:44'),
    userId: 'u17',
    userName: '刘倩',
    currency: 'CNY',
    amount: 1000000,
    method: '银行转账',
    bank: '中国银行（香港）',
    cardNo: '6217 8501 2345 8901',
    bankRef: 'BK20260810100544001',
    status: 'approved',
    createdAt: '2026-08-10 10:05:44',
    handledAt: '2026-08-10 10:18:30',
    handledBy: '系统管理员',
    rejectReason: null,
  },
  {
    id: 'dr4',
    orderNo: genOrderNo('DR', '2026-08-09 16:48:20'),
    userId: 'u21',
    userName: '赵明轩',
    currency: 'HKD',
    amount: 500000,
    method: '银行转账',
    bank: '汇丰银行',
    cardNo: '6222 0234 5678 4567',
    bankRef: 'BK20260809164820001',
    status: 'rejected',
    createdAt: '2026-08-09 16:48:20',
    handledAt: '2026-08-10 09:30:00',
    handledBy: '系统管理员',
    rejectReason: '未查询到该笔入账，金额或参考号不符',
  },
  // ===== 2026-08-20 入金核销体验数据（会议纪要增量①：修改实际到账金额）=====
  // 6 条待处理覆盖多币种/多通道/多银行，供后台财务现场核销改实际到账金额；2 条已通过含 actualAmount 展示差异留痕
  {
    id: 'dr6',
    orderNo: genOrderNo('DR', '2026-08-20 09:08:41'),
    userId: 'u31',
    userName: '陈志远',
    currency: 'HKD',
    amount: 5000000,
    method: '银行转账',
    bank: '汇丰银行',
    cardNo: '6222 0234 5678 4567',
    bankRef: 'BK20260820090841001',
    evidence: { name: '转账凭证_20260820.png', size: '1.8 MB', uploadedAt: '2026-08-20 09:09:12', preview: makeReceiptSvg({ bank: '汇丰银行', orderNo: genOrderNo('DR', '2026-08-20 09:08:41'), refNo: 'BK20260820090841001', amount: 5000000, currency: 'HKD', time: '2026-08-20 09:08:41' }) },
    status: 'pending',
    createdAt: '2026-08-20 09:08:41',
    handledAt: null,
    handledBy: null,
    rejectReason: null,
    requestEvidenceReason: null,
  },
  {
    id: 'dr7',
    orderNo: genOrderNo('DR', '2026-08-20 10:22:15'),
    userId: 'u32',
    userName: '林雅婷',
    currency: 'USD',
    amount: 150000,
    method: '银行转账',
    bank: '中国银行（香港）',
    cardNo: '6217 8501 2345 8901',
    bankRef: 'BK20260820102215001',
    evidence: { name: '转账凭证_20260820.jpg', size: '0.9 MB', uploadedAt: '2026-08-20 10:22:48', preview: makeReceiptSvg({ bank: '中国银行（香港）', orderNo: genOrderNo('DR', '2026-08-20 10:22:15'), refNo: 'BK20260820102215001', amount: 150000, currency: 'USD', time: '2026-08-20 10:22:15' }) },
    status: 'pending',
    createdAt: '2026-08-20 10:22:15',
    handledAt: null,
    handledBy: null,
    rejectReason: null,
    requestEvidenceReason: null,
  },
  {
    id: 'dr8',
    orderNo: genOrderNo('DR', '2026-08-20 11:45:03'),
    userId: 'u33',
    userName: '王启明',
    currency: 'HKD',
    amount: 800000,
    method: 'eDDA 快捷入金',   // eDDA 通道无需上传凭证
    bank: '星展银行',
    cardNo: '6565 9001 2345 6789',
    bankRef: 'EDDA20260820114503001',
    evidence: null,
    status: 'pending',
    createdAt: '2026-08-20 11:45:03',
    handledAt: null,
    handledBy: null,
    rejectReason: null,
    requestEvidenceReason: null,
  },
  {
    id: 'dr9',
    orderNo: genOrderNo('DR', '2026-08-20 13:30:56'),
    userId: 'u34',
    userName: '周慧敏',
    currency: 'CNY',
    amount: 2000000,
    method: '银行转账',
    bank: '中国银行（香港）',
    cardNo: '6217 8501 2345 8901',
    bankRef: 'BK20260820133056001',
    evidence: { name: '转账凭证_20260820.png', size: '1.1 MB', uploadedAt: '2026-08-20 13:31:20', preview: makeReceiptSvg({ bank: '中国银行（香港）', orderNo: genOrderNo('DR', '2026-08-20 13:30:56'), refNo: 'BK20260820133056001', amount: 2000000, currency: 'CNY', time: '2026-08-20 13:30:56' }) },
    status: 'pending',
    createdAt: '2026-08-20 13:30:56',
    handledAt: null,
    handledBy: null,
    rejectReason: null,
    requestEvidenceReason: null,
  },
  {
    id: 'dr10',
    orderNo: genOrderNo('DR', '2026-08-19 15:12:40'),
    userId: 'u9',
    userName: '吴世昌',
    currency: 'HKD',
    amount: 6000000,
    method: '银行转账',
    bank: '中国银行（香港）',
    cardNo: '6217 8501 2345 8901',
    bankRef: 'BK20260819151240001',
    evidence: { name: '转账凭证_20260819.png', size: '1.5 MB', uploadedAt: '2026-08-19 15:13:02', preview: makeReceiptSvg({ bank: '中国银行（香港）', orderNo: genOrderNo('DR', '2026-08-19 15:12:40'), refNo: 'BK20260819151240001', amount: 6000000, currency: 'HKD', time: '2026-08-19 15:12:40' }) },
    status: 'approved',
    actualAmount: 6000000,   // 金额一致：直接确认，无需修改（历史核销留痕）
    createdAt: '2026-08-19 15:12:40',
    handledAt: '2026-08-19 16:02:11',
    handledBy: '系统管理员',
    rejectReason: null,
    requestEvidenceReason: null,
  },
  {
    id: 'dr11',
    orderNo: genOrderNo('DR', '2026-08-19 14:08:33'),
    userId: 'u17',
    userName: '刘倩',
    currency: 'USD',
    amount: 300000,
    method: '银行转账',
    bank: '中国银行（香港）',
    cardNo: '6217 8501 2345 8901',
    bankRef: 'BK20260819140833001',
    evidence: { name: '转账凭证_20260819.jpg', size: '1.0 MB', uploadedAt: '2026-08-19 14:09:05', preview: makeReceiptSvg({ bank: '中国银行（香港）', orderNo: genOrderNo('DR', '2026-08-19 14:08:33'), refNo: 'BK20260819140833001', amount: 300000, currency: 'USD', time: '2026-08-19 14:08:33' }) },
    status: 'approved',
    actualAmount: 298750,    // 实际到账与登记金额有差异（汇率差/手续费）：核销时修改后上账（历史差异留痕）
    createdAt: '2026-08-19 14:08:33',
    handledAt: '2026-08-19 15:30:22',
    handledBy: '系统管理员',
    rejectReason: null,
    requestEvidenceReason: null,
  },
];

// 充值申请（入金）：用户线下转账到平台收款账户 → 上传凭证 → 财务核对后上账（2026-08-19 老板确认线下充值闭环）
// 通道：① 银行转账（线下转 + 上传凭证）② eDDA 快捷入金（授权扣款，简化演示）
// 前置：付款银行卡须已过白名单验证（≥1万 HKD 或等值 USD）
export function submitDepositRequest({ currency, amount, method, cardId, bank, cardNo, evidence, refNo }) {
  const key = walletKeyOf(currency) || currency.toLowerCase();
  const w = wallet[key];
  if (!w || !amount || amount <= 0) return false;
  // 白名单校验：充值付款卡必须是已验证白名单卡
  const card = bankCards.find(c => c.id === cardId);
  if (!card || card.whitelistStatus !== 'verified') return false;
  const isEdda = method === 'eDDA';
  if (!isEdda && !(evidence && evidence.name)) return false; // 银行转账模式必须上传凭证
  const orderNo = genOrderNo('DR');
  const genRef = (isEdda ? 'EDDA' : 'BK') + Date.now();   // 外部单号：银行电汇/eDDA 参考号（mock 演示值，接后端由银行回执替换）
  const req = {
    id: `dr${Date.now()}`,
    orderNo,
    userId: currentUser.id,
    userName: currentUser.name,
    currency,
    amount,
    method: isEdda ? 'eDDA 快捷入金' : '银行转账',
    bank: card.bank || '',
    cardNo: card.cardNo || '',   // 完整卡号（用户侧从 bankCards 选择传完整号；审核抽屉授权查看）
    bankRef: genRef,
    evidence: isEdda ? null : (evidence ? { ...evidence, preview: makeReceiptSvg({ bank: card.bank, orderNo, refNo: genRef, amount, currency, time: formatNow() }) } : null),   // 转账凭证（eDDA 通道无需凭证；preview 为模拟回单，接后端由真实文件 URL 替换）
    status: 'pending',
    createdAt: formatNow(),
    handledAt: null,
    handledBy: null,
    rejectReason: null,
    requestEvidenceReason: null,
  };
  depositRequests.unshift(req);
  pushNotification({
    type: 'wallet',
    title: isEdda ? '入金申请已提交（eDDA）' : '入金申请已提交',
    body: `${w.label}入金 ${w.symbol}${amount.toLocaleString()} 已提交，待财务核对${isEdda ? '（eDDA 扣款）' : '凭证'}后上账。`,
  });
  logAudit({ operator: currentUser.name || '投资人', category: 'fund', action: 'apply', target: '', targetId: req.id, note: `提交入金申请 ${w.symbol}${amount.toLocaleString()}（${isEdda ? 'eDDA' : '银行转账+凭证'}）` });
  Storage.save();
  return true;
}

// 后台确认到账：更新余额 + 交易记录 + 通知
// 后台确认入金到账：实际到账金额为强制审核点（2026-08-19 会议纪要增量 → 2026-08-20 方案 B 定稿）：
// 财务必须显式确认银行实际到账金额（UI 不预填登记金额，按银行流水/回单手工录入，配「与登记一致」快捷按钮），不允许留空兜底登记金额——防账实不符与内控空转
export function approveDepositRequest(reqId, { actualAmount, bankRef } = {}, operator = '') {
  const req = depositRequests.find(r => r.id === reqId);
  if (!req || req.status !== 'pending') return false;
  const w = walletAccountOf(req.currency);
  if (!w) return false;
  const credited = Number(actualAmount);
  if (!Number.isFinite(credited) || credited <= 0) return false; // 实际到账必须为有效正数，拒绝无效/缺失值
  // 按单据归属记账：演示账户走全局钱包，其他客户只更各自账户（护栏见 applyWalletDelta）
  const moved = applyWalletDelta(req.userId, req.currency, credited);
  if (!moved.ok) return false;
  if (moved.self) updateLatestTotal(toHkd(req.currency, credited));
  const ref = bankRef || `REF${Date.now()}`;
  req.actualAmount = credited;
  req.bankRef = ref;
  req.status = 'approved';
  req.handledAt = formatNow();
  req.handledBy = operator || '运营后台';
  const diffNote = credited !== req.amount ? `（登记 ${w.symbol}${req.amount.toLocaleString()} → 实际 ${w.symbol}${credited.toLocaleString()}）` : '';
  if (moved.self) {
    transactions.unshift({
      id: `t${Date.now()}`,
      orderNo: genOrderNo('TX'),
      type: 'deposit',
      amount: credited,
      currency: req.currency,
      status: 'completed',
      createdAt: formatNow(),
      method: req.method,
      reference: ref,
    });
  }
  // T10 异常检测：入金核销事件触发（R001 单笔大额入金 / R004 频繁入金）
  runAnomalyDetection(req.userId, 'deposit', { amount: credited, date: formatNow() });
  // T11 PEP 交易监控：PEP 客户入金自动标记（含跨境入金）
  runPepMonitoring(req.userId, 'deposit', { amount: credited, currency: req.currency, crossBorder: req.method === '跨境电汇' });
  pushNotification({
    type: 'wallet',
    title: '入金到账',
    body: `${w.label}入金 ${w.symbol}${credited.toLocaleString()} 已确认到账，可用资金已更新。`,
  }, req.userId);
  logAudit({ operator: operator || '运营后台', category: 'fund', action: 'approve', target: req.userName, targetId: reqId, note: `充值确认到账 ${w.symbol}${credited.toLocaleString()}${diffNote}` });
  Storage.save();
  return true;
}

export function rejectDepositRequest(reqId, reason, operator = '') {
  const req = depositRequests.find(r => r.id === reqId);
  if (!req || req.status !== 'pending') return false;
  req.status = 'rejected';
  req.handledAt = formatNow();
  req.handledBy = operator || '运营后台';
  req.rejectReason = reason || '未说明原因';
  pushNotification({
    type: 'wallet',
    title: '入金申请未通过',
    body: `您的入金申请未通过审核：${req.rejectReason}`,
  }, req.userId);
  logAudit({ operator: operator || '运营后台', category: 'fund', action: 'reject', target: req.userName, targetId: reqId, note: `充值申请拒绝：${req.rejectReason}` });
  Storage.save();
  return true;
}

// 财务要求补传凭证（异常态：凭证模糊/缺失/金额不符待核实 → requires_evidence，2026-08-19 线下充值异常处理）
export function requestDepositEvidence(reqId, reason, operator = '') {
  const req = depositRequests.find(r => r.id === reqId);
  if (!req || req.status !== 'pending') return false;
  req.status = 'requires_evidence';
  req.requestEvidenceReason = reason || '请补传清晰的转账凭证';
  req.handledAt = formatNow();
  req.handledBy = operator || '运营后台';
  pushNotification({
    type: 'wallet',
    title: '入金凭证待补传',
    body: `您的入金申请需补传凭证：${req.requestEvidenceReason}`,
  });
  logAudit({ operator: operator || '运营后台', category: 'fund', action: 'reject', target: req.userName, targetId: reqId, note: `要求补传入金凭证：${req.requestEvidenceReason}` });
  Storage.save();
  return true;
}

// 用户补传凭证（requires_evidence → pending，回到财务核对队列）
export function submitDepositEvidence(reqId, evidence) {
  const req = depositRequests.find(r => r.id === reqId);
  if (!req || req.status !== 'requires_evidence') return false;
  if (!evidence || !evidence.name) return false;
  req.evidence = { ...evidence, preview: makeReceiptSvg({ bank: req.bank, orderNo: req.orderNo, refNo: req.bankRef, amount: req.amount, currency: req.currency, time: req.createdAt }) };
  req.requestEvidenceReason = null;
  req.status = 'pending';
  req.handledAt = null;
  req.handledBy = null;
  pushNotification({
    type: 'wallet',
    title: '凭证已补传',
    body: `入金 ${req.currency} ${req.amount.toLocaleString()} 凭证已补传，等待财务核对。`,
  });
  logAudit({ operator: currentUser.name || '投资人', category: 'fund', action: 'apply', target: '', targetId: req.id, note: `补传入金凭证：${evidence.name}` });
  Storage.save();
  return true;
}

// 提现申请（出金）：前台提交申请 → 后台审核 → 打款
export const withdrawRequests = [
  {
    id: 'wr1',
    orderNo: genOrderNo('WR', '2026-08-12 10:05:47'),
    userId: 'u1',
    userName: '张三',
    currency: 'HKD',
    amount: 500000,
    method: '银行转账',
    bank: '汇丰银行',
    cardNo: '6222 0234 5678 4567',
    bankRef: 'BK20260812100547001',
    status: 'pending',
    createdAt: '2026-08-12 10:05:47',
    handledAt: null,
    handledBy: null,
    rejectReason: null,
  },
  {
    id: 'wr2',
    orderNo: genOrderNo('WR', '2026-08-11 11:22:36'),
    userId: 'u13',
    userName: '吴世昌',
    currency: 'HKD',
    amount: 800000,
    method: '银行转账',
    bank: '汇丰银行',
    cardNo: '6222 0234 5678 4567',
    bankRef: 'BK20260811112236001',
    status: 'approved',
    createdAt: '2026-08-11 11:22:36',
    handledAt: '2026-08-11 13:40:00',
    handledBy: '系统管理员',
    rejectReason: null,
  },
  {
    id: 'wr3',
    orderNo: genOrderNo('WR', '2026-08-10 09:11:52'),
    userId: 'u17',
    userName: '刘倩',
    currency: 'HKD',
    amount: 2000000,
    method: '银行转账',
    bank: '中国银行（香港）',
    cardNo: '6217 8501 2345 8901',
    bankRef: 'BK20260810091152001',
    status: 'approved',
    createdAt: '2026-08-10 09:11:52',
    handledAt: '2026-08-10 09:45:20',
    handledBy: '系统管理员',
    rejectReason: null,
  },
  {
    id: 'wr4',
    orderNo: genOrderNo('WR', '2026-08-09 15:37:10'),
    userId: 'u25',
    userName: '郑国豪',
    currency: 'HKD',
    amount: 300000,
    method: '银行转账',
    bank: '汇丰银行',
    cardNo: '6222 0234 5678 4567',
    bankRef: 'BK20260809153710001',
    status: 'rejected',
    createdAt: '2026-08-09 15:37:10',
    handledAt: '2026-08-09 17:00:00',
    handledBy: '系统管理员',
    rejectReason: '收款账户信息不符',
  },
];

// 提现申请（出金）：用户申请 → 后台审核 → 打款（2026-08-19 白名单前置：收款卡须已过白名单验证）
export function submitWithdrawRequest({ currency, amount, method, cardId, bank, cardNo }) {
  if (getFreezeState().frozen) return false; // INV-5 凡动必冻：安全冻结期内阻断出金（数据层兜底）
  const key = walletKeyOf(currency) || currency.toLowerCase();
  const w = wallet[key];
  if (!w || !amount || amount <= 0) return false;
  if (amount > w.balance) return false;
  // 白名单校验：提现收款卡必须是已验证白名单卡
  const card = bankCards.find(c => c.id === cardId);
  if (!card || card.whitelistStatus !== 'verified') return false;
  const req = {
    id: `wr${Date.now()}`,
    orderNo: genOrderNo('WR'),
    userId: currentUser.id,
    userName: currentUser.name,
    currency,
    amount,
    method: method || '银行转账',
    bank: card.bank || '',
    cardNo: card.cardNo || '',
    bankRef: `BK${Date.now()}`,   // 外部单号：银行打款参考号（mock 演示值）
    status: 'pending',
    createdAt: formatNow(),
    handledAt: null,
    handledBy: null,
    rejectReason: null,
  };
  withdrawRequests.unshift(req);
  pushNotification({
    type: 'wallet',
    title: '提现申请已提交',
    body: `${w.label}提现 ${w.symbol}${amount.toLocaleString()} 已提交，待平台审核。`,
  });
  logAudit({ operator: currentUser.name || '投资人', category: 'fund', action: 'apply', target: '', targetId: req.id, note: `提交提现申请 ${w.symbol}${amount.toLocaleString()}` });
  Storage.save();
  return true;
}

export function approveWithdrawRequest(reqId, operator = '') {
  const req = withdrawRequests.find(r => r.id === reqId);
  if (!req || req.status !== 'pending') return false;
  const key = walletKeyOf(req.currency) || String(req.currency).toLowerCase();
  const w = wallet[key];
  if (!w) return false;
  // 余额校验按单据归属账户：其他客户不看演示账户余额；未建档客户不拦截（mock 无钱包）
  const owner = walletOwnerView(req.userId);
  const ownerBalance = owner.self ? w.balance : (owner.tracked ? (owner.account?.[key] ?? 0) : null);
  if (ownerBalance !== null && req.amount > ownerBalance) {
    req.status = 'rejected';
    req.rejectReason = '可用余额不足';
    req.handledAt = formatNow();
    req.handledBy = '运营后台';
    Storage.save();
    return false;
  }
  const moved = applyWalletDelta(req.userId, req.currency, -req.amount);
  if (!moved.ok) return false;
  if (moved.self) updateLatestTotal(-toHkd(req.currency, req.amount));
  if (moved.self) {
    transactions.unshift({
      id: `t${Date.now()}`,
      orderNo: genOrderNo('TX'),
      type: 'withdraw',
      amount: req.amount,
      currency: req.currency,
      status: 'completed',
      createdAt: formatNow(),
      method: req.method,
      reference: `REF${Date.now()}`,
    });
  }
  req.status = 'approved';
  req.handledAt = formatNow();
  req.handledBy = operator || '运营后台';
  // T10 异常检测：出金事件触发（R006 入出金倒挂）
  runAnomalyDetection(req.userId, 'withdraw', { amount: req.amount, date: formatNow() });
  pushNotification({
    type: 'wallet',
    title: '提现成功',
    body: `${w.label}提现 ${w.symbol}${req.amount.toLocaleString()} 已处理，资金将在 1-2 个工作日到账。`,
  }, req.userId);
  logAudit({ operator: operator || '运营后台', category: 'fund', action: 'approve', target: req.userName, targetId: reqId, note: `提现打款 ${w.symbol}${req.amount.toLocaleString()}` });
  Storage.save();
  return true;
}

export function rejectWithdrawRequest(reqId, reason, operator = '') {
  const req = withdrawRequests.find(r => r.id === reqId);
  if (!req || req.status !== 'pending') return false;
  req.status = 'rejected';
  req.handledAt = formatNow();
  req.handledBy = operator || '运营后台';
  req.rejectReason = reason || '未说明原因';
  pushNotification({
    type: 'wallet',
    title: '提现申请未通过',
    body: `您的提现申请未通过审核：${req.rejectReason}`,
  }, req.userId);
  logAudit({ operator: operator || '运营后台', category: 'fund', action: 'reject', target: req.userName, targetId: reqId, note: `提现申请拒绝：${req.rejectReason}` });
  Storage.save();
  return true;
}

// ========== 换汇申请（2026-08-19 老板确认：换汇由人工在银行内处理，不对客承诺时效与汇率） ==========
// 流程：用户提交申请（记录参考汇率）→ 后台确认银行换汇完成（按实际成交汇率上账）
// 提交时冻结卖出金额；处理完成解冻并划转；拒绝则解冻
export const exchangeRequests = [
  {
    id: 'er1',
    orderNo: genOrderNo('ER', '2026-08-12 15:20:11'),
    userId: 'u1',
    userName: '张三',
    fromCurrency: 'USD',
    toCurrency: 'HKD',
    amount: 100000,          // 卖出金额
    refRate: 7.81,           // 申请时参考汇率（1 USD = 7.81 HKD）
    expectedAmount: 781000,  // 按参考汇率估算（仅供参考，非承诺）
    actualRate: null,        // 银行实际成交汇率（后台处理时录入）
    actualAmount: null,      // 实际到账金额（后台处理时生成）
    bankRef: null,           // 银行换汇参考号
    status: 'pending',
    createdAt: '2026-08-12 15:20:11',
    handledAt: null,
    handledBy: null,
    rejectReason: null,
  },
];

// 提交换汇申请：校验卖出余额 + 冻结卖出金额（换汇处理中不得重复动用）
export function submitExchangeRequest({ from, to, amount }) {
  const fk = walletKeyOf(from) || String(from).toLowerCase();
  const tk = walletKeyOf(to) || String(to).toLowerCase();
  const wf = wallet[fk];
  const rate = exchangeRates[`${fk}-${tk}`];
  if (!wf || !rate || !amount || amount <= 0) return false;
  if (amount > wf.balance) return false;
  const expected = Math.round(amount * rate.rate * 100) / 100;
  const req = {
    id: `er${Date.now()}`,
    orderNo: genOrderNo('ER'),
    userId: currentUser.id,
    userName: currentUser.name,
    fromCurrency: from.toUpperCase(),
    toCurrency: to.toUpperCase(),
    amount,
    refRate: rate.rate,
    expectedAmount: expected,
    actualRate: null,
    actualAmount: null,
    bankRef: null,
    status: 'pending',
    createdAt: formatNow(),
    handledAt: null,
    handledBy: null,
    rejectReason: null,
  };
  wf.frozen = (wf.frozen || 0) + amount;   // 冻结卖出金额
  exchangeRequests.unshift(req);
  pushNotification({
    type: 'wallet',
    title: '换汇申请已提交',
    body: `${from.toUpperCase()} ${amount.toLocaleString()} → ${to.toUpperCase()} 换汇申请已提交，由人工在银行内处理，以实际成交汇率上账。`,
  });
  logAudit({ operator: currentUser.name || '投资人', category: 'fund', action: 'apply', target: '', targetId: req.id, note: `提交换汇申请 ${from.toUpperCase()} ${amount.toLocaleString()} → ${to.toUpperCase()}` });
  Storage.save();
  return true;
}

// 后台确认银行换汇完成：按实际成交汇率上账（from 解冻扣减、to 增加）+ 交易记录 + 通知
export function approveExchangeRequest(reqId, { actualRate, bankRef }, operator = '') {
  const req = exchangeRequests.find(r => r.id === reqId);
  if (!req || req.status !== 'pending') return false;
  const rate = Number(actualRate);
  if (!Number.isFinite(rate) || rate <= 0) return false;
  const fk = walletKeyOf(req.fromCurrency) || String(req.fromCurrency).toLowerCase();
  const tk = walletKeyOf(req.toCurrency) || String(req.toCurrency).toLowerCase();
  const wf = wallet[fk];
  const wt = wallet[tk];
  if (!wf || !wt) return false;
  // 处理时二次校验：可用余额足够（冻结仅防重复动用，不锁余额）
  if (req.amount > wf.balance) {
    req.status = 'rejected';
    req.rejectReason = '卖出币种余额不足，请重新申请';
    req.handledAt = formatNow();
    req.handledBy = operator || '运营后台';
    wf.frozen = Math.max(0, (wf.frozen || 0) - req.amount);
    Storage.save();
    return false;
  }
  const actual = Math.round(req.amount * rate * 100) / 100;
  const ref = bankRef || `FX${Date.now()}`;
  req.actualRate = rate;
  req.actualAmount = actual;
  req.bankRef = ref;
  req.status = 'approved';
  req.handledAt = formatNow();
  req.handledBy = operator || '运营后台';
  // 资金划转
  wf.balance -= req.amount;
  wf.frozen = Math.max(0, (wf.frozen || 0) - req.amount);
  wt.balance += actual;
  if (currentUser.account[fk] !== undefined) currentUser.account[fk] = wf.balance;
  if (currentUser.account[tk] !== undefined) currentUser.account[tk] = wt.balance;
  updateLatestTotal(-toHkd(req.fromCurrency, req.amount) + toHkd(req.toCurrency, actual));
  transactions.unshift({
    id: `t${Date.now()}`,
    orderNo: genOrderNo('TX'),
    type: 'exchange',
    amount: actual,
    currency: req.toCurrency,
    status: 'completed',
    createdAt: formatNow(),
    method: `${req.fromCurrency}→${req.toCurrency}`,
    reference: ref,
  });
  pushNotification({
    type: 'wallet',
    title: '换汇已完成',
    body: `${req.fromCurrency} ${req.amount.toLocaleString()} → ${req.toCurrency} ${actual.toLocaleString()} 已按银行实际成交汇率上账。`,
  });
  logAudit({ operator: operator || '运营后台', category: 'fund', action: 'approve', target: req.userName, targetId: reqId, note: `换汇完成：${req.fromCurrency} ${req.amount.toLocaleString()} → ${req.toCurrency} ${actual.toLocaleString()}（汇率 ${rate}）` });
  Storage.save();
  return true;
}

export function rejectExchangeRequest(reqId, reason, operator = '') {
  const req = exchangeRequests.find(r => r.id === reqId);
  if (!req || req.status !== 'pending') return false;
  const fk = walletKeyOf(req.fromCurrency) || String(req.fromCurrency).toLowerCase();
  const wf = wallet[fk];
  if (wf) wf.frozen = Math.max(0, (wf.frozen || 0) - req.amount);   // 解冻
  req.status = 'rejected';
  req.handledAt = formatNow();
  req.handledBy = operator || '运营后台';
  req.rejectReason = reason || '未说明原因';
  pushNotification({
    type: 'wallet',
    title: '换汇申请未通过',
    body: `您的换汇申请未通过：${req.rejectReason}`,
  });
  logAudit({ operator: operator || '运营后台', category: 'fund', action: 'reject', target: req.userName, targetId: reqId, note: `换汇申请拒绝：${req.rejectReason}` });
  Storage.save();
  return true;
}

// ========== 银行卡白名单验证（2026-08-19 老板确认：≥1万 HKD 或等值 USD 转账白名单前置） ==========
// 用户向平台收款账户转账验证款（附言标记）→ 财务核对到账 → 卡片置白名单（验证款计入可用余额）
export const verificationRequests = [
  {
    id: 'vr1',
    orderNo: genOrderNo('VR', '2026-08-12 13:00:00'),
    userId: 'u13',
    userName: '吴世昌',
    cardId: 'bc9',
    bank: '星展银行',
    maskedNo: '**** 7711',
    currency: 'HKD',
    amount: 10000,
    remark: '卡片白名单验证',
    bankRef: 'BK20260812130000001',
    status: 'pending',
    createdAt: '2026-08-12 13:00:00',
    handledAt: null,
    handledBy: null,
    rejectReason: null,
  },
  {
    id: 'vr2',
    orderNo: genOrderNo('VR', '2026-08-11 10:15:00'),
    userId: 'u17',
    userName: '刘倩',
    cardId: 'bc10',
    bank: '渣打银行',
    maskedNo: '**** 8834',
    currency: 'USD',
    amount: 2000,
    remark: '白名单验证 USD',
    bankRef: 'BK20260811101500001',
    status: 'approved',
    createdAt: '2026-08-11 10:15:00',
    handledAt: '2026-08-11 10:42:20',
    handledBy: '系统管理员',
    rejectReason: null,
  },
];

export function submitCardVerification({ cardId, currency, amount, remark }) {
  if (getFreezeState().frozen) return false; // INV-5 凡动必冻：冻结期内阻断出金账户（白名单）变更
  const card = bankCards.find(c => c.id === cardId);
  if (!card || card.whitelistStatus === 'verified') return false;
  if (!amount || amount <= 0) return false;
  const req = {
    id: `vr${Date.now()}`,
    orderNo: genOrderNo('VR'),
    userId: currentUser.id,
    userName: currentUser.name,
    cardId: card.id,
    bank: card.bank,
    maskedNo: card.maskedNo,
    currency,
    amount,
    remark: remark || '卡片白名单验证',
    bankRef: `BK${Date.now()}`,
    status: 'pending',
    createdAt: formatNow(),
    handledAt: null,
    handledBy: null,
    rejectReason: null,
  };
  verificationRequests.unshift(req);
  card.whitelistStatus = 'verifying';
  pushNotification({
    type: 'wallet',
    title: '白名单验证已提交',
    body: `${card.bank}（${card.maskedNo}）白名单验证已提交，请转账 ${currency} ${amount.toLocaleString()} 至平台收款账户并注明附言，财务核对到账后生效。`,
  });
  logAudit({ operator: currentUser.name || '投资人', category: 'fund', action: 'apply', target: '银行卡白名单', targetId: req.id, note: `发起白名单验证：${card.bank}（${card.maskedNo}）${currency} ${amount.toLocaleString()}` });
  Storage.save();
  return true;
}

// 财务确认验证款到账 → 卡片置白名单 + 验证款计入可用余额（2026-08-19 用户拍板方案：验证通过后计入余额）
export function approveCardVerification(reqId, operator = '') {
  const req = verificationRequests.find(r => r.id === reqId);
  if (!req || req.status !== 'pending') return false;
  const card = bankCards.find(c => c.id === req.cardId);
  if (!card) return false;
  const key = walletKeyOf(req.currency || 'HKD') || 'hkd';
  const w = wallet[key];
  if (!w) return false;
  w.balance += req.amount;
  if (currentUser.account[key] !== undefined) currentUser.account[key] = w.balance;
  updateLatestTotal(toHkd(req.currency, req.amount));
  card.whitelistStatus = 'verified';
  card.verifiedAt = formatNow();
  card.verifiedAmount = req.amount;
  transactions.unshift({
    id: `t${Date.now()}`,
    orderNo: genOrderNo('TX'),
    type: 'deposit',
    amount: req.amount,
    currency: req.currency,
    status: 'completed',
    createdAt: formatNow(),
    method: '白名单验证入金',
    reference: req.bankRef,
  });
  req.status = 'approved';
  req.handledAt = formatNow();
  req.handledBy = operator || '运营后台';
  pushNotification({
    type: 'wallet',
    title: '白名单验证通过',
    body: `${card.bank}（${card.maskedNo}）已加入资金白名单，验证款 ${w.symbol}${req.amount.toLocaleString()} 已计入可用余额。`,
  });
  logAudit({ operator: operator || '运营后台', category: 'fund', action: 'approve', target: card.bank, targetId: reqId, note: `白名单验证通过：${card.maskedNo}（${w.symbol}${req.amount.toLocaleString()} 计入余额）` });
  Storage.save();
  return true;
}

export function rejectCardVerification(reqId, reason, operator = '') {
  const req = verificationRequests.find(r => r.id === reqId);
  if (!req || req.status !== 'pending') return false;
  const card = bankCards.find(c => c.id === req.cardId);
  if (card) card.whitelistStatus = 'unverified';
  req.status = 'rejected';
  req.handledAt = formatNow();
  req.handledBy = operator || '运营后台';
  req.rejectReason = reason || '未查询到验证款到账';
  pushNotification({
    type: 'wallet',
    title: '白名单验证未通过',
    body: `${card ? card.bank : ''}（${req.maskedNo}）白名单验证未通过：${req.rejectReason}`,
  });
  logAudit({ operator: operator || '运营后台', category: 'fund', action: 'reject', target: req.userName, targetId: reqId, note: `白名单验证拒绝：${req.rejectReason}` });
  Storage.save();
  return true;
}

// 退出申请（持仓）：前台提交申请 → 后台审批 → 回款
// ========== 持仓退出 · 事件驱动分配（2026-08-21 重构）==========
// 第一性原理：PE 封闭式运作，LP 不存在"随时赎回"——份额变现的唯一路径是 GP/运营主导的退出事件
// （并购 / IPO 减持 / 股权回购 / 清算分配），LP 从"申请方"变为"确认方"。
// 状态机：announced(已公告·待投资人确认收款明细) → paying(打款中·LP已确认) → completed(已到账)
// 定价：运营录入每份对价；每份成本恒为 8000（shares=floor(amount/8000) 的既定事实），
//       收益 = max(0, 对价−8000)，Carry = 收益 × carryRate（缺省 20%），净回款 = 对价 − Carry。
const EXIT_COST_PER_SHARE = 8000;

export const EXIT_TYPE_META = {
  trade_sale: { label: '并购退出' },
  ipo: { label: 'IPO 减持' },
  buyback: { label: '股权回购' },
  liquidation: { label: '清算分配' },
};

// 盈亏拆分计算（本金 / 毛收益 / Carry / 净回款）
export function calcExitSplit(pricePerShare, shares, carryRate = '20%') {
  const gainPerShare = Math.max(0, pricePerShare - EXIT_COST_PER_SHARE);
  const rate = parseFloat(carryRate) / 100 || 0;
  const carryPerShare = gainPerShare * rate;
  return {
    costAmount: EXIT_COST_PER_SHARE * shares,
    grossAmount: pricePerShare * shares,
    gainAmount: gainPerShare * shares,
    carryAmount: Math.round(carryPerShare * shares),
    netAmount: Math.round((pricePerShare - carryPerShare) * shares),
  };
}

export const exitEvents = [
  {
    id: 'ee0', // 历史已完成事件（列表归档展示；对应持仓早已退出清空）
    orderNo: genOrderNo('EXT', '2026-06-30 10:20:00'),
    projectId: 'p5',
    projectName: 'Aurora FinTech',
    exitType: 'ipo',
    pricePerShare: 9000,
    totalShares: 400,
    grossAmount: 3600000,
    costAmount: 3200000,    // 8000 × 400
    gainAmount: 400000,     // (9000−8000) × 400
    carryRate: '20%',
    carryAmount: 80000,     // 40万 × 20%
    netAmount: 3520000,     // 360万 − 8万
    currency: 'HKD',
    status: 'completed',
    createdAt: '2026-06-30 10:20:00',
    confirmedAt: '2026-07-02 09:15:00',
    completedAt: '2026-07-09 14:30:00',
    handledBy: '王慧敏',
  },
  {
    id: 'ee1', // 进行中：GreenCell 并购退出，待张三确认收款明细
    orderNo: genOrderNo('EXT', '2026-08-19 15:40:00'),
    projectId: 'p4',
    projectName: 'GreenCell Energy',
    exitType: 'trade_sale',
    pricePerShare: 9600,
    totalShares: 375,
    grossAmount: 3600000,   // 9600 × 375
    costAmount: 3000000,    // 8000 × 375
    gainAmount: 600000,     // (9600−8000) × 375
    carryRate: '20%',
    carryAmount: 120000,    // 60万 × 20%
    netAmount: 3480000,     // 360万 − 12万
    currency: 'HKD',
    status: 'announced',
    createdAt: '2026-08-19 15:40:00',
    confirmedAt: null,
    completedAt: null,
    handledBy: '王慧敏',
  },
];

// 运营发起退出分配（GP 主导；项目下全部持仓一次性纳入分配）
export function createExitEvent({ projectId, exitType, pricePerShare }, operator = '') {
  const project = getProjectById(projectId);
  const hlds = holdings.filter(h => h.projectId === projectId);
  if (!project || hlds.length === 0) return { ok: false, error: '该项目暂无持仓，无法发起退出分配' };
  const price = Number(pricePerShare);
  if (!Number.isFinite(price) || price <= 0) return { ok: false, error: '请填写有效的每份退出对价' };
  if (!EXIT_TYPE_META[exitType]) return { ok: false, error: '请选择退出方式' };
  const totalShares = hlds.reduce((s, h) => s + h.shares, 0);
  const carryRate = '20%';
  const split = calcExitSplit(price, totalShares, carryRate);
  const ev = {
    id: `ee${Date.now()}`,
    orderNo: genOrderNo('EXT'),
    projectId,
    projectName: project.title,
    exitType,
    pricePerShare: price,
    totalShares,
    grossAmount: split.grossAmount,
    costAmount: split.costAmount,
    gainAmount: split.gainAmount,
    carryRate,
    carryAmount: split.carryAmount,
    netAmount: split.netAmount,
    currency: 'HKD',
    status: 'announced',
    createdAt: formatNow(),
    confirmedAt: null,
    completedAt: null,
    handledBy: operator || '运营后台',
  };
  exitEvents.unshift(ev);
  pushNotification({
    type: 'wallet',
    title: '退出分配公告',
    body: `${ev.projectName} 发起${EXIT_TYPE_META[exitType].label}：每份对价 HK$${price.toLocaleString()}，预计净回款 HK$${split.netAmount.toLocaleString()}（已计提 Carry ${carryRate}），请在持仓页确认收款明细。`,
  });
  logAudit({ operator: operator || '运营后台', category: 'exit', action: 'announce', target: ev.projectName, targetId: ev.id, note: `发起${EXIT_TYPE_META[exitType].label}：每份 HK$${price.toLocaleString()} × ${totalShares} 份，净回款 HK$${formatCurrency(split.netAmount)}（Carry ${carryRate}）` });
  Storage.save();
  return { ok: true, event: ev };
}

// 投资人确认收款明细（announced → paying；打款时效文案挂载点）
export function confirmExitEvent(eventId) {
  const ev = exitEvents.find(e => e.id === eventId);
  if (!ev || ev.status !== 'announced') return false;
  // 本人持有校验（mock 单用户视角：holdings 即 currentUser 持仓）
  if (!holdings.some(h => h.projectId === ev.projectId)) return false;
  ev.status = 'paying';
  ev.confirmedAt = formatNow();
  pushNotification({
    type: 'wallet',
    title: '退出分配已确认',
    body: `${ev.projectName} ${EXIT_TYPE_META[ev.exitType].label}收款明细已确认，平台将发起打款，预计 5-10 个工作日到账。`,
  });
  logAudit({ operator: currentUser.name || '投资人', category: 'exit', action: 'confirm', target: ev.projectName, targetId: ev.id, note: `确认收款明细（净回款 HK$${formatCurrency(ev.netAmount)}）` });
  Storage.save();
  return true;
}

// 运营确认到账并完成分配（paying → completed；回款 + 持仓移除 + 交易留痕 + 清算收尾联动）
export function completeExitEvent(eventId, operator = '') {
  const ev = exitEvents.find(e => e.id === eventId);
  if (!ev || ev.status !== 'paying') return false;
  const hlds = holdings.filter(h => h.projectId === ev.projectId);
  if (hlds.length === 0) return false;
  const w = wallet.hkd;
  let paidTotal = 0;
  hlds.forEach(h => {
    // 按登记册逐户结算（mock 仅当前用户有持仓；真实后端按项目登记册分发各持有人）
    const split = calcExitSplit(ev.pricePerShare, h.shares, ev.carryRate);
    w.balance += split.netAmount;
    paidTotal += split.netAmount;
    transactions.unshift({
      id: `t${Date.now()}-${h.id}`,
      orderNo: genOrderNo('TX'),
      type: 'exit',
      amount: split.netAmount,
      currency: h.currency || 'HKD',
      status: 'completed',
      createdAt: formatNow(),
      projectName: ev.projectName,
      method: `${EXIT_TYPE_META[ev.exitType].label} · 份额分配`,
      reference: ev.orderNo,
      note: `本金 HK$${formatCurrency(split.costAmount)} · 收益 HK$${formatCurrency(split.gainAmount)} · Carry(${ev.carryRate}) −HK$${formatCurrency(split.carryAmount)}`,
    });
  });
  currentUser.account.hkd = w.balance;
  for (let i = holdings.length - 1; i >= 0; i--) {
    if (holdings[i].projectId === ev.projectId) holdings.splice(i, 1);
  }
  ev.status = 'completed';
  ev.completedAt = formatNow();
  ev.handledBy = operator || '运营后台';
  pushNotification({
    type: 'wallet',
    title: '退出分配已完成',
    body: `${ev.projectName} 退出分配已完成，净回款 HK$${paidTotal.toLocaleString()} 已到账（本金及收益明细见交易记录）。`,
  });
  logAudit({ operator: operator || '运营后台', category: 'exit', action: 'complete', target: ev.projectName, targetId: ev.id, note: `确认到账并完成分配，净回款 HK$${formatCurrency(paidTotal)}（含 Carry 计提 HK$${formatCurrency(ev.carryAmount)}）` });
  Storage.save();
  return true;
}

// ========== 投后分红（2026-08-14 · 项目盈利分配：平台发起 → 按份额分配 → 审批发放回流账户） ==========
// 2026-10-22 RO 整改：分红粒度由 SPV 改为项目（去 SPV 概念）
// mock 单用户简化：发放对象 = currentUser 在该项目的持仓份额（接后端由真实账户体系按份额入账）
export const dividendRequests = [
  {
    id: 'dv1',
    orderNo: genOrderNo('DIV', '2026-08-13 10:00:00'),
    projectId: 'p4',
    projectName: 'GreenCell Energy',
    perShare: 1000,        // 每份分红金额（HKD）
    currency: 'HKD',
    status: 'pending',
    createdAt: '2026-08-13 10:00:00',
    handledAt: null,
    handledBy: null,
    rejectReason: null,
    bankRef: 'BK20260813100000001',
  },
];

export function submitDividendRequest({ projectId, perShare, currency = 'HKD' }, operator = '') {
  const per = Number(perShare);
  if (!projectId || !per || per <= 0) return false;
  const projectName = holdings.find(h => h.projectId === projectId)?.projectName || projectId;
  const req = {
    id: `dv${Date.now()}`,
    orderNo: genOrderNo('DIV'),
    projectId,
    projectName,
    perShare: per,
    currency,
    status: 'pending',
    createdAt: formatNow(),
    handledAt: null,
    handledBy: null,
    rejectReason: null,
    bankRef: `BK${Date.now()}`,   // 外部单号：分红发放银行参考号（mock 演示值）
  };
  dividendRequests.unshift(req);
  logAudit({ operator: operator || '运营后台', category: 'fund', action: 'apply', target: projectName, targetId: req.id, note: `发起分红（每份 HK$ ${per.toLocaleString()}）` });
  Storage.save();
  return true;
}

// 该项目当前可分配总额 = perShare × 该项目全部持仓份额
export function getDividendTotal(req) {
  const shares = holdings.filter(h => h.projectId === req.projectId).reduce((s, h) => s + (h.shares || 0), 0);
  return (req.perShare || 0) * shares;
}

export function approveDividendRequest(reqId, operator = '') {
  const req = dividendRequests.find(r => r.id === reqId);
  if (!req || req.status !== 'pending') return false;
  // 发放 = 按份额回流投资人资金账户（mock 单用户：currentUser 在该项目的持仓应得；接后端按真实账户体系逐投资人入账）
  const holders = holdings.filter(h => h.projectId === req.projectId);
  if (!holders.length) return false;
  const due = holders.reduce((s, h) => s + (h.shares || 0), 0) * req.perShare;
  req.status = 'approved';
  req.handledAt = formatNow();
  req.handledBy = operator || '运营后台';
  const w = wallet.hkd;
  w.balance += due;
  currentUser.account.hkd = w.balance;
  updateLatestTotal(due);
  holders.forEach(h => { h.dividendReceived = (h.dividendReceived || 0) + h.shares * req.perShare; });
  transactions.unshift({
    id: `t${Date.now()}`,
    orderNo: genOrderNo('TX'),
    type: 'dividend',
    amount: due,
    currency: req.currency || 'HKD',
    status: 'completed',
    createdAt: formatNow(),
    projectName: req.projectName,
    method: '项目分红',
    reference: `DIV${Date.now()}`,
  });
  pushNotification({
    type: 'wallet',
    title: '分红到账',
    body: `${req.projectName} 分红 HK$${due.toLocaleString()} 已发放至资金账户。`,
  });
  logAudit({ operator: operator || '运营后台', category: 'fund', action: 'approve', target: req.projectName, targetId: reqId, note: `分红发放：每份 HK$ ${req.perShare.toLocaleString()} × ${holders.reduce((s, h) => s + (h.shares || 0), 0)} 份 = HK$ ${due.toLocaleString()}` });
  Storage.save();
  return true;
}

export function rejectDividendRequest(reqId, reason, operator = '') {
  const req = dividendRequests.find(r => r.id === reqId);
  if (!req || req.status !== 'pending') return false;
  req.status = 'rejected';
  req.handledAt = formatNow();
  req.handledBy = operator || '运营后台';
  req.rejectReason = reason || '未说明原因';
  pushNotification({
    type: 'wallet',
    title: '分红发放未通过',
    body: `${req.projectName} 分红发放未通过审核：${req.rejectReason}`,
  });
  logAudit({ operator: operator || '运营后台', category: 'fund', action: 'reject', target: req.projectName, targetId: reqId, note: `分红发放拒绝：${req.rejectReason}` });
  Storage.save();
  return true;
}

// ========== 工具函数（2026-08-07 从各页面去重抽离） ==========
export function formatCurrency(v) {
  if (v >= 100000000) return `${(v / 100000000).toFixed(1)}亿`;
  if (v >= 10000) return `${(v / 10000).toFixed(0)}万`;
  return v.toLocaleString();
}

/* 精确金额（审核/对账场景专用）：千分位精确到分（2 位小数），不缩写——资金审核是"精确语言"非概览缩写（2026-08-14）
 * null/undefined/NaN 兜底返回 '—'：历史数据（旧流程已通过的充值/换汇请求）无 actualAmount 字段，不能崩（2026-08-20 修复） */
export function formatExactAmount(v) {
  if (v == null || Number.isNaN(Number(v))) return '—';
  return Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* 精确金额（钱包页专用）：千分位，整数显示为整数，小数显示两位小数，不缩写 */
export function formatExact(v) {
  if (Number.isInteger(v)) {
    return v.toLocaleString();
  }
  return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* 币种符号（项目级 currency 配置：HKD/USD/CNY，编辑表单与用户侧展示共用） */
export function getCurrencySymbol(currency) {
  if (currency === 'USD') return '$';
  if (currency === 'CNY') return '¥';
  return 'HK$'; // HKD 与默认兜底
}

export function formatISODateTime(str) {
  const s = String(str || '').trim();
  if (!s) return '—';
  const [datePart, timePart] = s.split(' ');
  const [y, m, d] = datePart.split('-');
  const date = `${String(y).padStart(4, '0')}-${String(Number(m)).padStart(2, '0')}-${String(Number(d)).padStart(2, '0')}`;
  if (!timePart) return `${date} 00:00:00`;
  const [hh, mm, ss] = timePart.split(':');
  const time = `${String(Number(hh)).padStart(2, '0')}:${String(Number(mm)).padStart(2, '0')}:${String(Number(ss || 0)).padStart(2, '0')}`;
  return `${date} ${time}`;
}

export function formatListDateTime(str) {
  const s = String(str || '').trim();
  if (!s) return '—';
  const [datePart, timePart] = s.split(' ');
  const [, m, d] = datePart.split('-');
  const mm = String(Number(m)).padStart(2, '0');
  const dd = String(Number(d)).padStart(2, '0');
  if (!timePart) return `${mm}-${dd}`;
  const [hh, min] = timePart.split(':');
  return `${mm}-${dd} ${String(Number(hh)).padStart(2, '0')}:${String(Number(min || 0)).padStart(2, '0')}`;
}

export function formatDateCN(dateStr) {
  const [, m, d] = dateStr.split('-').map(Number);
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const wd = weekdays[new Date(`${dateStr}T00:00:00`).getDay()];
  return `${m}月${d}日 ${wd}`;
}

// ========== 资金闭环：状态机 + 冻结/解冻/扣款（2026-08-07） ==========

// 24h 宽限期 = mock 30s（演示用）；仅作为 freezeDeadline 字段写入基准，无到期自动顺延逻辑（2026-09-20 机制下线）
export let FREEZE_GRACE_MS = 30000;

// 问卷金额档位（2026-10-22 RO 整改：删 300 万档——档位越低越避免「挑额度」暗示；
// 新增「无意向」固定项 value=0，不进后台增删池，提交时按「无投资意向」处理）
export const NO_INTENT_VALUE = 0;
export const noIntentOption = { value: NO_INTENT_VALUE, label: '无意向' };

export const amountPresets = [
  { value: 1000000, label: '100万' },
  { value: 5000000, label: '500万' },
];

// 档位增删（后台系统配置页可配置——用户侧 SubscribeSheet 实时读取共享数组，配置即生效）
// 校验 + 审计 + 持久化（logAudit/Storage 为文件后部定义，运行时已就绪）
export function addAmountPreset(value, operator) {
  const v = Math.round(Number(value));
  if (!Number.isFinite(v) || v <= 0) return { ok: false, error: '请输入大于 0 的整数金额' };
  if (amountPresets.some(p => p.value === v)) return { ok: false, error: '该金额档位已存在' };
  const label = `${v / 10000}万`;
  amountPresets.push({ value: v, label });
  amountPresets.sort((a, b) => a.value - b.value);
  logAudit({ operator, category: 'config', action: 'update', target: '系统配置', targetId: '', note: `新增问卷金额档位 ${label}（${v.toLocaleString()} HKD）` });
  Storage.save();
  return { ok: true };
}

export function removeAmountPreset(value, operator) {
  const idx = amountPresets.findIndex(p => p.value === value);
  if (idx === -1) return { ok: false, error: '档位不存在' };
  if (amountPresets.length <= 1) return { ok: false, error: '至少保留一个档位' };
  const removed = amountPresets[idx];
  amountPresets.splice(idx, 1);
  logAudit({ operator, category: 'config', action: 'update', target: '系统配置', targetId: '', note: `删除问卷金额档位 ${removed.label}（${removed.value.toLocaleString()} HKD）` });
  Storage.save();
  return { ok: true };
}

function addHistory(sub, entry) {
  sub.history = sub.history || [];
  sub.history.unshift({ timestamp: formatNow(), ...entry });
  sub.updatedAt = formatNow();
}

// waitlist 上位（手动顺延 + 自动超时共用）：从 subscriptions 派生"项目下最早 submitted 排队者"（FIFO）
// 2026-08-17 修复：上位后停在 allocated（不再自动签署）——签署动作由客户在 APP 内电子签署完成（2026-09-15 对齐公司实践），
// 2026-10-22 RO 整改：签署证据台账随 SPV 概念一并移除——线下事项完成情况由运营在「问卷记录」页登记。
// 同时补启动冻结定时器：上位用户同样享有宽限期，逾期未签继续顺延下一位（否则会卡死无出口）。
// 注：mock 单钱包简化，上位用户资金操作走当前演示钱包；接后端由真实账户体系驱动
export function promoteWaitlist(project, operator = '') {
  if (!project) return false;
  const waiting = subscriptions
    .filter(s => s.projectId === project.id && s.status === 'submitted')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const next = waiting[0];
  if (!next) return false;
  next.allocatedAt = formatNow();
  // 2026-10-16 口径修订：线下交割——原 freezeDeadline/freezeFunds 钱包冻结摘除
  next.frozenAmount = next.amount || 0;
  next.status = 'allocated';
  addHistory(next, {
    type: 'allocated',
    actor: 'platform',
    note: '已转客户经理跟进（运营协调）',
  });
  logAudit({ operator: operator || '系统', category: 'subscription', action: 'promote', target: project.title, targetId: project.id, note: `跟进队列上位：${next.investorName}（${next.investorNo}）已转客户经理跟进` });
  return true;
}

// ========== 资金操作函数 ==========

// ========== 业务层包装：状态变更 ==========

// 演示用：重置订阅状态到 allocated（刷新页面后可重新体验完整签署流程）
export function resetSubscriptionForDemo(subscriptionId) {
  const sub = subscriptions.find(s => s.id === subscriptionId);
  if (!sub) return false;
  const project = projects.find(p => p.id === sub.projectId);
  sub.status = 'allocated';
  sub.allocatedAt = formatNow();
  // 2026-10-16 口径修订：线下交割——freezeDeadline（24h 签署宽限期）随冻结语义摘除
  sub.frozenAmount = sub.amount || 0;
  // 清除 signed 相关历史，保留 allocated 历史
  sub.history = sub.history.filter(h => h.type !== 'signed');
  Storage.save();
  return true;
}

// T8：获取申购的"待解除"大额交易标记（二级/三级 pending）
// PRD 04 §3.8 + 测试计划 TC004/TC005：二级/三级大额审查未通过前，配额分配与扣款均被拦截
// 一级（300万-500万）不拦截（compliance 专员即可审，流程可控）；二级/三级需主管/MLRO 终审，未解除前拦截
export function getBlockingAmlFlags(sub) {
  if (!sub || !Array.isArray(sub.amlFlags)) return [];
  return sub.amlFlags.filter(f =>
    f && f.type === 'large_transaction'
    && (f.level === 'two' || f.level === 'three')
    && f.status === COMPLIANCE_STATUS.PENDING
  );
}

// submitted → allocated：业务层包装（仅 mock 演示）
// 实际配额（2026-08-21）：默认全额获配；超募时可削减（allocatedAmount < 意向金额，不可高于）——
// 冻结/宽限期/签署扣款/份额换算全部跟随 frozenAmount（settleFunds 取 frozenAmount），下游零改动
// submitted → allocated：转客户经理跟进
// 2026-10-22 RO 整改：去「配额/冻结/超募削额」卖方语义——咨询平台口径下平台不分配额度，
// 运营动作 = 客户经理接手跟进；意向金额仅作客户经理沟通参考
export function markSubscriptionAllocated(subscriptionId, operator = '') {
  const sub = subscriptions.find(s => s.id === subscriptionId);
  if (!sub || sub.status !== 'submitted') return false;
  const project = projects.find(p => p.id === sub.projectId);
  if (!project) return false;
  // T8 amlFlags 拦截（PRD 04 §3.8 大额交易审查）：二级/三级大额标记未解除 → 拒绝转跟进
  const blocking = getBlockingAmlFlags(sub);
  if (blocking.length > 0) {
    return { ok: false, error: `大额交易审查未完成，无法转客户经理跟进（${blocking.map(f => f.level === 'three' ? '三级' : '二级').join('、')}标记待解除）` };
  }
  sub.allocatedAt = formatNow();
  sub.status = 'allocated';
  addHistory(sub, {
    type: 'allocated',
    actor: 'platform',
    note: '已转客户经理跟进',
  });
  pushNotification({
    type: 'subscription',
    title: '客户经理已接手',
    body: `${sub.projectName} 已由客户经理接手跟进，如需进一步了解可直接联系您的专属顾问。`,
  });
  logAudit({ operator: operator || '系统', category: 'subscription', action: 'allocate', target: sub.projectName, targetId: sub.id, note: '转客户经理跟进' });
  Storage.save();
  return true;
}

// allocated → signed（内部状态名保留 signed 以免大范围改数据；对外展示=已完成）
// 2026-10-22 RO 整改：去 SPV 签署与份额语义——线上无签署动作，运营仅登记「线下事项已完成」
export function markSubscriptionCompleted(subscriptionId, note, operator = '') {
  const sub = subscriptions.find(s => s.id === subscriptionId);
  if (!sub || sub.status !== 'allocated') return { ok: false, error: '状态不符，仅客户经理跟进中的记录可标记完成' };
  // T8 amlFlags 拦截（PRD 04 §3.8）：二级/三级大额标记未解除 → 拒绝标记完成
  const blocking = getBlockingAmlFlags(sub);
  if (blocking.length > 0) {
    return { ok: false, error: `大额交易审查未完成，无法标记完成（${blocking.map(f => f.level === 'three' ? '三级' : '二级').join('、')}标记待解除）` };
  }
  sub.status = 'signed';
  addHistory(sub, {
    type: 'signed',
    actor: 'platform',
    note: note || '已完成（线下事项已办结）',
  });
  pushNotification({
    type: 'subscription',
    title: '已标记完成',
    body: `${sub.projectName} 的相关事项已办结，如需进一步了解请联系您的专属客户经理。`,
  });
  logAudit({ operator: operator || '系统', category: 'subscription', action: 'complete', target: sub.projectName, targetId: sub.id, note: '标记完成' });
  Storage.save();
  return { ok: true };
}

// submitted → unallocated（暂无需推进）
export function markSubscriptionUnallocated(subscriptionId, note, operator = '') {
  const sub = subscriptions.find(s => s.id === subscriptionId);
  if (!sub || sub.status !== 'submitted') return false;
  sub.status = 'unallocated';
  addHistory(sub, {
    type: 'unallocated',
    actor: 'platform',
    note: note || '本次提交暂无进一步安排',
  });
  pushNotification({
    type: 'subscription',
    title: '本次提交暂无进一步安排',
    body: `${sub.projectName} 本轮已结束，如后续有进一步意向可重新填写问卷。`,
  });
  logAudit({ operator: operator || '系统', category: 'subscription', action: 'unallocate', target: sub.projectName, targetId: sub.id, note: '标记暂无需推进' });
  Storage.save();
  return true;
}

// allocated → unallocated（暂缓跟进）：客户确认暂不推进 → 后续由客户经理重新联系
export function markSubscriptionForfeit(subscriptionId, reason, operator = '') {
  const sub = subscriptions.find(s => s.id === subscriptionId);
  if (!sub || sub.status !== 'allocated') return false;
  const project = projects.find(p => p.id === sub.projectId);
  if (project) promoteWaitlist(project, operator);
  logAudit({ operator: operator || '系统', category: 'subscription', action: 'forfeit', target: sub.projectName, targetId: sub.id, note: `暂缓跟进：${reason || '运营确认暂不推进'}` });
  Storage.save();
  return true;
}

// 兼容旧版 updateStatus：内部路由到 markSubscription* 包装
export function updateSubscriptionStatus(subscriptionId, status, note) {
  if (status === 'allocated') return markSubscriptionAllocated(subscriptionId);
  if (status === 'signed') return markSubscriptionCompleted(subscriptionId, note);
  if (status === 'unallocated') return markSubscriptionUnallocated(subscriptionId, note);
  return false;
}

// ========== KYC 操作函数 ==========

export function getKycStatus() {
  return currentUser.kyc_status;
}

export function getKycProfile() {
  return currentUser.kyc_profile;
}

export function updateKycProfile(updates) {
  Object.assign(currentUser.kyc_profile, updates);
  return currentUser.kyc_profile;
}

export function submitKyc() {
  // 2026-09-20 修复：NOT_STARTED 账号走完流程后提交被静默丢弃——
  // 原 allowed 不含 NOT_STARTED（advanceKycStep 从未被流程页调用，死代码），submitKyc return false
  // 但 KYCAddressProof 无脑 navigate('kyc-submitted')，造成"审核中"假象；后台队列无记录、快照不落、刷新即丢。
  // 新语义：除"已通过"（无需重提）与"审核中"（防重复提交）外均可提交。
  const blocked = [KYC_STATUS.APPROVED, KYC_STATUS.PENDING_REVIEW];
  if (blocked.includes(currentUser.kyc_status)) return false;
  currentUser.kyc_status = KYC_STATUS.PENDING_REVIEW;
  currentUser.kyc_profile.submittedAt = formatNow();
  // 写入后台审核队列（userId 关联，闭环：用户侧提交 → 后台可见）
  const p = currentUser.kyc_profile;
  kycSubmissions.unshift({
    id: `k${Date.now()}`,
    userId: currentUser.id,
    name: currentUser.name,
    email: currentUser.email,
    status: KYC_STATUS.PENDING_REVIEW,
    submittedAt: currentUser.kyc_profile.submittedAt,
    rejectReason: null,
    history: [{
      at: currentUser.kyc_profile.submittedAt,
      operator: '系统',
      action: 'submitted',
      note: '用户提交认证资料',
    }],
    profile: {
      fullName: p.fullName,
      fullNameEn: p.fullNameEn,
      gender: p.gender,
      birthDate: p.birthDate,
      nationality: p.nationality,
      piType: p.piType,
      piCertified: p.piCertified,
      idDocType: p.idDocType,
      idDocNumber: p.idDocNumber || '—',
      idDocExpiry: p.idDocExpiry,
      idDocFront: p.idDocFront,
      idDocBack: p.idDocBack,
      idDocHandheld: p.idDocHandheld,
      addressProofType: p.addressProofType,
      addressProof: p.addressProof,
      addressLine: p.addressLine,
      // 2026-10-16 C 组：财务信息 + 逐地税务随快照入队，后台审核抽屉可见
      employmentStatus: p.employmentStatus,
      incomeSources: p.incomeSources,
      taxResidencies: p.taxResidencies,
      taxDetails: p.taxDetails,
      crsDeclared: p.crsDeclared,
    },
  });
  Storage.save();
  return true;
}

export function approveKyc() {
  // 2026-08-14：仅置 KYC 实名认证通过，不再自动 PI（PI 独立审核流，见 AdminPI）
  currentUser.kyc_status = KYC_STATUS.APPROVED;
  return true;
}

// 设置全局 currentUser（同步 React state ↔ mock data 层的桥梁）
export function setMockCurrentUser(user) {
  currentUser = user;
}

// 登录时从提交记录回读 KYC 状态（2026-09-20）：
// testAccounts 预设状态是内存态，刷新即重置为 NOT_STARTED；而 kycSubmissions 走 localStorage 快照持久化——
// 不回读会导致「后台待审核列表有此人、APP 侧却让他重填空白表」的脱节（门控分桶也会错弹 kyc-start）。
// kycSubmissions 用 unshift 插入（最新在前），find 即最新一条；rejectReason 一并回读（KYCSubmitted 状态页消费）。
export function restoreKycStatus(userId) {
  const last = kycSubmissions.find(k => k.userId === userId);
  if (!last) return null;
  currentUser.kyc_status = last.status;
  if (last.rejectReason) currentUser.kyc_profile.rejectReason = last.rejectReason;
  return last.status;
}

// 新注册用户骨架：模块加载时从 pending 账号（"未认证用户"模板）冻结一份空白快照。
// 冻结的意义：此后运行时的表单填写 / 2FA 绑定 / 卡绑定只会改 testAccounts.pending 本体，
// 不会污染这个模板（模板若跟着变，新注册用户会继承上一个演示账号填过的资料）。
const BLANK_USER_SKELETON = JSON.parse(JSON.stringify(testAccounts.pending));

// 造一个"刚注册、尚未认证"的用户（2026-10-12）：
// 注册成功后必须用它切 data.js 单例——否则合规门控读到的仍是模块默认账号 u1（已通过），
// 注册后 navigate('kyc-start') 会被「已通过 + 访问 KYC 流程」那段门控打回资产页：
// 新用户既进不了 KYC 流程，又看到上一个账号的余额（2026-10-12 实测复现）。
export function createFreshUser({ id, email, name } = {}) {
  const base = JSON.parse(JSON.stringify(BLANK_USER_SKELETON));
  base.id = id || `user-${Date.now()}`;
  base.email = email || '';
  base.name = name || (email ? String(email).split('@')[0] : '新用户');
  base.account = { hkd: 0, usd: 0, frozen: 0 };      // 新用户零余额
  base.kyc_status = KYC_STATUS.NOT_STARTED;
  base.kyc_profile.submittedAt = null;
  base.kyc_profile.rejectReason = null;
  return base;
}

export function rejectKyc(reason) {
  currentUser.kyc_status = KYC_STATUS.REJECTED;
  currentUser.kyc_profile.rejectReason = reason;
  return true;
}

export function sendEmailVerifyCode() {
  // Mock 演示：固定验证码 123456
  const code = '123456';
  currentUser.emailVerifyCode = code;
  console.log(`[Mock] 邮箱验证码: ${code}`);
  return code;
}

export function verifyEmailCode(code) {
  if (currentUser.emailVerifyCode === code) {
    currentUser.emailVerified = true;
    return true;
  }
  return false;
}

// ========== 密码重置验证码（2026-08-26 新增） ==========
// 密码重置专用验证码存储（独立于 KYC 验证码）
// ---- 验证码服务（2026-10-15 UC §5.6 对齐：6位/5min有效/60s重发/5次错锁15min/24h上限10条）----
// 注册与密码重置共用同一口径、独立存储（验证码不跨场景通用，防一码多用）
const resetCodeStore = {};   // { account: { code, expiresAt, attempts, lockedAt, verified, lastSentAt, dayStart, dayCount } }
const registerCodeStore = {}; // 结构同上，注册场景（UC §9.2：验证通过才建号 C14）

const DAILY_CODE_LIMIT = 10; // UC §5.6：24h 发送上限 10 条

// 24h 滑动窗口计数：跨天重置；达上限拒绝下发（UC-00102 口径）
function codeDailyLimit(entry, now) {
  if (!entry) return true;
  if (now - (entry.dayStart || 0) > 24 * 3600 * 1000) { entry.dayStart = now; entry.dayCount = 0; return true; }
  return (entry.dayCount || 0) < DAILY_CODE_LIMIT;
}

function sendSceneCode(store, account) {
  const key = account.trim().toLowerCase();
  const now = Date.now();
  const existing = store[key];
  // 速率限制：60s 重发间隔
  if (existing && existing.lastSentAt && (now - existing.lastSentAt) < 60000) {
    return { success: false, message: '请60秒后重试' };
  }
  // 24h 发送上限
  if (!codeDailyLimit(existing, now)) {
    return { success: false, message: '今日验证码发送次数已达上限，请24小时后重试' };
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  store[key] = {
    ...existing,
    code,
    expiresAt: now + 5 * 60 * 1000, // 5分钟有效期
    attempts: 0,
    lockedAt: null,
    verified: false,
    lastSentAt: now,
    dayStart: existing?.dayStart || now,
    dayCount: (existing?.dayCount || 0) + 1,
  };
  // Mock 模式直接返回验证码（正式环境不返回，仅通过邮件发送）
  return { success: true, message: '验证码已发送', code };
}

function verifySceneCode(store, account, code) {
  const key = account.trim().toLowerCase();
  const now = Date.now();
  const entry = store[key];

  // 验证码不存在
  if (!entry) {
    return { success: false, message: '请先获取验证码' };
  }

  // 检查是否锁定（5次失败锁15分钟）
  if (entry.lockedAt && (now - entry.lockedAt) < 15 * 60 * 1000) {
    const remainMin = Math.ceil((15 * 60 * 1000 - (now - entry.lockedAt)) / 60000);
    return { success: false, message: `已锁定，请${remainMin}分钟后重试` };
  }

  // 解锁（如果锁定期已过）
  if (entry.lockedAt && (now - entry.lockedAt) >= 15 * 60 * 1000) {
    entry.lockedAt = null;
    entry.attempts = 0;
  }

  // 检查是否过期
  if (now > entry.expiresAt) {
    return { success: false, message: '验证码已过期，请重新获取' };
  }

  // 检查尝试次数
  if (entry.attempts >= 5) {
    entry.lockedAt = now;
    return { success: false, message: '尝试次数过多，已锁定15分钟' };
  }

  // 验证码比对
  if (entry.code !== code.trim()) {
    entry.attempts += 1;
    const remain = 5 - entry.attempts;
    return { success: false, message: `验证码错误，还剩${remain}次机会` };
  }

  // 验证成功
  entry.verified = true;
  return { success: true, message: '验证成功' };
}

/**
 * 发送密码重置验证码
 * @param {string} account - 登录邮箱
 * @returns {{ success: boolean, message: string, code?: string }}
 */
export function sendResetCode(account) {
  const result = sendSceneCode(resetCodeStore, account);
  if (result.success) console.log(`[Mock] 密码重置验证码 → ${account}: ${result.code}`);
  return result;
}

/**
 * 验证密码重置验证码
 * @param {string} account - 登录邮箱
 * @param {string} code - 用户输入的验证码
 * @returns {{ success: boolean, message: string }}
 */
export function verifyResetCode(account, code) {
  return verifySceneCode(resetCodeStore, account, code);
}

/**
 * 重置密码
 * @param {string} account - 登录邮箱
 * @param {string} newPassword - 新密码
 * @returns {{ success: boolean, message: string }}
 */
export function resetPassword(account, newPassword) {
  const key = account.trim().toLowerCase();
  const store = resetCodeStore[key];

  // 检查验证码是否已验证
  if (!store || !store.verified) {
    return { success: false, message: '请先完成验证码验证' };
  }

  // 密码策略（2026-10-15 与注册口径统一：至少8位，含字母和数字）
  if (!newPassword || newPassword.length < 8) {
    return { success: false, message: '密码至少需要 8 个字符' };
  }
  if (!/(?=.*[A-Za-z])(?=.*\d)/.test(newPassword)) {
    return { success: false, message: '密码需同时包含字母和数字' };
  }

  // 真实落库（mock 持久化）：demo/test 账号走全局密码覆盖；本轮注册账号更新内存账号表
  const demoLike = key === 'demo@example.com'
    || Object.values(testAccounts).some(u => String(u.email || '').toLowerCase() === key);
  if (demoLike) {
    try {
      localStorage.setItem(USER_PWD_KEY, JSON.stringify({ password: newPassword }));
    } catch (e) {
      return { success: false, message: '保存失败，请稍后重试' };
    }
  }
  if (key in registeredAccounts) registeredAccounts[key] = newPassword;
  console.log(`[Mock] 密码重置成功: ${account}`);

  // 清理验证码存储
  delete resetCodeStore[key];

  return { success: true, message: '密码重置成功' };
}

// ========== 注册验证码与账号判重（2026-10-15 UC §9.2 对齐）==========
// UC 口径：验证码校验通过才建号（C14 验证未通过不建号、无残留）；集团维度全局判重（R3 命中仅提示「已注册」）

/**
 * 发送注册验证码（与密码重置同口径：6位/5min/60s重发/24h上限10条）
 */
export function sendRegisterCode(account) {
  const result = sendSceneCode(registerCodeStore, account);
  if (result.success) console.log(`[Mock] 注册验证码 → ${account}: ${result.code}`);
  return result;
}

/**
 * 校验注册验证码（与密码重置同口径：5次错锁15分钟）
 */
export function verifyRegisterCode(account, code) {
  return verifySceneCode(registerCodeStore, account, code);
}

// ---- mock 注册账号表：支持「注册成功 → 去登录」全链路演示 ----
// 仅内存（刷新即失，与验证码 store 同级演示语义）；真实环境由 UC 建号，登录走 UC 登录接口
const registeredAccounts = {}; // { account(小写): password }
export function registerAccount(account, password) {
  registeredAccounts[account.trim().toLowerCase()] = password;
}
export function findRegisteredAccount(account) {
  const key = account.trim().toLowerCase();
  return key in registeredAccounts ? { account: key, password: registeredAccounts[key] } : null;
}

/**
 * 全局判重（UC §9.2/R3）：集团维度唯一；本轮已注册的 mock 账号同样计为已注册。
 * 账号为邮箱，统一小写比较；demo@example.com 为演示别名，保留不可注册。
 */
export function isAccountRegistered(account) {
  if (findRegisteredAccount(account)) return true;
  const norm = account.trim().toLowerCase();
  if (norm === 'demo@example.com') return true;
  return Object.values(testAccounts).some(u =>
    String(u.email || '').toLowerCase() === norm
  );
}

export function advanceKycStep(step) {
  const validSteps = ['basic-info', 'id-upload', 'address-proof', 'submitted'];
  if (!validSteps.includes(step)) return false;
  if (currentUser.kyc_status === KYC_STATUS.NOT_STARTED) {
    currentUser.kyc_status = KYC_STATUS.IN_PROGRESS;
  }
  return true;
}

// ========== 2FA 双重验证体系（2026-09-22 · 复刻交易所 2FA 实践规格） ==========
// 规格：验证矩阵（INV-9 KYC 分层）+ 降级链（INV-3）+ 验证会话 S-1~S-5 + 凡动必冻（INV-5）
// 原型语义：真 TOTP（RFC6238）+ mock 邮箱验证码/Passkey/人脸；规则状态机严格按规格，后端可直接照抄。
// 演示约定（非规格）：快捷登录 __loginWithTestAccount 豁免 2FA；邮箱验证码固定 123456。

// ---- 演示环境开关（紧急登录动态冻结：默认常用环境 24h；置 true 模拟异地 48h）----
export let __emergencyEnvUnfamiliar = false;
export function setEmergencyEnvUnfamiliar(v) { __emergencyEnvUnfamiliar = !!v; }

// ---- 用户安全档案（按 userId 覆盖层：store 持久化 > testAccounts 预设）----
// v2：剥离短信后的存储键，避免旧档案中的「短信验证」历史随刷新复活
const SECURITY_STORE_KEY = 'zhifu-user-security-v2';
let userSecurityStore = {}; // { [userId]: { ga, passkeys, freezeUntil, history, gaResetLog, emergency, lockedUntil } }

function loadSecurityStore() {
  try {
    const raw = localStorage.getItem(SECURITY_STORE_KEY);
    if (raw) userSecurityStore = JSON.parse(raw) || {};
  } catch (e) { userSecurityStore = {}; }
}
function persistSecurityStore() {
  try { localStorage.setItem(SECURITY_STORE_KEY, JSON.stringify(userSecurityStore)); } catch (e) { /* 隐私模式静默 */ }
}

// 演示种子（内存预设，store 未覆盖时生效）：u1 有 GA+Passkey（KYC1 强因子态）、u3 仅邮箱（KYC1 降级态）、u2 无强因子（走注册邮箱验证码兜底）
const SECURITY_SEEDS = {
  u1: {
    ga: { bound: true, secret: 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP', boundAt: '2026-06-01 10:00:00' },
    passkeys: [{ id: 'pk-seed-1', name: 'iPhone 15 Pro', createdAt: '2026-06-01 10:05:00' }],
  },
  u3: { ga: { bound: false, secret: null, boundAt: null }, passkeys: [] },
  u2: { ga: { bound: false, secret: null, boundAt: null }, passkeys: [] },
};

export function getUserSecurity(userId) {
  const uid = userId || currentUser.id;
  const seed = SECURITY_SEEDS[uid] || {};
  const base = {
    ga: { bound: false, secret: null, boundAt: null },
    passkeys: [],
    freezeUntil: null,
    freezeReason: null,
    history: [],
    gaResetLog: [],
    emergency: null,       // 紧急登录中间态：{ stage: 'rebind-required', at, dynamicHours }
    lockedUntil: null,     // 验证失败 5 次锁安全中心修改权限 2h
  };
  const stored = userSecurityStore[uid] || {};
  const merged = {
    ...base,
    ...seed,
    ...stored,
    ga: { ...base.ga, ...(seed.ga || {}), ...(stored.ga || {}) },
    passkeys: stored.passkeys || seed.passkeys || [],
    history: stored.history || seed.history || [],
    gaResetLog: stored.gaResetLog || [],
  };
  return merged;
}

function saveUserSecurity(userId, sec) {
  const uid = userId || currentUser.id;
  userSecurityStore[uid] = sec;
  persistSecurityStore();
  Storage.save(); // 双通道同步：主快照也含 userSecurityStore（L7378），漏写会被旧快照在刷新时回滚
}

// 是否有任一 2FA 因子（决定登录是否强制 2FA / 资金流是否放行）
export function hasAnyFactor(userId) {
  const sec = getUserSecurity(userId);
  return sec.ga.bound || sec.passkeys.length > 0 || !!currentUser.email;
}

// ---- KYC 分层（INV-9）：KYC1 = 已完成 KYC；KYC0 降级仅邮箱验证码 ----
export function isKyc1(userId) {
  const u = userId ? null : currentUser;
  return !!u && u.kyc_status === KYC_STATUS.APPROVED;
}

// ---- TOTP（RFC 6238，30s 窗口，±1 容错；WebCrypto 主路径 + 纯 JS HMAC-SHA1 fallback）----
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateTotpSecret() {
  const bytes = new Uint8Array(20);
  (window.crypto || {}).getRandomValues ? window.crypto.getRandomValues(bytes) : bytes.forEach((_, i) => { bytes[i] = Math.floor(Math.random() * 256); });
  let bits = 0, value = 0, out = '';
  for (const b of bytes) {
    value = (value << 8) | b; bits += 8;
    while (bits >= 5) { out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(str) {
  let bits = 0, value = 0; const out = [];
  for (const c of str.toUpperCase().replace(/=+$/, '')) {
    const idx = BASE32_ALPHABET.indexOf(c);
    if (idx === -1) continue;
    value = (value << 5) | idx; bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return new Uint8Array(out);
}

// 纯 JS HMAC-SHA1（secure context 之外的兜底：file:// / http 内网 IP 下 crypto.subtle 不可用）
function hmacSha1Js(keyBytes, msgBytes) {
  const block = 64;
  let key = keyBytes.length > block ? sha1Js(keyBytes) : keyBytes;
  const padded = new Uint8Array(block);
  padded.set(key);
  const oKey = new Uint8Array(block), iKey = new Uint8Array(block);
  for (let i = 0; i < block; i++) { oKey[i] = padded[i] ^ 0x5c; iKey[i] = padded[i] ^ 0x36; }
  return sha1Js(concatBytes(oKey, sha1Js(concatBytes(iKey, msgBytes))));
}
function concatBytes(a, b) { const out = new Uint8Array(a.length + b.length); out.set(a); out.set(b, a.length); return out; }
function sha1Js(bytes) {
  const ml = bytes.length;
  const withPad = new Uint8Array((((ml + 8) >> 6) + 1) << 6);
  withPad.set(bytes); withPad[ml] = 0x80;
  const dv = new DataView(withPad.buffer);
  dv.setUint32(withPad.length - 4, ml << 3, false);
  let h0 = 0x67452301, h1 = 0xEFCDAB89, h2 = 0x98BADCFE, h3 = 0x10325476, h4 = 0xC3D2E1F0;
  const w = new Uint32Array(80);
  for (let off = 0; off < withPad.length; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4, false);
    for (let i = 16; i < 80; i++) w[i] = ((w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16]) << 1) | ((w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16]) >>> 31);
    let a = h0, b = h1, c = h2, d = h3, e = h4;
    for (let i = 0; i < 80; i++) {
      const f = i < 20 ? (b & c) | (~b & d) : i < 40 ? b ^ c ^ d : i < 60 ? (b & c) | (b & d) | (c & d) : b ^ c ^ d;
      const k = i < 20 ? 0x5A827999 : i < 40 ? 0x6ED9EBA1 : i < 60 ? 0x8F1BBCDC : 0xCA62C1D6;
      const tmp = (((a << 5) | (a >>> 27)) + f + e + k + w[i]) >>> 0;
      e = d; d = c; c = (b << 30) | (b >>> 2); b = a; a = tmp;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0; h4 = (h4 + e) >>> 0;
  }
  const out = new Uint8Array(20), odv = new DataView(out.buffer);
  [h0, h1, h2, h3, h4].forEach((h, i) => odv.setUint32(i * 4, h, false));
  return out;
}

async function totpAt(secretBase32, counter) {
  const key = base32Decode(secretBase32);
  const msg = new Uint8Array(8);
  new DataView(msg.buffer).setUint32(4, counter, false);
  let hmac;
  if (window.crypto && crypto.subtle) {
    try {
      const keyObj = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
      hmac = new Uint8Array(await crypto.subtle.sign('HMAC', keyObj, msg));
    } catch (e) { hmac = hmacSha1Js(key, msg); }
  } else {
    hmac = hmacSha1Js(key, msg);
  }
  const offset = hmac[hmac.length - 1] & 0xf;
  const bin = ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3];
  return String(bin % 1000000).padStart(6, '0');
}

// 演示便利模式（2026-09-23）：GA 验证码降级为固定演示码，与邮箱验证码对齐——演示免装 App/免算码。
// 切回真 TOTP：置 false 即恢复 RFC 6238 真码校验（totp.mjs 工具可算码），代码零改动。
export const GA_DEMO_MODE = true; // UI 按此切换 GA 提示文案
const DEMO_OTP = '123456'; // 全因子统一演示码（邮箱/GA），与 UI 提示文案对齐

export async function verifyTotp(secretBase32, code) {
  if (!secretBase32 || !/^\d{6}$/.test(code || '')) return false;
  if (GA_DEMO_MODE) return code === DEMO_OTP;
  const counter = Math.floor(Date.now() / 30000);
  for (const drift of [0, -1, 1]) { // ±1 窗口容错（时钟偏移）
    if ((await totpAt(secretBase32, counter + drift)) === code) return true;
  }
  return false;
}

// ---- 验证会话引擎（S-1~S-5：10min 会话 / 一次性 token / 只接受最新）----
const VERIFY_SESSION_TTL = 10 * 60 * 1000;
const AUTH_TOKEN_TTL = 10 * 60 * 1000;
const verifySessions = new Map(); // id -> session
let latestToken = null; // S-3：只接受最新 token

export function createVerifySession(itemTypes) {
  const sec = getUserSecurity();
  if (sec.lockedUntil && new Date(String(sec.lockedUntil).replace(' ', 'T')) > new Date()) {
    return { ok: false, locked: true, until: sec.lockedUntil };
  }
  const items = itemTypes.map(type => ({ type, done: false }));
  const session = {
    id: `vs${Date.now()}${Math.floor(Math.random() * 1000)}`,
    items,
    createdAt: Date.now(),
    expiresAt: Date.now() + VERIFY_SESSION_TTL,
    failures: 0,
  };
  verifySessions.set(session.id, session);
  return { ok: true, sessionId: session.id, items, expiresAt: session.expiresAt };
}

function getSession(id) {
  const s = verifySessions.get(id);
  if (!s) return null;
  if (Date.now() > s.expiresAt) { verifySessions.delete(id); return null; } // S-2 超时全作废
  return s;
}

// 校验单项。passkey/face 由组件动画完成后调 completeVerifyItem 免 code 标记。
export async function submitVerifyItem(sessionId, type, code) {
  const s = getSession(sessionId);
  if (!s) return { ok: false, reason: 'expired' };
  const sec = getUserSecurity();
  if (sec.lockedUntil && new Date(String(sec.lockedUntil).replace(' ', 'T')) > new Date()) {
    return { ok: false, reason: 'locked', until: sec.lockedUntil };
  }
  const item = s.items.find(i => i.type === type && !i.done);
  if (!item) return { ok: false, reason: 'invalid_item' };

  let passed = false;
  if (type === 'email') {
    passed = code === DEMO_OTP; // 演示码（全因子统一，见 verifyTotp 上方常量）
  } else if (type === 'ga') {
    passed = sec.ga.bound ? await verifyTotp(sec.ga.secret, code) : false;
  }
  if (passed) {
    item.done = true;
    return { ok: true, progress: `${s.items.filter(i => i.done).length}/${s.items.length}`, allDone: s.items.every(i => i.done) };
  }
  s.failures += 1;
  if (s.failures >= 5) { // X-5：失败 5 次锁安全中心修改权限 2h（冲突 #1 裁决值）
    sec.lockedUntil = new Date(Date.now() + 2 * 3600 * 1000).toISOString();
    saveUserSecurity(currentUser.id, sec);
    return { ok: false, reason: 'too_many_failures' };
  }
  return { ok: false, reason: type === 'ga' ? 'ga_code_error' : 'code_error', remain: 5 - s.failures };
}

// passkey / 人脸模拟因子：动画完成即通过（原型语义，无真实生物特征）
export function completeVerifyItem(sessionId, type) {
  const s = getSession(sessionId);
  if (!s) return { ok: false, reason: 'expired' };
  const item = s.items.find(i => i.type === type && !i.done);
  if (!item) return { ok: false, reason: 'invalid_item' };
  item.done = true;
  return { ok: true, progress: `${s.items.filter(i => i.done).length}/${s.items.length}`, allDone: s.items.every(i => i.done) };
}

// S-1：最终放行逐一重校验 + 发放一次性授权 token（S-3/S-4/S-5）
export function finalizeVerifySession(sessionId) {
  const s = verifySessions.get(sessionId);
  if (!s) return { ok: false, reason: 'expired' };
  if (Date.now() > s.expiresAt) { verifySessions.delete(sessionId); return { ok: false, reason: 'expired' }; }
  if (!s.items.every(i => i.done)) return { ok: false, reason: 'incomplete' }; // 防流程逃逸
  verifySessions.delete(sessionId);
  latestToken = {
    token: `at${Date.now()}${Math.floor(Math.random() * 100000)}`,
    expiresAt: Date.now() + AUTH_TOKEN_TTL,
    used: false,
  };
  return { ok: true, token: latestToken.token };
}

export function consumeAuthToken(token) {
  if (!latestToken || latestToken.token !== token) return { ok: false, reason: 'stale' }; // S-3 只接受最新
  if (latestToken.used) return { ok: false, reason: 'used' }; // S-5 一次性
  if (Date.now() > latestToken.expiresAt) return { ok: false, reason: 'expired' }; // S-4
  latestToken.used = true;
  return { ok: true };
}

// ---- 登录选路矩阵（2026-10-15 UC §9.4 对齐：注册通道即强制因子，不存在免验证登录）----
// GA/Passkey 延迟绑定（可后补），但登录验证不可免：无强因子时走注册邮箱验证码兜底；
// KYC1 叠加人脸（INV-9）。空数组 = 无任何可达通道（异常态），LoginPage 阻断并联系客服。
export function resolveLoginFactors() {
  const sec = getUserSecurity();
  const kyc1 = isKyc1();
  const items = [];
  if (sec.passkeys.length > 0) {
    items.push('passkey'); // 第一级：Passkey 生物识别
  } else if (sec.ga.bound) {
    items.push('ga');
  }
  if (items.length === 0) {
    if (currentUser.email) {
      items.push('email');
      if (kyc1) items.push('face');
    }
  }
  return items;
}

// ---- 敏感操作验证矩阵（规格 5.2）----
export function resolveSensitiveFactors() {
  const sec = getUserSecurity();
  if (sec.passkeys.length > 0) return ['passkey']; // Passkey 单验，豁免其余
  if (sec.ga.bound) return ['ga', 'email'];        // GA + 邮箱验证码双验
  if (currentUser.email) return isKyc1() ? ['email', 'face'] : ['email']; // 降级
  return []; // 无任何可达通道 → 调用方阻断并联系客服
}

// ---- 凡动必冻（INV-5 / X-1）：KYC1 冻结出金 24h，KYC0 不实际生效 ----
export function triggerSecurityFreeze(hours, reason) {
  if (!isKyc1()) return false; // KYC0 无交易权限，冻结不实际生效（规格 5.3.2 风险决策）
  const sec = getUserSecurity();
  const until = new Date(Date.now() + hours * 3600 * 1000).toISOString();
  sec.freezeUntil = until;
  sec.freezeReason = reason || '安全项变更';
  saveUserSecurity(currentUser.id, sec);
  return true;
}

export function getFreezeState() {
  const sec = getUserSecurity();
  if (!sec.freezeUntil) return { frozen: false };
  const until = new Date(String(sec.freezeUntil).replace(' ', 'T'));
  if (until <= new Date()) return { frozen: false };
  return { frozen: true, until: sec.freezeUntil, reason: sec.freezeReason, hoursLeft: Math.ceil((until - new Date()) / 3600000) };
}

// ---- 安全历史 / 警报 / 审计（X-2/X-4/X-7）----
export function pushSecurityHistory(type, method) {
  const sec = getUserSecurity();
  sec.history.unshift({ time: formatNow(), type, device: navigator.userAgent.includes('iPhone') ? 'iPhone' : 'Desktop', ip: 'demo-ip', method });
  sec.history = sec.history.slice(0, 20);
  saveUserSecurity(currentUser.id, sec);
  logAudit({ operator: currentUser.name || '投资人', category: 'security', action: type, target: currentUser.name, targetId: currentUser.id, note: `${type}（验证方式：${method}）` });
}

// 安全项变更全渠道警报：站内通知 + console 邮件
export function pushSecurityAlert(what) {
  pushNotification({ type: 'security', title: `安全提醒：${what}`, body: `您的${what}。若非本人操作，请立即冻结账户并联系客服。` });
  console.log(`[Mock 邮件→${currentUser.email}] 安全警报：您的${what}。若非本人操作，请立即冻结账户。`);
}

// ---- GA 生命周期（规格 5.3.2）----
// secret 由调用方先展示给用户（GaSetupFlow），GA 出码验证通过后原样落库——保证「验证的密钥 = 绑定的密钥」
export function bindGa(secret) {
  const sec = getUserSecurity();
  if (sec.ga.bound) return { ok: false, message: 'GA 已绑定' };
  if (!secret) secret = generateTotpSecret();
  sec.ga = { bound: true, secret, boundAt: formatNow() };
  saveUserSecurity(currentUser.id, sec);
  pushSecurityHistory('绑定 GA', '安全验证');
  pushSecurityAlert('GA 绑定成功');
  triggerSecurityFreeze(24, '绑定安全项');
  return { ok: true, secret: sec.ga.secret };
}

export function unbindGaCurrent() { // 紧急登录强制解绑用
  const sec = getUserSecurity();
  const had = sec.ga.bound;
  sec.ga = { bound: false, secret: null, boundAt: null };
  saveUserSecurity(currentUser.id, sec);
  return had;
}

export function requestGaReset() { // 频控：24h ≤ 2 次
  const sec = getUserSecurity();
  const dayAgo = Date.now() - 24 * 3600 * 1000;
  const recent = sec.gaResetLog.filter(t => new Date(t).getTime() > dayAgo);
  if (recent.length >= 2) return { ok: false, message: '重置次数已达上限（24小时内最多 2 次）' };
  sec.gaResetLog = [...recent, new Date().toISOString()];
  saveUserSecurity(currentUser.id, sec);
  return { ok: true };
}

export function confirmGaReset(secret) { // 新密钥通过验证瞬间生效，旧密钥作废
  const sec = getUserSecurity();
  if (!secret) secret = generateTotpSecret();
  sec.ga = { bound: true, secret, boundAt: formatNow() };
  saveUserSecurity(currentUser.id, sec);
  pushSecurityHistory('重置 GA', '降级链验证');
  pushSecurityAlert('GA 已重置');
  triggerSecurityFreeze(24, '重置安全项');
  return { ok: true, secret: sec.ga.secret };
}

// ---- Passkey 生命周期（规格 5.3.1：上限 3 / 自动命名 / 删除需验证 + 冻结 + 通知）----
export function listPasskeys() { return getUserSecurity().passkeys; }

export function addPasskey(deviceName) {
  // UC §4.4（V1.2 定稿）：绑定 Passkey 前置 KYC 核验，未通过拒绝——数据层兜底（入口 UI 另有 gate，防越权）
  if (!isKyc1()) return { ok: false, message: '完成身份认证后可绑定通行密钥' };
  const sec = getUserSecurity();
  if (sec.passkeys.length >= 3) return { ok: false, message: '通行密钥数量已达上限 (3/3)。请删除旧密钥后重试。' };
  const name = deviceName || (navigator.userAgent.includes('iPhone') ? 'iPhone' : navigator.userAgent.includes('Mac') ? 'Mac' : '此设备');
  const pk = { id: `pk${Date.now()}`, name, createdAt: formatNow() };
  sec.passkeys.push(pk);
  saveUserSecurity(currentUser.id, sec);
  pushSecurityHistory('添加通行密钥', '安全验证');
  pushSecurityAlert(`新通行密钥（${name}）已添加`);
  console.log(`[Mock 邮件→${currentUser.email}] 您的账户新增了一枚通行密钥：${name}`);
  return { ok: true, passkey: pk };
}

export function removePasskey(pkId) {
  const sec = getUserSecurity();
  const pk = sec.passkeys.find(p => p.id === pkId);
  if (!pk) return { ok: false, message: '通行密钥不存在' };
  sec.passkeys = sec.passkeys.filter(p => p.id !== pkId);
  saveUserSecurity(currentUser.id, sec);
  pushSecurityHistory('删除通行密钥', '安全验证');
  pushSecurityAlert(`通行密钥（${pk.name}）已删除`);
  triggerSecurityFreeze(24, '删除安全项');
  const lastOne = sec.passkeys.length === 0 && !sec.ga.bound;
  return { ok: true, lastFactorRemoved: lastOne, hint: lastOne ? '删除后将使用邮箱验证码登录' : null };
}

// ---- 紧急登录（规格 5.5：Passkey+GA 双失效）----
export function startEmergencyLogin() {
  const sec = getUserSecurity();
  sec.emergency = { stage: 'verifying', at: formatNow() };
  saveUserSecurity(currentUser.id, sec);
  return { ok: true };
}

// 全部验证项完成瞬间：强制解绑 + 动态冻结 + 进入阻断式重绑中间态（持久化，刷新不丢）
// 注意：getUserSecurity() 每次返回新 merged 对象——本函数全程单 get 单 save，禁止中途调用
// 其它 get+save 型函数（如 triggerSecurityFreeze），否则外层 save 会把内部写入回滚
export function completeEmergencyUnbind() {
  const sec = getUserSecurity();
  const kyc1 = isKyc1();
  sec.ga = { bound: false, secret: null, boundAt: null };
  sec.passkeys = [];
  const dynamicHours = (!kyc1 || __emergencyEnvUnfamiliar) ? 48 : 24; // 常用环境 24h / 异常 48h
  if (kyc1) {
    sec.freezeUntil = new Date(Date.now() + dynamicHours * 3600 * 1000).toISOString();
    sec.freezeReason = '紧急登录重置';
  }
  sec.emergency = { stage: 'rebind-required', at: formatNow(), dynamicHours, kyc1 };
  saveUserSecurity(currentUser.id, sec);
  pushSecurityAlert('账户安全项已紧急重置（GA 与通行密钥已解绑）');
  pushSecurityHistory('紧急重置：解绑 GA/通行密钥', '紧急登录');
  return { ok: true, dynamicHours, kyc1 };
}

export function getEmergencyState() { return getUserSecurity().emergency; }

// 阻断式重绑完成：清除中间态
export function finishEmergencyRebind() {
  const sec = getUserSecurity();
  sec.emergency = null;
  saveUserSecurity(currentUser.id, sec);
  pushSecurityHistory('紧急重置：绑定新安全项', '重绑流程');
  return { ok: true };
}

// ---- C 端修改登录密码（规格 5.2 敏感操作清单第一项）----
// 密码覆盖持久化（同后台 ADMIN_PWD_KEY 模式）：zhifu-user-pwd；LoginPage 校验时优先读覆盖
const USER_PWD_KEY = 'zhifu-user-pwd';
export function getUserPasswordOverride() {
  try { return JSON.parse(localStorage.getItem(USER_PWD_KEY) || 'null'); } catch (e) { return null; }
}

export function changeUserPassword(newPassword) {
  // 密码策略（2026-10-15 与注册口径统一：至少8位，含字母和数字）
  if (!newPassword || newPassword.length < 8) return { ok: false, message: '密码至少需要 8 个字符' };
  if (!/(?=.*[A-Za-z])(?=.*\d)/.test(newPassword)) return { ok: false, message: '密码需同时包含字母和数字' };
  try { localStorage.setItem(USER_PWD_KEY, JSON.stringify({ password: newPassword })); } catch (e) { return { ok: false, message: '保存失败' }; }
  pushSecurityHistory('修改登录密码', '安全验证');
  pushSecurityAlert('登录密码已被修改');
  triggerSecurityFreeze(24, '修改密码');
  // UC 事件④（§9.8）：改密全端失效（总 Token+RT）；原型单设备，以提示语义演示「已注销所有端会话」，
  // 本端强制重新登录由 SecurityCenter 固定文案页执行
  console.log('[Mock] 已注销该账户所有端的会话（UC 事件④ 全端失效）');
  return { ok: true, message: '密码已修改' };
}

// ---- 演示重置钩子：恢复被紧急登录/测试改动的安全档案 ----
export function resetUserSecurityDemo(userId) {
  const uid = userId || currentUser.id;
  delete userSecurityStore[uid];
  persistSecurityStore();
  Storage.save(); // 双通道同步：只清独立 key 时，主快照里的旧 userSecurityStore 会在刷新后复活
  return { ok: true };
}

// ---- 账号删除（2026-10-21 上架合规：Apple 5.1.1(v) 支持注册即须支持 app 内删除）----
// 数据层校验：有进行中问卷/未办结事项（非 rejected/cancelled）→ 拒绝，须客服处理。
// 演示边界：内置演示账号（u1–u3）为登录矩阵锚点，不真删——demo:true 由 UI 以「演示模式」文案收尾；
// 本轮注册账号的删除与持久化语义由研发正式 build 承接。
export function deleteUserAccount(userId) {
  const uid = userId || currentUser.id;
  const holding = subscriptions.find(s =>
    s.investorNo === getInvestorNo(uid) && s.status !== 'rejected' && s.status !== 'cancelled');
  if (holding) return { ok: false, message: '您有进行中的问卷或未办结事项，暂无法删除账户，请联系客服处理' };
  return { ok: true, demo: /^u\d+$/.test(uid) };
}

// ========== 问卷提交（含 waitlist 自动入队） ==========

// ========== 问卷提交资格校验（2026-08-17 · 强制 PI/KYC 资格，香港 SFC 私募仅限专业投资者） ==========
// 提交前必须：KYC 实名认证通过 + PI 专业投资者资格有效（未认证/审核中/被拒/过期均不可提交）。
// 返回 { ok: true } 通过；{ ok: false, target, labelKey } 未通过——target=应跳转的认证页路径，
// labelKey=引导文案（简体中文原文即 i18n key，ProjectDetail CTA / SubscribeSheet 防御校验共用）
export function getSubscriptionGate(user) {
  const u = user || currentUser;
  if (u.kyc_status !== KYC_STATUS.APPROVED) {
    return { ok: false, target: 'kyc-start', labelKey: '完成实名认证后再提交问卷' };
  }
  const pi = u.pi || {};
  const status = pi.status || 'none';
  if (status === 'pending') {
    return { ok: false, target: 'pi-submitted', labelKey: 'PI 认证审核中，暂不可提交问卷' };
  }
  if (status === 'verified' && pi.expiresAt) {
    const ts = new Date(String(pi.expiresAt).replace(' ', 'T')).getTime();
    if (!Number.isNaN(ts) && ts < Date.now()) {
      return { ok: false, target: 'kyc-pi', labelKey: 'PI 认证已过期，请重新认证' };
    }
  }
  if (status !== 'verified') {
    // none（未申报）/ rejected（被拒）/ 其他未认证态
    return { ok: false, target: 'kyc-pi', labelKey: '完成专业投资者认证后再提交问卷' };
  }
  return { ok: true };
}

export function submitSubscription({ project, amount, currency = 'HKD' }) {
  const now = formatNow();
  const newSub = {
    id: `s${Date.now()}`,
    orderNo: genOrderNo('SUB', now),
    userId: currentUser.id,
    investorNo: getInvestorNo(currentUser.id),
    investorName: currentUser.name,
    projectId: project.id,
    projectName: project.title,
    amount: amount || 0,
    currency,
    status: 'submitted',
    createdAt: now,
    updatedAt: now,
    allocatedAt: null,
    freezeDeadline: null,
    frozenAmount: 0,
    notes: '意向已登记，等待线下协调额度',
    shares: null,
    // 合规字段（2026-08-26）：风险确认 + 文件查看追踪 + amlFlags（T9 大额自动触发填充）
    riskAcknowledgement: { confirmed: true, confirmedAt: now, ipAddress: '127.0.0.1' },
    documentViewLogs: [],
    amlFlags: [],
    history: [
      { type: 'submitted', timestamp: now, actor: 'user', note: (amount || 0) > 0 ? `提交问卷 · 意向金额 HK$ ${formatCurrency(amount || 0)}` : '提交问卷 · 无投资意向' },
    ],
  };
  subscriptions.unshift(newSub);
  // T9 大额交易自动触发（PRD 04 §3.8）：意向金额 ≥300万 → 自动创建大额审查记录 + 打 amlFlags
  // 三级阈值：300万=一级 / 500万=二级 / 800万=三级（与 REVIEW_LEVEL 对齐）
  if ((amount || 0) >= 3000000) {
    const review = createLargeTransactionReview({ subscriptionId: newSub.id, userId: currentUser.id, amount: amount || 0 });
    if (review) {
      newSub.amlFlags.push({
        type: 'large_transaction',
        level: review.reviewLevel === REVIEW_LEVEL.LEVEL_3 ? 'three' : review.reviewLevel === REVIEW_LEVEL.LEVEL_2 ? 'two' : 'one',
        status: COMPLIANCE_STATUS.PENDING,
        reviewId: review.id,
        triggeredAt: now,
        resolvedAt: null,
        resolvedBy: null,
        resolutionNote: null,
      });
      pushNotification({
        type: 'subscription',
        title: '大额交易审查',
        body: `您填写的意向档位触发大额交易审查（${review.reviewLevel === REVIEW_LEVEL.LEVEL_3 ? '三级' : review.reviewLevel === REVIEW_LEVEL.LEVEL_2 ? '二级' : '一级'}），审查通过后方可转客户经理跟进。`,
        createdAt: now,
      });
    }
  }
  // waitlist = 项目下 submitted 问卷的派生视图（FIFO by createdAt），无需冗余入队
  // 2026-10-22 RO 整改：申购热度（投资人名单/位次）随 SPV 口径一并移除
  // investorCount 语义 = mock 生成基数（其他投资人），新提交（当前用户）不改变它
  // T10 异常检测：申购事件触发规则扫描（R001 单笔大额 / R002 大额集中 / R003 频繁申购）
  runAnomalyDetection(currentUser.id, 'subscription', { amount: amount || 0, date: now });
  // T11 PEP 交易监控：PEP 客户申购自动标记
  runPepMonitoring(currentUser.id, 'subscription', { amount: amount || 0, currency });
  pushNotification({
    type: 'subscription',
    title: '问卷已提交',
    body: (amount || 0) > 0
      ? `您已成功提交 ${project.title} 问卷（意向金额 HK$ ${formatCurrency(amount || 0)}），客户经理将与您联系。`
      : `您已成功提交 ${project.title} 问卷（本次未表达投资意向），如需进一步了解，客户经理将与您联系。`,
    createdAt: now,
  });
  logAudit({ operator: currentUser.name || '投资人', category: 'subscription', action: 'submit', target: project.title, targetId: project.id, note: (amount || 0) > 0 ? `提交问卷（HK$ ${formatCurrency(amount || 0)}）` : '提交问卷（无投资意向）' });
  Storage.save();
  return newSub;
}

// ========== 持久化层（2026-08-10） ==========
// 演示阶段：localStorage 持久化核心业务数据，刷新不丢失进度
// 接后端时替换为 API 调用

// 3：2026-08-12 报名管理重构——eventRegistrationsList 扩充（线上无凭证码）+ event.registered 名单派生 + e6 capacity 清理
//   旧快照（2）的名单结构与新口径不兼容，强制重置以便演示完整名单
// 4：2026-08-13 KYC 审核队列扩充（k4-k9 覆盖多状态/多证件，测试/演示素材）——旧快照（3）仅含 k1-k3，重置展示新数据
// 5：2026-08-13 申购记录多用户化扩充（11→19 条，p1/p2/p3/p4/p6 各增 2 条，覆盖各状态）——旧快照（4）仅含 11 条，重置展示完整数据
// 6：2026-08-13 用户管理 + 审计日志（新增 getInvestorUsers / disabledUserIds / auditLogs / userAccountManagers 持久化）——旧快照（5）缺新字段，重置展示完整 mock
// 7：2026-08-14 资金运营重构（dr1/wr1 预置数据补 currency 字段——数据结构变更）——旧快照（6）dr1 无 currency 导致 approveDepositRequest 的 req.currency.toLowerCase() 崩溃，重置展示完整字段
// 8：2026-08-14 资金功能补单号（各实体加 orderNo 业务单号 + bankRef 外部银行参考号 + genOrderNo 生成函数——数据结构变更）——旧快照（7）缺单号字段，重置展示完整 mock
// 9：2026-08-14 资金审核抽屉整改（dr1/wr1 拆 bank/cardNo 字段 + bankCards 补 cardNo 完整卡号 + 提交函数拆参——数据结构变更）——旧快照（8）bankCard 单字符串不兼容，重置
// 10：2026-08-14 资金审核体验（deposit/withdrawRequests 扩充至各 4 条覆盖 pending/approved/rejected 多用户多币种——数据集合变更）——旧快照（9）仅各 1 条，重置体验筛选 4 态
// 11：2026-08-14 资金流水查询体验（transactions 4→22 条覆盖 5 类型 + 06-08 月多日期区间——数据集合变更）——旧快照（10）仅 4 条，重置体验类型/时间/搜索/分页
// 12：2026-08-14 投后分红（新增 dividendRequests + holdings.dividendReceived + transactions type dividend——数据结构变更）——旧快照（11）无分红实体，重置展示新功能
// 13：2026-08-14 SPV 管理（新增 spvs 投后资产档案实体——数据结构变更）——旧快照（12）无 SPV 档案，重置展示新功能
// 14：2026-08-14 通知触达广播台账化（新增 broadcastLogs 广播台账实体 + NOTICE_TYPE_META——数据结构变更）——旧快照（13）无广播台账，重置展示新功能
// 15：2026-08-14 PI 认证独立审核流（新增 piSubmissions 独立实体 + PI_STATUS + KYC 不再自动置 PI——数据结构变更）——旧快照（14）无 PI 审核队列且 isPI 与 KYC 捆绑，重置展示独立审核
// 16：2026-08-14 系统配置页整改（amountPresets 可配置化 + 新增 platformAccounts 平台资金账户——数据结构变更）——旧快照（15）无档位配置/资金账户，重置展示新功能
// 17：2026-08-14 配置页清单化（新增 platformBrand 平台品牌信息——数据结构变更）——旧快照（16）无品牌信息，重置展示新配置项
// 18：2026-08-15 SPV 签署证据台账（新增 signingEvidence 实体 + spvs 加 agreementDocUrl/agreementVersion/agreementHash 协议引用——数据结构变更）——旧快照（17）无签署证据/协议字段，重置展示合规留痕
// 19：2026-08-19 线下资金闭环（平台账户改星展 + bankCards 白名单字段 + depositRequests 凭证/requires_evidence 态 + 新增 exchangeRequests/verificationRequests/eddaAuth + usd/cny frozen——数据结构变更）——旧快照（18）缺新字段，重置展示新功能
// 20：2026-08-20 入金核销体验数据扩充（depositRequests 新增 dr6-dr9 待处理覆盖多币种/多通道/多银行 + dr10/dr11 已通过带 actualAmount 差异留痕——数据集合变更）——旧快照（19）缺体验数据，重置展示核销场景
// 21：2026-08-20 凭证可查看 + 实际到账改手工录入（evidence 增加 preview 模拟银行回单字段 + 上传/补传自动生成；approveDepositRequest 注释更新为方案 B——数据结构变更）——旧快照（20）凭证无预览且核销预填，重置展示新流程
// 21：2026-08-20 凭证可查看 + 实际到账改手工录入（evidence 增加 preview 模拟银行回单字段 + 上传/补传自动生成；approveDepositRequest 注释更新为方案 B——数据结构变更）——旧快照（20）凭证无预览且核销预填，重置展示新流程
// 22：2026-08-21 SPV 计划募集金额 + 获配实际配额（spvs 加 planAmount 字段——数据结构变更）——旧快照（21）SPV 无计划募集锚点无法展示认缴进度，重置展示新字段
// 23：2026-08-21 冲刷开发期 HMR 竞态脏快照（v22 改动过程中旧闭包把无 planAmount 的 spvs 以 v23 落盘）——仅开发环境影响，重置后 mock 为权威初始态
// 24：2026-08-21 持仓退出事件驱动重构（exitRequests 审批域删除，新增 exitEvents 分配事件实体 + 盈亏拆分/Carry 计算——数据结构变更）——旧快照（23）为"随时赎回"旧模型，重置展示新流程
// 26：2026-08-24 在线客服双端闭环（新增 supportTickets 会话实体 + 角色权限管理——数据结构变更）——旧快照（25）无客服会话，重置展示双端对话
// 27：2026-08-27 合规功能 T1-T11（amlFlags 统一 PRD 结构 {type,level,triggeredAt,resolvedAt,resolvedBy,resolutionNote}；transaction amlFlags string→object；
//     新增大额交易审查/异常检测/STR/EDD mock 数据；新增 ekycResult 字段——数据结构变更）——旧快照（26）amlFlags 字段不齐且缺合规实体演示数据，重置展示完整合规工作台
// 28：2026-09-15 协议签署实践对齐（signingEvidence 字段改造 envelopeId→signedRef + signatureImage/source；
//     新增 agreementRecords 协议签署留痕 / termsState 条款版本——数据结构变更）——旧快照（27）签署证据无签名图/来源，重置展示 APP 内签署闭环
// 30：2026-09-15 KYC 回归纯 CDD（用户裁决：KYC 内「用户声明」「电子签名法律效力」模块移除——签署责任收敛到注册/PI/SPV 三节点；
//     预置 kycSubmissions 快照与 submitKyc 写入的 signatureImage/kycAgreementVersion/kycAgreedAt 字段删除、agreementRecords 预置 ar2 删除——数据结构变更）
//     ——旧快照（29）KYC 数据含幽灵签名字段，重置后 KYC 链路无签署残留
// 31：2026-09-22 2FA 双重验证体系（新增 userSecurityStore 用户安全档案持久化：GA/Passkey/冻结/安全历史/紧急登录中间态
//     ——数据结构变更）——旧快照（30）无安全档案，重置展示完整 2FA 矩阵
// 32：2026-10-15 集团品牌令：APP 名称统一 HKBTC（platformBrand/基金名/活动/后台账号邮箱/法务文本全量替换
//     ——数据内容变更）——旧快照（31）持久化层带「财富/Wealth Capital」旧品牌，重置后以 HKBTC mock 为权威初始态
// 33：2026-10-19 帮助 FAQ 三语化 + 后台可配置（faqItems 结构升级为 AG 三语对象——数据结构变更）——旧快照（32）FAQ 为纯字符串，重置后用新结构
// 34：2026-10-19 清理配置走查期间的 FAQ 测试条目（走查新增数据经 Storage 落盘后，reset 钩子按设计不还原配置类数据，以版本递进恢复出厂）
// 35：2026-10-21 首期上架命名定版：APP 名称 HighBlock（platformBrand/基金名/研究院/账号邮箱/附件名/ics 全量替换；上架主体 HighBlock Securities Limited
//     ——数据内容变更）——旧快照（34）持久化层带 HKBTC 品牌，重置后以 HighBlock mock 为权威初始态
// 36：2026-10-21 牌照号回填真实值 (F)256390（platformBrand.licenseNo，BLA1234 为 mock 假号）——数据内容变更。
//     ⚠ 教训：platformBrand 属快照恢复范围，改其任何字段必须同步升 STATE_VERSION——35 升版先于牌照号修改，
//     老会话 v35 快照的旧 licenseNo 复活，About 页显示回 BLA1234（用户实测发现）
// 37：2026-10-21 剥离短信通道（登录/注册/找回/2FA/敏感操作改邮箱；账户级手机移除；活动报名手机保留
//     ——数据内容与结构变更）——旧快照（36）含手机号与短信文案，重置后以邮箱单通道 mock 为权威初始态
// 38：2026-10-21 上架/持牌主体全称定稿 HighBlock Securities Limited（platformBrand.nameFullZh/nameEn +
//     上架材料/会议材料全量替换）——platformBrand 属快照恢复范围，必须升版，避免旧主体名复活
// 39：2026-10-21 修复 PI 队列错挂（pi1 陈美琪不再挂 u3）+ PI 状态派生不再依赖 currentUser 单例
// 40：2026-10-21 陈美琪 KYC k1 + PI pi1 统一到独立账号 u35（避免与 u8 赵明轩重复 userId）
// 41：2026-10-21 补 u2/u3 专属顾问映射（testAccounts.accountManager 与后台投资人视图对齐）
// 42：2026-10-22 RO 合规整改 10 条一次性落地——① 牌照号 (F)256390 → BWW124 且全端统一 SFC NO 措辞（无 CE No.）；
//     ② 登录页「登录您的账户」→「登录专属账户」，开户闸门去「基金服务」措辞；③ 申购热度（投资人名单 + 我的位次）
//     与热度页整块移除；④ 申购链路改问卷口径（了解详情 / 问卷调查 / 文件已提交 / 新增「无意向」档位、删 300 万档）；
//     ⑤ SPV 概念整体移除（spvs 档案 / 签署证据台账 / APP 内签署页 / 投后分红 SPV 粒度 / 冻结扣款残留一并下线）；
//     ⑥ 合规报告（页面 + 数据 + FAQ）移除；⑦ 后台「申购记录」→「问卷记录」，状态展示改 文件已提交 / 客户经理跟进中 / 已完成
//     ——数据结构与数据内容变更，旧快照（41）含 SPV 档案与旧牌照号，重置后以新口径 mock 为权威初始态
// 44：2026-10-22 牌照范围 9 类 → 1/4/9 类（正式风险披露声明载明 Type 1/4/9，platformBrand 属快照范围须升版）
// 43：2026-10-22 问卷档位定版（仅保留 无意向 / 100万 / 500万 / 自定义，删 1000 万档）
//     ——amountPresets 属快照恢复范围，必须升版，否则老会话（42）恢复旧五档数组，界面仍显示 1000 万
const STATE_VERSION = 44;
const STORAGE_KEY = 'zhifu-app-state';

/**
 * 持久化状态快照（不含 Set，因为 Set 不可 JSON 序列化）
 * registeredEventIds 用 Array 代替 Set
 */
const PERSIST_KEYS = ['wallet', 'subscriptions', 'holdings', 'transactions', 'notifications', 'registeredEventIds_arr'];

export const Storage = {
  save() {
    try {
      const snapshot = {
        version: STATE_VERSION,
        savedAt: Date.now(),
        wallet: wallet,
        assetHistory: assetHistory,
        subscriptions: subscriptions,
        // 基金一期（2026-10-28）：追加型实体，旧快照缺 key 时保持默认空数组，
        // 因此不需要升 STATE_VERSION（升版会把 KYC/PI/协议/审计整包重置）
        fundOrders: fundOrders,
        fundHoldings: fundHoldings,
        fundStatements: fundStatements,
        holdings: holdings,
        transactions: transactions,
        notifications: notifications,
        registeredEventIds_arr: Array.from(registeredEventIds),
        eventRegistrationsList: eventRegistrationsList,
        leadFollowups: leadFollowups,   // 客户跟进日志（CRM 留痕持久化，2026-08-12）
        depositRequests: depositRequests,
        withdrawRequests: withdrawRequests,
        exchangeRequests: exchangeRequests,       // 换汇申请（2026-08-19 人工换汇）
        verificationRequests: verificationRequests, // 银行卡白名单验证（2026-08-19）
        eddaAuth: eddaAuth,                       // eDDA 快捷入金授权状态（2026-08-19）
        exitEvents: exitEvents,                   // 持仓退出·事件驱动分配（2026-08-21 重构，替代 exitRequests）
        dividendRequests: dividendRequests,   // 投后分红（2026-08-14）
        agreementRecords: agreementRecords,   // 协议签署留痕（2026-09-15 · 注册/KYC/PI/银行卡/条款重同意）
        termsState: termsState,               // 条款版本与用户已同意版本（2026-09-15 · 条款更新重新同意）
        broadcastLogs: broadcastLogs,         // 广播台账（2026-08-14 通知触达广播台账化）
        supportTickets: supportTickets,       // 在线客服会话（2026-08-24 双端闭环）
        kycSubmissions: kycSubmissions,
        piSubmissions: piSubmissions,         // PI 认证审核队列（2026-08-14 独立审核流）
        projects: projects,   // 后台 CRUD 内容持久化（2026-08-12）
        events: events,       // 后台 CRUD 内容持久化（2026-08-12）
        faqItems: faqItems,   // 帮助 FAQ（2026-10-19 三语化 + 后台可配置）
        // 系统配置持久化（2026-08-12 规范审查 P1-④：配置中心"已保存"需刷新保留）
        sectors: sectors,
        exchangeRates: exchangeRates,
        businessContact: businessContact,
        amountPresets: amountPresets,       // 问卷金额档位可配置化（2026-08-14）
        platformAccounts: platformAccounts, // 平台资金账户（2026-08-14）
        platformBrand: platformBrand,       // 平台品牌信息（2026-08-14 配置页清单化）
        // 用户管理 + 审计日志持久化（2026-08-13 P0）
        auditLogs: auditLogs,
        disabledUserIds_arr: Array.from(disabledUserIds),
        userAccountManagers: userAccountManagers,
        // 合规数据持久化（2026-08-26 新增）
        enhancedDueDiligence: enhancedDueDiligence,
        strReports: strReports,
        anomalyDetectionLogs: anomalyDetectionLogs,
        largeTransactionReviews: largeTransactionReviews,
        pepRecords: pepRecords,
        nomineeRisks: nomineeRisks,
        crossBorderTransactions: crossBorderTransactions,
        // 2FA 用户安全档案（2026-09-22 · GA/Passkey/冻结/历史/紧急登录中间态）
        userSecurityStore: userSecurityStore,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch (e) {
      // localStorage 不可用（隐私模式/满/SSR），静默忽略
    }
  },

  load(resetTarget) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || data.version !== STATE_VERSION) return false;

      // wallet：restore hkd.frozen（其他字段保持 JS 对象引用，mock 数据无需深拷贝）
      if (data.wallet) {
        wallet.hkd.balance = data.wallet.hkd?.balance ?? wallet.hkd.balance;
        wallet.hkd.frozen = data.wallet.hkd?.frozen ?? 0;
        wallet.usd.balance = data.wallet.usd?.balance ?? wallet.usd.balance;
        wallet.usd.frozen = data.wallet.usd?.frozen ?? 0;   // 换汇冻结位（2026-08-19）
        wallet.cny.balance = data.wallet.cny?.balance ?? wallet.cny.balance;
        wallet.cny.frozen = data.wallet.cny?.frozen ?? 0;   // 换汇冻结位（2026-08-19）
      }
      // assetHistory：restore 最新 total（每月一条记录，mock 数据共 12 条）
      if (Array.isArray(data.assetHistory) && data.assetHistory.length > 0) {
        assetHistory.length = 0;
        data.assetHistory.forEach(m => assetHistory.push(m));
      }
      // subscriptions：替换引用（保留 mock 默认值作为 fallback）
      // resetTarget 时跳过该 subscription，恢复时它留在 mock 初始状态（allocated）
      if (Array.isArray(data.subscriptions)) {
        subscriptions.length = 0;
        data.subscriptions.forEach(s => {
          if (s.id !== resetTarget) subscriptions.push(s);
        });
      }
      // holdings
      if (Array.isArray(data.holdings)) {
        holdings.length = 0;
        data.holdings.forEach(h => holdings.push(h));
      }
      // 基金实体（2026-10-28 一期 + P2）：旧快照无这些 key → 保持 mock 种子值。
      // P2 的迁移判据是 holding.redeemedShares 缺失：那时持仓是「26 周前确认」的口径，
      // 而赎回要求锁定期（24 个月）已过，旧种子会永远显示「锁定期至 2028-04」——
      // 直接跳过旧快照、回到模块种子（26 个月前），演示才走得通。
      const legacyFundSnapshot = Array.isArray(data.fundHoldings)
        && data.fundHoldings.some(h => h.redeemedShares === undefined);
      if (Array.isArray(data.fundOrders) && !legacyFundSnapshot) {
        fundOrders.length = 0;
        data.fundOrders.forEach(o => fundOrders.push(o));
      }
      if (Array.isArray(data.fundHoldings) && !legacyFundSnapshot) {
        fundHoldings.length = 0;
        data.fundHoldings.forEach(h => fundHoldings.push(h));
      }
      if (Array.isArray(data.fundStatements) && !legacyFundSnapshot) {
        fundStatements.length = 0;
        data.fundStatements.forEach(s => fundStatements.push(s));
      }
      // transactions
      if (Array.isArray(data.transactions)) {
        transactions.length = 0;
        data.transactions.forEach(t => transactions.push(t));
      }
      // T1：旧快照可能含字符串/旧字段 amlFlags，恢复后重新归一化（模块级迁移被 load 覆盖的兜底）
      normalizeSubscriptionAmlFlags();
      normalizeTransactionAmlFlags();
      // notifications
      if (Array.isArray(data.notifications)) {
        notifications.length = 0;
        data.notifications.forEach(n => notifications.push(n));
      }
      // registeredEventIds
      if (Array.isArray(data.registeredEventIds_arr)) {
        registeredEventIds_arr.length = 0;
        data.registeredEventIds_arr.forEach(id => {
          registeredEventIds_arr.push(id);
          registeredEventIds.add(id);
        });
      }
      // 报名名单 / 资金申请 / 退出申请 / KYC 审核队列
      if (Array.isArray(data.eventRegistrationsList)) {
        eventRegistrationsList.length = 0;
        data.eventRegistrationsList.forEach(r => eventRegistrationsList.push(r));
      }
      syncEventRegistered(); // 名单恢复后重算 event.registered（口径单一真源）
      // 客户跟进日志（缺省 = mock 预置，向后兼容旧快照）
      if (Array.isArray(data.leadFollowups)) {
        leadFollowups.length = 0;
        data.leadFollowups.forEach(f => leadFollowups.push(f));
      }
      if (Array.isArray(data.depositRequests)) {
        depositRequests.length = 0;
        data.depositRequests.forEach(r => depositRequests.push(r));
      }
      if (Array.isArray(data.withdrawRequests)) {
        withdrawRequests.length = 0;
        data.withdrawRequests.forEach(r => withdrawRequests.push(r));
      }
      if (Array.isArray(data.exchangeRequests)) {
        exchangeRequests.length = 0;
        data.exchangeRequests.forEach(r => exchangeRequests.push(r));
      }
      if (Array.isArray(data.verificationRequests)) {
        verificationRequests.length = 0;
        data.verificationRequests.forEach(r => verificationRequests.push(r));
      }
      if (data.eddaAuth) {
        eddaAuth.status = data.eddaAuth.status || 'unauthorized';
        eddaAuth.authorizedAt = data.eddaAuth.authorizedAt || null;
      }
      if (Array.isArray(data.exitEvents)) {
        exitEvents.length = 0;
        data.exitEvents.forEach(r => exitEvents.push(r));
      }
      if (Array.isArray(data.dividendRequests)) {
        dividendRequests.length = 0;
        data.dividendRequests.forEach(r => dividendRequests.push(r));
      }
      // 协议签署留痕 + 条款版本（2026-09-15 · 协议签署实践对齐）
      if (Array.isArray(data.agreementRecords)) {
        agreementRecords.length = 0;
        data.agreementRecords.forEach(r => agreementRecords.push(r));
      }
      if (data.termsState) {
        termsState.currentVersion = data.termsState.currentVersion || termsState.currentVersion;
        termsState.agreedVersion = data.termsState.agreedVersion ?? termsState.agreedVersion;
        termsState.updatedAt = data.termsState.updatedAt || termsState.updatedAt;
      }
      if (Array.isArray(data.broadcastLogs)) {
        broadcastLogs.length = 0;
        data.broadcastLogs.forEach(l => broadcastLogs.push(l));
      }
      if (Array.isArray(data.supportTickets)) {
        supportTickets.length = 0;
        data.supportTickets.forEach(t => supportTickets.push(t));
      }
      if (Array.isArray(data.kycSubmissions)) {
        kycSubmissions.length = 0;
        data.kycSubmissions.forEach(r => kycSubmissions.push(r));
      }
      if (Array.isArray(data.piSubmissions)) {
        piSubmissions.length = 0;
        data.piSubmissions.forEach(r => piSubmissions.push(r));
      }
      // 项目/路演内容（后台 CRUD 持久化，2026-08-12）
      if (Array.isArray(data.projects)) {
        projects.length = 0;
        data.projects.forEach(p => projects.push(p));
      }
      if (Array.isArray(data.events)) {
        events.length = 0;
        data.events.forEach(e => events.push(e));
      }
      // 系统配置恢复（2026-08-12 P1-④）：字段缺省时保持 mock 默认值（向后兼容旧快照）
      if (Array.isArray(data.sectors)) {
        sectors.length = 0;
        data.sectors.forEach(s => sectors.push(s));
      }
      // 帮助 FAQ（2026-10-19 后台可配置；空/缺省 = mock 预置）
      if (Array.isArray(data.faqItems)) {
        faqItems.length = 0;
        data.faqItems.forEach(f => faqItems.push(f));
      }
      if (data.exchangeRates) {
        Object.keys(exchangeRates).forEach(k => delete exchangeRates[k]);
        Object.keys(data.exchangeRates).forEach(k => { exchangeRates[k] = data.exchangeRates[k]; });
      }
      if (data.businessContact) {
        Object.keys(businessContact).forEach(k => delete businessContact[k]);
        Object.keys(data.businessContact).forEach(k => { businessContact[k] = data.businessContact[k]; });
      }
      // 申购金额档位恢复（可配置化，2026-08-14；缺省 = mock 初始）
      if (Array.isArray(data.amountPresets) && data.amountPresets.length > 0) {
        amountPresets.length = 0;
        data.amountPresets.forEach(p => amountPresets.push(p));
      }
      // 平台资金账户恢复（2026-08-14；缺省 = mock 初始）
      if (data.platformAccounts) {
        Object.keys(platformAccounts).forEach(k => delete platformAccounts[k]);
        Object.keys(data.platformAccounts).forEach(k => { platformAccounts[k] = data.platformAccounts[k]; });
      }
      // 平台品牌信息恢复（2026-08-14 配置页清单化；缺省 = mock 初始）
      // 2026-10-19 改 merge：旧快照无新增字段（licenseType 等）时保留 mock 缺省，防「先删后拷」丢字段渲染 undefined
      if (data.platformBrand) {
        Object.keys(data.platformBrand).forEach(k => { platformBrand[k] = data.platformBrand[k]; });
      }
      // 用户管理 + 审计日志恢复（缺省 = mock 预置，向后兼容）
      if (Array.isArray(data.auditLogs)) {
        auditLogs.length = 0;
        data.auditLogs.forEach(l => auditLogs.push(l));
      }
      if (Array.isArray(data.disabledUserIds_arr)) {
        disabledUserIds.clear();
        data.disabledUserIds_arr.forEach(id => disabledUserIds.add(id));
      }
      if (data.userAccountManagers) {
        userAccountManagers = {};
        Object.assign(userAccountManagers, data.userAccountManagers);
      }
      // 2FA 用户安全档案恢复（2026-09-22；缺省 = 演示种子，向后兼容）
      if (data.userSecurityStore) {
        userSecurityStore = data.userSecurityStore;
      }
      // 合规数据恢复（2026-08-26 新增；缺省 = mock 预置，向后兼容）
      if (Array.isArray(data.enhancedDueDiligence)) {
        enhancedDueDiligence.length = 0;
        data.enhancedDueDiligence.forEach(r => enhancedDueDiligence.push(r));
      }
      if (Array.isArray(data.strReports)) {
        strReports.length = 0;
        data.strReports.forEach(r => strReports.push(r));
      }
      if (Array.isArray(data.anomalyDetectionLogs)) {
        anomalyDetectionLogs.length = 0;
        data.anomalyDetectionLogs.forEach(r => anomalyDetectionLogs.push(r));
      }
      if (Array.isArray(data.largeTransactionReviews)) {
        largeTransactionReviews.length = 0;
        data.largeTransactionReviews.forEach(r => largeTransactionReviews.push(r));
      }
      if (Array.isArray(data.pepRecords)) {
        pepRecords.length = 0;
        data.pepRecords.forEach(r => pepRecords.push(r));
      }
      if (Array.isArray(data.nomineeRisks)) {
        nomineeRisks.length = 0;
        data.nomineeRisks.forEach(r => nomineeRisks.push(r));
      }
      if (Array.isArray(data.crossBorderTransactions)) {
        crossBorderTransactions.length = 0;
        data.crossBorderTransactions.forEach(r => crossBorderTransactions.push(r));
      }
      return true;
    } catch (e) {
      return false;
    }
  },

  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) { /* ignore */ }
  },
};

/**
 * App 渲染前调用一次，从 localStorage 恢复状态
 * resetTarget: 若为 subscription id，则跳过恢复该 subscription（保留 mock 初始状态）
 * 返回是否成功加载了持久化数据
 */
export function initState(resetTarget) {
  migrateContactKeys(); // 旧手机/短信持久化键清理（一次性）
  loadSecurityStore(); // 2FA 安全档案独立 key，先于快照恢复（2026-09-22）
  return Storage.load(resetTarget);
}

// 一次性迁移：清理短信时代遗留的独立 localStorage 键（快照版本升级不会清它们）
const CONTACT_MIGRATION_KEY = 'zhifu-contact-migration-v37';
function migrateContactKeys() {
  try {
    if (localStorage.getItem(CONTACT_MIGRATION_KEY)) return;
    localStorage.removeItem('zhifu-user-security');
    localStorage.removeItem('zhifu-admin-users');
    const remembered = localStorage.getItem('zhifu-remember-email');
    if (remembered && !remembered.includes('@')) localStorage.removeItem('zhifu-remember-email');
    localStorage.setItem(CONTACT_MIGRATION_KEY, '1');
  } catch (e) { /* 隐私模式静默 */ }
}

// ========== 审计日志（2026-08-13 · 后台 P0：全局统一留痕） ==========
// 老板 2026-08-06 拍板"全流程留痕"——此前留痕散落各模块（申购 history / KYC 审核记录 /
// 客户跟进日志 / 签到留痕），无全局视图。本模块 = 统一审计日志：谁、何时、对什么、做了什么。
// category: 业务域（project/event/registration/lead/kyc/fund/subscription/exit/user/admin/service/config）
// action:   create/update/delete/approve/reject/checkin/allocate/forfeit/promote/sign/assign/disable/enable/submit/register...
export const auditCategoryLabels = {
  project: '项目', event: '路演', registration: '报名', lead: '客户线索', kyc: '认证',
  pi: 'PI 认证', fund: '资金', subscription: '申购', exit: '退出', user: '用户', admin: '后台账号', service: '客服服务', config: '系统配置',
};

// 预置 mock 日志（覆盖各类型供演示筛选；接后端由真实操作记录替换）
export const auditLogs = [
  { id: 'a1', at: '2026-08-12 09:15:22', operator: '王运营', category: 'kyc', action: 'approve', target: '陈美琪', targetId: 'k1', note: 'KYC 审核通过（专业投资者认证）' },
  { id: 'a2', at: '2026-08-12 10:05:47', operator: '李合规', category: 'fund', action: 'approve', target: '张三', targetId: 'dr1', note: '充值确认到账 HK$ 300万' },
  { id: 'a3', at: '2026-08-12 11:30:00', operator: '系统管理员', category: 'project', action: 'update', target: 'QuantumCore Technologies', targetId: 'p1', note: '编辑项目资料（估值/上市计划）' },
  { id: 'a4', at: '2026-08-12 14:20:15', operator: '王运营', category: 'subscription', action: 'allocate', target: 'SkyNet Robotics', targetId: 's2', note: '转客户经理跟进（线下协调）' },
  { id: 'a5', at: '2026-08-12 16:45:00', operator: '张客服', category: 'lead', action: 'update', target: '吴世昌', targetId: 'u9', note: '客户跟进：新线索 → 已联系' },
  { id: 'a6', at: '2026-08-13 09:10:00', operator: '王运营', category: 'event', action: 'update', target: 'QuantumCore 线上路演', targetId: 'e1', note: '编辑路演资料（议程/看点）' },
  { id: 'a7', at: '2026-08-13 10:00:00', operator: '李合规', category: 'kyc', action: 'reject', target: '林大伟', targetId: 'k2', note: '拒绝原因：证件照片不清晰' },
  { id: 'a8', at: '2026-08-13 11:25:00', operator: '系统管理员', category: 'config', action: 'update', target: '系统配置', targetId: '', note: '签署宽限期 30s → 60s' },
  { id: 'a9', at: '2026-08-13 14:05:00', operator: '王运营', category: 'registration', action: 'checkin', target: '量子计算实验室参观', targetId: 'reg3', note: '现场签到核验（凭证码核验通过）' },
  { id: 'a10', at: '2026-08-13 15:40:00', operator: '张客服', category: 'user', action: 'assign', target: '黄俊杰', targetId: 'u16', note: '专属顾问：王慧敏 → 陈志豪' },
  { id: 'a11', at: '2026-08-13 16:00:00', operator: '系统管理员', category: 'exit', action: 'approve', target: 'GreenCell Energy', targetId: 'er1', note: '退出审批通过并回款 HK$ 360万' },
];

// 统一留痕入口：所有业务操作（后台审核/协调 + 用户侧关键动作）在数据层落审计日志
export function logAudit({ operator = '系统', category = '', action = '', target = '', targetId = '', note = '' }) {
  auditLogs.push({ id: `a${Date.now()}`, at: formatNow(), operator, category, action, target, targetId, note });
  Storage.save();
}

// ========== 系统配置（后台系统配置页可改；置于文件末尾确保依赖已初始化） ==========

// （systemConfig 聚合对象已于 2026-10-19 删除：全仓零引用的死代码，各配置真源以独立导出为准）

// ========== 合规数据模型（2026-08-26 · PRD §4.5 合规数据模型） ==========
// 基于PRD 08-数据字典 §4.5 合规数据模型设计，新增7个合规实体
// 监管依据：AMLO (Cap.615) §25A、SFC《打击洗钱及恐怖分子资金筹集指引》

// ========== 合规状态枚举 ==========
export const COMPLIANCE_STATUS = {
  PENDING: 'pending',           // 待处理
  IN_PROGRESS: 'in_progress',   // 处理中
  APPROVED: 'approved',         // 已通过
  REJECTED: 'rejected',         // 已拒绝
  CLOSED: 'closed',             // 已关闭
};

export const STR_ASSESSMENT_STATUS = {
  PENDING: 'pending',           // 待评估
  IN_PROGRESS: 'in_progress',   // 评估中
  SUSPICIOUS: 'suspicious',     // 可疑
  NOT_SUSPICIOUS: 'not_suspicious', // 不可疑
};

export const STR_REPORT_STATUS = {
  DRAFT: 'draft',               // 草稿
  PENDING_APPROVAL: 'pending_approval', // 待审批
  APPROVED: 'approved',         // 已审批
  SUBMITTED: 'submitted',       // 已提交JFIU
};

export const REVIEW_LEVEL = {
  LEVEL_1: 'level_1',           // 一级（300万-500万）
  LEVEL_2: 'level_2',           // 二级（500万-800万）
  LEVEL_3: 'level_3',           // 三级（≥800万）
};

// ========== 1. EDD记录（增强尽调） ==========
export const enhancedDueDiligence = [];

/**
 * 创建EDD记录
 * @param {Object} params - 参数
 * @param {string} params.userId - 用户ID
 * @param {string} params.triggerType - 触发类型：'pep' | 'sanctions' | 'high_risk' | 'large_transaction'
 * @param {number} params.triggerAmount - 触发金额（可选）
 * @returns {Object} 创建的EDD记录
 */
export function createEnhancedDueDiligence({ userId, triggerType, triggerAmount = 0 }) {
  const record = {
    id: `edd${Date.now()}`,
    userId,
    triggerType,
    triggerAmount,
    proofFiles: [],              // 证明文件列表
    status: COMPLIANCE_STATUS.PENDING,
    reviewNotes: '',             // 审查备注
    reviewerId: null,            // 审查人ID
    reviewTime: null,            // 审查时间
    createdAt: formatNow(),
    updatedAt: formatNow(),
  };
  enhancedDueDiligence.push(record);
  logAudit({ operator: '系统', category: 'compliance', action: 'create', target: 'EDD记录', targetId: record.id, userId, note: `触发类型：${triggerType}` });
  Storage.save();
  return record;
}

/**
 * 更新EDD记录状态
 * @param {string} eddId - EDD记录ID
 * @param {string} status - 新状态
 * @param {string} reviewerId - 审查人ID
 * @param {string} reviewNotes - 审查备注
 * @returns {boolean} 是否成功
 */
export function updateEnhancedDueDiligence(eddId, status, reviewerId, reviewNotes = '') {
  const record = enhancedDueDiligence.find(r => r.id === eddId);
  if (!record) return false;
  
  record.status = status;
  record.reviewerId = reviewerId;
  record.reviewNotes = reviewNotes;
  record.reviewTime = formatNow();
  record.updatedAt = formatNow();
  
  logAudit({ operator: reviewerId, category: 'compliance', action: 'update', target: 'EDD记录', targetId: eddId, note: `状态更新为：${status}` });
  Storage.save();
  return true;
}

// ========== 2. STR报告记录 ==========
export const strReports = [];

/**
 * 创建STR报告
 * @param {Object} params - 参数
 * @param {string} params.userId - 用户ID
 * @param {string} params.triggerSource - 触发来源：'sanctions' | 'pep' | 'anomaly' | 'manual'
 * @param {string} params.severity - 严重程度：'standard' | 'urgent'（对齐 AdminSTR SEVERITY_META 值域；2026-08-27 修正：原注释 low/medium/high 与实际调用不符）
 * @returns {Object} 创建的STR记录
 */
export function createStrReport({ userId, triggerSource, severity = 'medium' }) {
  const record = {
    id: `str${Date.now()}`,
    userId,
    triggerSource,
    severity,
    assessmentStatus: STR_ASSESSMENT_STATUS.PENDING,
    reportStatus: STR_REPORT_STATUS.DRAFT,
    assessmentNotes: '',         // 评估备注
    reportContent: '',           // 报告内容
    submittedAt: null,           // 提交JFIU时间
    jfiuReference: null,         // JFIU参考号
    createdAt: formatNow(),
    updatedAt: formatNow(),
  };
  strReports.push(record);
  logAudit({ operator: '系统', category: 'compliance', action: 'create', target: 'STR报告', targetId: record.id, userId, note: `触发来源：${triggerSource}，严重程度：${severity}` });
  Storage.save();
  return record;
}

/**
 * 更新STR评估状态
 * @param {string} strId - STR记录ID
 * @param {string} assessmentStatus - 评估状态
 * @param {string} assessmentNotes - 评估备注
 * @returns {boolean} 是否成功
 */
export function updateStrAssessment(strId, assessmentStatus, assessmentNotes = '') {
  const record = strReports.find(r => r.id === strId);
  if (!record) return false;
  
  record.assessmentStatus = assessmentStatus;
  record.assessmentNotes = assessmentNotes;
  record.updatedAt = formatNow();
  
  logAudit({ operator: 'compliance', category: 'compliance', action: 'update', target: 'STR评估', targetId: strId, note: `评估状态更新为：${assessmentStatus}` });
  Storage.save();
  return true;
}

/**
 * 更新STR报告状态
 * @param {string} strId - STR记录ID
 * @param {string} reportStatus - 报告状态
 * @param {string} reportContent - 报告内容
 * @returns {boolean} 是否成功
 */
export function updateStrReport(strId, reportStatus, reportContent = '') {
  const record = strReports.find(r => r.id === strId);
  if (!record) return false;
  
  record.reportStatus = reportStatus;
  record.reportContent = reportContent;
  if (reportStatus === STR_REPORT_STATUS.SUBMITTED) {
    record.submittedAt = formatNow();
    record.jfiuReference = `JFIU${Date.now()}`;
  }
  record.updatedAt = formatNow();
  
  logAudit({ operator: 'MLRO', category: 'compliance', action: 'update', target: 'STR报告', targetId: strId, note: `报告状态更新为：${reportStatus}` });
  Storage.save();
  return true;
}

// ========== 3. 异常检测日志 ==========
export const anomalyDetectionLogs = [];

// 7条核心检测规则定义
export const ANOMALY_RULES = {
  R001: { id: 'R001', name: '单笔大额交易', description: '单笔申购/入金 ≥ 300万港币', riskLevel: RISK_LEVEL.MEDIUM },
  R002: { id: 'R002', name: '大额集中', description: '同一用户90天内累计申购 ≥ 3000万港币', riskLevel: RISK_LEVEL.HIGH },
  R003: { id: 'R003', name: '频繁申购', description: '同一用户30天内申购次数 ≥ 3笔', riskLevel: RISK_LEVEL.MEDIUM },
  R004: { id: 'R004', name: '频繁入金', description: '同一用户7天内入金次数 ≥ 3笔', riskLevel: RISK_LEVEL.MEDIUM },
  R005: { id: 'R005', name: '频繁获配顺延', description: '同一用户30天内 ≥ 2次 allocated → unallocated', riskLevel: RISK_LEVEL.MEDIUM },
  R006: { id: 'R006', name: '入出金倒挂', description: '同一用户90天内出金 > 入金', riskLevel: RISK_LEVEL.HIGH },
  R007: { id: 'R007', name: '关联账户', description: '不同用户使用相同银行卡/IP/地址', riskLevel: RISK_LEVEL.HIGH },
};

/**
 * 创建异常检测日志
 * @param {Object} params - 参数
 * @param {string} params.userId - 用户ID
 * @param {string} params.ruleId - 规则ID（R001-R007）
 * @returns {Object} 创建的日志记录
 */
export function createAnomalyDetectionLog({ userId, ruleId }) {
  const rule = ANOMALY_RULES[ruleId];
  if (!rule) return null;
  
  const record = {
    id: `anomaly${Date.now()}`,
    userId,
    ruleId,
    ruleName: rule.name,
    riskLevel: rule.riskLevel,
    status: COMPLIANCE_STATUS.PENDING,
    detectionTime: formatNow(),
    resolutionNotes: '',         // 处理备注
    resolvedBy: null,            // 处理人
    resolvedAt: null,            // 处理时间
    createdAt: formatNow(),
  };
  anomalyDetectionLogs.push(record);
  logAudit({ operator: '系统', category: 'compliance', action: 'create', target: '异常检测日志', targetId: record.id, userId, note: `规则：${rule.name}，风险等级：${rule.riskLevel}` });
  Storage.save();
  return record;
}

/**
 * 异常交易检测引擎（T10 · PRD 04 §3.9 异常交易检测制度）
 * 7 条核心规则的事件触发扫描：在申购/入金/出金/获配顺延等业务事件后调用，
 * 命中规则则创建 anomalyDetectionLog（pending 入 compliance 待审队列）。
 * @param {string} userId - 用户ID
 * @param {'subscription'|'deposit'|'withdraw'|'freeze_release'} eventType - 事件类型
 * @param {Object} eventData - 事件数据（{ amount, date }）
 * @returns {Array} 命中的规则日志列表（未命中返回 []）
 */
export function runAnomalyDetection(userId, eventType, eventData = {}) {
  const hits = [];
  const now = formatNow();
  const date = eventData.date || now.slice(0, 10);
  const parse = (s) => { if (!s) return null; const t = new Date(s.replace(' ', 'T')).getTime(); return Number.isNaN(t) ? null : t; };

  // 当前用户最近交易（按时间倒序）
  const userTx = transactions
    .filter(t => t.userId === userId)
    .sort((a, b) => (parse(b.createdAt) || 0) - (parse(a.createdAt) || 0));
  const userSubs = subscriptions.filter(s => s.userId === userId);
  const daysAgo = (d) => {
    const t = parse(d);
    return t ? Math.floor((Date.now() - t) / 86400000) : 9999;
  };

  // 规则命中判定（避免重复记录：同规则同用户存在 pending 时不再重复触发）
  const alreadyPending = (ruleId) => anomalyDetectionLogs.some(l => l.userId === userId && l.ruleId === ruleId && l.status === COMPLIANCE_STATUS.PENDING);
  const fire = (ruleId) => {
    if (alreadyPending(ruleId)) return;
    const log = createAnomalyDetectionLog({ userId, ruleId });
    if (log) hits.push(log);
  };

  // R001 单笔大额交易：单笔申购/入金 ≥ 300万港币
  if ((eventType === 'subscription' || eventType === 'deposit') && (eventData.amount || 0) >= 3000000) {
    fire('R001');
  }

  // R002 大额集中：90 天内累计申购 ≥ 3000万港币
  if (eventType === 'subscription') {
    const sum90 = userSubs
      .filter(s => daysAgo(s.createdAt) <= 90)
      .reduce((acc, s) => acc + (s.amount || 0), 0);
    if (sum90 >= 30000000) fire('R002');
  }

  // R003 频繁申购：30 天内申购次数 ≥ 3 笔
  if (eventType === 'subscription') {
    const count30 = userSubs.filter(s => daysAgo(s.createdAt) <= 30).length;
    if (count30 >= 3) fire('R003');
  }

  // R004 频繁入金：7 天内入金次数 ≥ 3 笔
  if (eventType === 'deposit') {
    const count7 = userTx.filter(t => t.type === 'deposit' && daysAgo(t.createdAt) <= 7).length;
    if (count7 >= 3) fire('R004');
  }

  // R006 入出金倒挂：90 天内出金 > 入金
  if (eventType === 'withdraw') {
    const in90 = userTx.filter(t => t.type === 'deposit' && daysAgo(t.createdAt) <= 90).reduce((a, t) => a + t.amount, 0);
    const out90 = userTx.filter(t => t.type === 'withdraw' && daysAgo(t.createdAt) <= 90).reduce((a, t) => a + t.amount, 0);
    if (out90 > in90) fire('R006');
  }

  // R005 频繁冻结释放（30 天内 ≥ 2 次 allocated → unallocated）：由业务侧在 unallocated 事件点显式触发
  if (eventType === 'freeze_release') {
    const count30 = userSubs.filter(s => s.status === 'unallocated' && daysAgo(s.updatedAt) <= 30).length;
    if (count30 >= 2) fire('R005');
  }

  // R007 关联账户（相同银行卡/IP/地址）：由入金/出金事件在存在关联线索时显式触发
  if (eventType === 'deposit' || eventType === 'withdraw') {
    if (eventData.relatedAccounts) fire('R007');
  }

  return hits;
}

/**
 * PEP 交易监控（T11 · PRD 01 §3.15.4 PEP 交易监控规则）
 * PEP 客户（pepStatus ≠ none）交易时自动标记：
 *  - 单笔交易 ≥ 100万港币 → 自动标记，compliance 审核
 *  - 30 天内累计 ≥ 300万港币 → 自动标记
 *  - 任何跨境交易 → 自动标记
 * 命中后创建 pending 异常日志（pep_monitor 伪规则），进入 compliance 待审队列。
 * @param {string} userId - 用户ID
 * @param {'subscription'|'deposit'|'exchange'} eventType - 事件类型
 * @param {Object} eventData - 事件数据（{ amount, currency, crossBorder }）
 * @returns {Array} 命中的 PEP 监控标记日志
 */
export function runPepMonitoring(userId, eventType, eventData = {}) {
  // 非 PEP 客户不监控（testAccounts 全量账号 + pepRecords 双源判定）
  const userAccount = Object.values(testAccounts).find(a => a && a.id === userId);
  const isPep = userAccount?.pepStatus && userAccount.pepStatus !== PEP_STATUS.NONE;
  const pep = pepRecords.find(r => r.userId === userId);
  if (!isPep && !pep) return [];

  const hits = [];
  const now = formatNow();
  const amount = eventData.amount || 0;
  // 折合港币（mock：USD/CNY 简单汇率近似；HKD 原值）
  const hkdAmount = eventData.currency === 'USD' ? amount * 7.8 : eventData.currency === 'CNY' ? amount * 1.08 : amount;
  const parse = (s) => { if (!s) return null; const t = new Date(s.replace(' ', 'T')).getTime(); return Number.isNaN(t) ? null : t; };

  // 已存在未处理的 PEP 监控标记则跳过（防重复）
  const alreadyPending = anomalyDetectionLogs.some(l => l.userId === userId && l.ruleId === 'PEP01' && l.status === COMPLIANCE_STATUS.PENDING);

  const firePep = () => {
    if (alreadyPending) return;
    const record = {
      id: `anomaly${Date.now()}`,
      userId,
      ruleId: 'PEP01',
      ruleName: 'PEP 交易监控',
      riskLevel: RISK_LEVEL.HIGH,
      status: COMPLIANCE_STATUS.PENDING,
      detectionTime: now,
      resolutionNotes: '',
      resolvedBy: null,
      resolvedAt: null,
      createdAt: now,
    };
    anomalyDetectionLogs.push(record);
    logAudit({ operator: '系统', category: 'compliance', action: 'create', target: 'PEP 交易监控', targetId: record.id, userId, note: 'PEP 客户交易触发自动标记' });
    Storage.save();
    hits.push(record);
  };

  // 单笔 ≥ 100万港币
  if (hkdAmount >= 1000000) firePep();
  // 30 天累计 ≥ 300万港币（PEP 客户申购/入金）
  else if (eventType === 'subscription' || eventType === 'deposit') {
    const sum30 = transactions
      .filter(t => t.userId === userId && parse(t.createdAt) && (Date.now() - parse(t.createdAt)) <= 30 * 86400000)
      .reduce((acc, t) => acc + t.amount, 0) + hkdAmount;
    if (sum30 >= 3000000) firePep();
  }
  // 任何跨境交易
  if (eventData.crossBorder) firePep();

  return hits;
}

/**
 * 更新异常检测日志状态
 * @param {string} logId - 日志ID
 * @param {string} status - 新状态
 * @param {string} resolvedBy - 处理人
 * @param {string} resolutionNotes - 处理备注
 * @param {string} [strReportId] - 上报 STR 后关联的报告ID（可选，闭环溯源用）
 * @returns {boolean} 是否成功
 */
export function updateAnomalyDetectionLog(logId, status, resolvedBy, resolutionNotes = '', strReportId = null) {
  const record = anomalyDetectionLogs.find(r => r.id === logId);
  if (!record) return false;
  
  record.status = status;
  record.resolvedBy = resolvedBy;
  record.resolutionNotes = resolutionNotes;
  record.resolvedAt = formatNow();
  if (strReportId) record.strReportId = strReportId;
  
  logAudit({ operator: resolvedBy, category: 'compliance', action: 'update', target: '异常检测日志', targetId: logId, note: `状态更新为：${status}` });
  Storage.save();
  return true;
}

// ========== 4. 大额交易审查记录 ==========
export const largeTransactionReviews = [];

/**
 * 创建大额交易审查记录
 * @param {Object} params - 参数
 * @param {string} params.subscriptionId - 申购记录ID
 * @param {string} params.userId - 用户ID
 * @param {number} params.amount - 交易金额
 * @returns {Object} 创建的审查记录
 */
export function createLargeTransactionReview({ subscriptionId, userId, amount }) {
  // 根据金额确定审查层级
  let reviewLevel;
  if (amount >= 8000000) {
    reviewLevel = REVIEW_LEVEL.LEVEL_3;
  } else if (amount >= 5000000) {
    reviewLevel = REVIEW_LEVEL.LEVEL_2;
  } else {
    reviewLevel = REVIEW_LEVEL.LEVEL_1;
  }
  
  const record = {
    id: `ltx${Date.now()}`,
    subscriptionId,
    userId,
    amount,
    reviewLevel,
    status: COMPLIANCE_STATUS.PENDING,
    reviewerId: null,
    reviewNotes: null,
    reviewTime: null,
    createdAt: formatNow(),
    updatedAt: formatNow(),
  };
  largeTransactionReviews.push(record);
  logAudit({ operator: '系统', category: 'compliance', action: 'create', target: '大额交易审查', targetId: record.id, userId, note: `金额：HK$${amount.toLocaleString()}，审查层级：${reviewLevel}` });
  Storage.save();
  return record;
}

/**
 * 更新大额交易审查状态
 * @param {string} reviewId - 审查记录ID
 * @param {string} status - 新状态
 * @param {string} reviewerId - 审查人ID
 * @param {string} reviewNotes - 审查备注
 * @returns {boolean} 是否成功
 */
export function updateLargeTransactionReview(reviewId, status, reviewerId, reviewNotes = '') {
  const record = largeTransactionReviews.find(r => r.id === reviewId);
  if (!record) return false;
  
  record.status = status;
  record.reviewerId = reviewerId;
  record.reviewNotes = reviewNotes;
  record.reviewTime = formatNow();
  record.updatedAt = formatNow();
  
  logAudit({ operator: reviewerId, category: 'compliance', action: 'update', target: '大额交易审查', targetId: reviewId, note: `状态更新为：${status}` });
  Storage.save();
  return true;
}

// ========== 5. PEP记录 ==========
export const pepRecords = [];

/**
 * 创建PEP记录
 * @param {Object} params - 参数
 * @param {string} params.userId - 用户ID
 * @param {string} params.pepType - PEP类型：'domestic' | 'foreign' | 'international' | 'associate'
 * @param {string} params.pepCategory - PEP类别：'political' | 'government' | 'military' | 'judicial' | 'enterprise'
 * @param {string} params.position - 职务
 * @param {string} params.organization - 组织
 * @param {string} params.country - 国家
 * @returns {Object} 创建的PEP记录
 */
export function createPepRecord({ userId, pepType, pepCategory, position, organization, country }) {
  const record = {
    id: `pep${Date.now()}`,
    userId,
    pepType,
    pepCategory,
    position,
    organization,
    country,
    startDate: null,             // 任职开始日期
    endDate: null,               // 任职结束日期
    isCurrent: true,             // 是否现任
    source: 'self_declaration',  // 来源：'self_declaration' | 'third_party' | 'manual_review'
    confidenceLevel: 'high',     // 置信度：'low' | 'medium' | 'high'
    verifiedBy: null,
    verifiedAt: null,
    notes: '',
    createdAt: formatNow(),
    updatedAt: formatNow(),
  };
  pepRecords.push(record);
  logAudit({ operator: '系统', category: 'compliance', action: 'create', target: 'PEP记录', targetId: record.id, userId, note: `PEP类型：${pepType}，职务：${position}` });
  Storage.save();
  return record;
}

/**
 * 更新PEP记录
 * @param {string} pepId - PEP记录ID
 * @param {Object} updates - 更新字段
 * @returns {boolean} 是否成功
 */
export function updatePepRecord(pepId, updates) {
  const record = pepRecords.find(r => r.id === pepId);
  if (!record) return false;
  
  Object.assign(record, updates, { updatedAt: formatNow() });
  
  logAudit({ operator: 'compliance', category: 'compliance', action: 'update', target: 'PEP记录', targetId: pepId, note: 'PEP记录更新' });
  Storage.save();
  return true;
}

// ========== 6. 代持风险记录 ==========
export const nomineeRisks = [];

/**
 * 创建代持风险记录
 * @param {Object} params - 参数
 * @param {string} params.userId - 用户ID
 * @param {string} params.projectId - 项目ID
 * @returns {Object} 创建的风险记录
 */
export function createNomineeRisk({ userId, projectId }) {
  const record = {
    id: `nr${Date.now()}`,
    userId,
    projectId,
    riskLevel: RISK_LEVEL.LOW,
    riskFeatures: [],            // 风险特征列表
    detectionTime: formatNow(),
    resolutionNotes: '',
    resolvedBy: null,
    resolvedAt: null,
    createdAt: formatNow(),
    updatedAt: formatNow(),
  };
  nomineeRisks.push(record);
  logAudit({ operator: '系统', category: 'compliance', action: 'create', target: '代持风险记录', targetId: record.id, userId, note: `项目：${projectId}` });
  Storage.save();
  return record;
}

/**
 * 更新代持风险记录
 * @param {string} riskId - 风险记录ID
 * @param {Object} updates - 更新字段
 * @returns {boolean} 是否成功
 */
export function updateNomineeRisk(riskId, updates) {
  const record = nomineeRisks.find(r => r.id === riskId);
  if (!record) return false;
  
  Object.assign(record, updates, { updatedAt: formatNow() });
  
  logAudit({ operator: 'compliance', category: 'compliance', action: 'update', target: '代持风险记录', targetId: riskId, note: '代持风险记录更新' });
  Storage.save();
  return true;
}

// ========== 7. 跨境交易记录 ==========
export const crossBorderTransactions = [];

/**
 * 创建跨境交易记录
 * @param {Object} params - 参数
 * @param {string} params.userId - 用户ID
 * @param {string} params.transactionType - 交易类型：'deposit' | 'withdraw' | 'exchange'
 * @param {string} params.countryFrom - 来源国家
 * @param {string} params.countryTo - 目标国家
 * @param {number} params.amount - 交易金额
 * @returns {Object} 创建的记录
 */
export function createCrossBorderTransaction({ userId, transactionType, countryFrom, countryTo, amount }) {
  // 高风险国家列表（FATF灰名单/黑名单）
  const highRiskCountries = ['AF', 'IR', 'KP', 'MM', 'PK'];
  const riskLevel = highRiskCountries.includes(countryFrom) || highRiskCountries.includes(countryTo) 
    ? RISK_LEVEL.HIGH 
    : RISK_LEVEL.LOW;
  
  const record = {
    id: `cbt${Date.now()}`,
    userId,
    transactionType,
    countryFrom,
    countryTo,
    amount,
    riskLevel,
    detectionTime: formatNow(),
    resolutionNotes: '',
    resolvedBy: null,
    resolvedAt: null,
    createdAt: formatNow(),
  };
  crossBorderTransactions.push(record);
  logAudit({ operator: '系统', category: 'compliance', action: 'create', target: '跨境交易记录', targetId: record.id, userId, note: `交易类型：${transactionType}，${countryFrom}→${countryTo}，金额：HK$${amount.toLocaleString()}` });
  Storage.save();
  return record;
}

/**
 * 更新跨境交易记录
 * @param {string} recordId - 记录ID
 * @param {Object} updates - 更新字段
 * @returns {boolean} 是否成功
 */
export function updateCrossBorderTransaction(recordId, updates) {
  const record = crossBorderTransactions.find(r => r.id === recordId);
  if (!record) return false;
  
  Object.assign(record, updates);
  
  logAudit({ operator: 'compliance', category: 'compliance', action: 'update', target: '跨境交易记录', targetId: recordId, note: '跨境交易记录更新' });
  Storage.save();
  return true;
}

// ========== 预置合规Mock数据 ==========
// 为演示目的预置一些合规数据

// 预置PEP记录（u3用户为PEP）
export const mockPepRecords = [
  {
    id: 'pep1',
    userId: 'u3',
    pepType: PEP_STATUS.FOREIGN,
    pepCategory: 'political',
    position: '前政府部长',
    organization: '某外国政府',
    country: '某国',
    startDate: '2020-01-01',
    endDate: '2024-12-31',
    isCurrent: false,
    source: 'third_party',
    confidenceLevel: 'high',
    verifiedBy: '李合规',
    verifiedAt: '2026-08-20 10:00:00',
    notes: '通过第三方PEP数据库筛查发现',
    createdAt: '2026-08-20 10:00:00',
    updatedAt: '2026-08-20 10:00:00',
  },
];

// 预置异常检测日志
export const mockAnomalyLogs = [
  {
    id: 'anomaly1',
    userId: 'u1',
    ruleId: 'R001',
    ruleName: '单笔大额交易',
    riskLevel: RISK_LEVEL.MEDIUM,
    status: COMPLIANCE_STATUS.APPROVED,
    detectionTime: '2026-08-15 14:30:00',
    resolutionNotes: '已确认为正常大额投资，资金来源清晰',
    resolvedBy: '李合规',
    resolvedAt: '2026-08-15 16:00:00',
    createdAt: '2026-08-15 14:30:00',
  },
  // pending 待审记录（T2：异常检测工作台待审队列演示）
  {
    id: 'anomaly2',
    userId: 'u11',
    ruleId: 'R003',
    ruleName: '频繁申购',
    riskLevel: RISK_LEVEL.MEDIUM,
    status: COMPLIANCE_STATUS.PENDING,
    detectionTime: '2026-08-20 10:15:00',
    resolutionNotes: '',
    resolvedBy: null,
    resolvedAt: null,
    createdAt: '2026-08-20 10:15:00',
  },
  {
    id: 'anomaly3',
    userId: 'u17',
    ruleId: 'R002',
    ruleName: '大额集中',
    riskLevel: RISK_LEVEL.HIGH,
    status: COMPLIANCE_STATUS.PENDING,
    detectionTime: '2026-08-22 18:40:00',
    resolutionNotes: '',
    resolvedBy: null,
    resolvedAt: null,
    createdAt: '2026-08-22 18:40:00',
  },
];

// 预置大额交易审查记录
export const mockLargeTransactionReviews = [
  {
    id: 'ltx1',
    subscriptionId: 's1',
    userId: 'u1',
    amount: 3000000,
    reviewLevel: REVIEW_LEVEL.LEVEL_1,
    status: COMPLIANCE_STATUS.APPROVED,
    reviewerId: '李合规',
    reviewNotes: '一级审查通过，资金来源清晰',
    reviewTime: '2026-07-11 10:00:00',
    createdAt: '2026-07-10 09:30:15',
    updatedAt: '2026-07-11 10:00:00',
  },
  // pending 待审记录（T2：大额交易审查工作台待审队列演示，对应各 subscription.reviewId）
  {
    id: 'ltx2',
    subscriptionId: 's3',
    userId: 'u1',
    amount: 3000000,
    reviewLevel: REVIEW_LEVEL.LEVEL_1,
    status: COMPLIANCE_STATUS.PENDING,
    reviewerId: null,
    reviewNotes: null,
    reviewTime: null,
    createdAt: '2026-07-29 11:05:48',
    updatedAt: '2026-07-29 11:05:48',
  },
  {
    id: 'ltx3',
    subscriptionId: 's5',
    userId: 'u11',
    amount: 5000000,
    reviewLevel: REVIEW_LEVEL.LEVEL_2,
    status: COMPLIANCE_STATUS.PENDING,
    reviewerId: null,
    reviewNotes: null,
    reviewTime: null,
    createdAt: '2026-08-01 10:20:00',
    updatedAt: '2026-08-01 10:20:00',
  },
  {
    id: 'ltx4',
    subscriptionId: 's6',
    userId: 'u12',
    amount: 3000000,
    reviewLevel: REVIEW_LEVEL.LEVEL_1,
    status: COMPLIANCE_STATUS.PENDING,
    reviewerId: null,
    reviewNotes: null,
    reviewTime: null,
    createdAt: '2026-08-02 14:05:00',
    updatedAt: '2026-08-02 14:05:00',
  },
  {
    id: 'ltx5',
    subscriptionId: 's7',
    userId: 'u13',
    amount: 10000000,
    reviewLevel: REVIEW_LEVEL.LEVEL_3,
    status: COMPLIANCE_STATUS.PENDING,
    reviewerId: null,
    reviewNotes: null,
    reviewTime: null,
    createdAt: '2026-08-03 09:45:00',
    updatedAt: '2026-08-03 09:45:00',
  },
  {
    id: 'ltx6',
    subscriptionId: 's11',
    userId: 'u17',
    amount: 10000000,
    reviewLevel: REVIEW_LEVEL.LEVEL_3,
    status: COMPLIANCE_STATUS.PENDING,
    reviewerId: null,
    reviewNotes: null,
    reviewTime: null,
    createdAt: '2026-08-06 09:15:00',
    updatedAt: '2026-08-06 09:15:00',
  },
  {
    id: 'ltx7',
    subscriptionId: 's12',
    userId: 'u18',
    amount: 8000000,
    reviewLevel: REVIEW_LEVEL.LEVEL_3,
    status: COMPLIANCE_STATUS.PENDING,
    reviewerId: null,
    reviewNotes: null,
    reviewTime: null,
    createdAt: '2026-08-05 10:05:00',
    updatedAt: '2026-08-05 10:05:00',
  },
  {
    id: 'ltx8',
    subscriptionId: 's14',
    userId: 'u20',
    amount: 4000000,
    reviewLevel: REVIEW_LEVEL.LEVEL_1,
    status: COMPLIANCE_STATUS.PENDING,
    reviewerId: null,
    reviewNotes: null,
    reviewTime: null,
    createdAt: '2026-08-07 09:30:00',
    updatedAt: '2026-08-07 09:30:00',
  },
  {
    id: 'ltx9',
    subscriptionId: 's15',
    userId: 'u21',
    amount: 3000000,
    reviewLevel: REVIEW_LEVEL.LEVEL_1,
    status: COMPLIANCE_STATUS.APPROVED,
    reviewerId: '李合规',
    reviewNotes: '一级审查通过，资金来源清晰',
    reviewTime: '2026-08-10 13:30:00',
    createdAt: '2026-08-06 15:20:00',
    updatedAt: '2026-08-10 13:30:00',
  },
];

// 预置 STR 报告（T2：STR 流程工作台演示，覆盖不同阶段）
export const mockStrReports = [
  {
    id: 'str1',
    userId: 'u17',
    triggerSource: 'sanctions',
    severity: 'urgent',
    assessmentStatus: STR_ASSESSMENT_STATUS.PENDING,
    reportStatus: STR_REPORT_STATUS.DRAFT,
    assessmentNotes: '',
    reportContent: '',
    submittedAt: null,
    jfiuReference: null,
    createdAt: '2026-08-22 18:40:00',
    updatedAt: '2026-08-22 18:40:00',
  },
  {
    id: 'str2',
    userId: 'u13',
    triggerSource: 'anomaly',
    severity: 'standard',
    assessmentStatus: STR_ASSESSMENT_STATUS.SUSPICIOUS,
    reportStatus: STR_REPORT_STATUS.PENDING_APPROVAL,
    assessmentNotes: '大额集中且资金来源无法解释，初步判定可疑',
    reportContent: '',
    submittedAt: null,
    jfiuReference: null,
    createdAt: '2026-08-20 16:20:00',
    updatedAt: '2026-08-21 10:00:00',
  },
  {
    id: 'str3',
    userId: 'u3',
    triggerSource: 'pep',
    severity: 'standard',
    assessmentStatus: STR_ASSESSMENT_STATUS.NOT_SUSPICIOUS,
    reportStatus: STR_REPORT_STATUS.DRAFT,
    assessmentNotes: 'PEP 客户交易符合业务逻辑，已排除可疑',
    reportContent: '',
    submittedAt: null,
    jfiuReference: null,
    createdAt: '2026-08-18 09:30:00',
    updatedAt: '2026-08-19 15:00:00',
  },
];

// 预置 EDD 记录（T2：EDD 审核工作台演示；结构与 createEnhancedDueDiligence 对齐）
export const mockEddRecords = [
  {
    id: 'edd1',
    userId: 'u3',
    triggerType: 'pep',
    triggerAmount: 0,
    proofFiles: [
      { fileName: '资金来源证明-银行月结单.pdf', fileType: 'bank_statement', uploadedAt: '2026-08-21 11:00:00', reviewStatus: 'pending' },
      { fileName: '职务证明-任命文件.pdf', fileType: 'employment_proof', uploadedAt: '2026-08-21 11:05:00', reviewStatus: 'pending' },
    ],
    status: COMPLIANCE_STATUS.PENDING,
    reviewNotes: '',
    reviewerId: null,
    reviewTime: null,
    seniorApproval: null,        // 仅三级触发（高风险PEP）需要高管审批
    createdAt: '2026-08-20 10:00:00',
    updatedAt: '2026-08-20 10:00:00',
  },
  {
    id: 'edd2',
    userId: 'u13',
    triggerType: 'large_transaction',
    triggerAmount: 10000000,
    proofFiles: [],
    status: COMPLIANCE_STATUS.PENDING,
    reviewNotes: '',
    reviewerId: null,
    reviewTime: null,
    seniorApproval: null,
    createdAt: '2026-08-03 09:45:00',
    updatedAt: '2026-08-03 09:45:00',
  },
];

// 将预置数据填充到数组中
pepRecords.push(...mockPepRecords);
anomalyDetectionLogs.push(...mockAnomalyLogs);
largeTransactionReviews.push(...mockLargeTransactionReviews);
strReports.push(...mockStrReports);
enhancedDueDiligence.push(...mockEddRecords);

// ========== 合规工具函数 ==========

/**
 * 获取用户的合规状态摘要
 * @param {string} userId - 用户ID
 * @returns {Object} 合规状态摘要
 */
export function getUserComplianceSummary(userId) {
  const pep = pepRecords.find(r => r.userId === userId);
  const edd = enhancedDueDiligence.filter(r => r.userId === userId);
  const str = strReports.filter(r => r.userId === userId);
  const anomalies = anomalyDetectionLogs.filter(r => r.userId === userId);
  
  return {
    pepStatus: pep ? pep.pepType : PEP_STATUS.NONE,
    hasEdd: edd.length > 0,
    eddStatus: edd.length > 0 ? edd[edd.length - 1].status : null,
    hasStr: str.length > 0,
    strStatus: str.length > 0 ? str[str.length - 1].assessmentStatus : null,
    anomalyCount: anomalies.length,
    pendingAnomalies: anomalies.filter(a => a.status === COMPLIANCE_STATUS.PENDING).length,
  };
}

/**
 * 获取用户的amlFlags
 * @param {string} userId - 用户ID
 * @returns {Array} amlFlags数组
 */
export function getUserAmlFlags(userId) {
  const flags = [];
  
  // 检查PEP状态
  const pep = pepRecords.find(r => r.userId === userId);
  if (pep) {
    flags.push({
      type: 'pep',
      status: 'flagged',
      riskLevel: RISK_LEVEL.HIGH,
      createdAt: pep.createdAt,
    });
  }
  
  // 检查异常检测
  const anomalies = anomalyDetectionLogs.filter(r => r.userId === userId && r.status === COMPLIANCE_STATUS.PENDING);
  if (anomalies.length > 0) {
    flags.push({
      type: 'anomaly',
      status: 'flagged',
      riskLevel: anomalies[0].riskLevel,
      count: anomalies.length,
      createdAt: anomalies[0].createdAt,
    });
  }
  
  return flags;
}

/**
 * 检查用户是否可以进行申购
 * @param {string} userId - 用户ID
 * @param {number} amount - 申购金额
 * @returns {Object} 检查结果 { canProceed, reason }
 */
export function checkUserCanSubscribe(userId, amount) {
  const flags = getUserAmlFlags(userId);
  
  // 检查是否有高风险标记
  const highRiskFlags = flags.filter(f => f.riskLevel === RISK_LEVEL.HIGH);
  if (highRiskFlags.length > 0) {
    return {
      canProceed: false,
      reason: '用户存在高风险合规标记，需要compliance审核',
      flags: highRiskFlags,
    };
  }
  
  // 检查是否有中风险标记且金额较大
  const mediumRiskFlags = flags.filter(f => f.riskLevel === RISK_LEVEL.MEDIUM);
  if (mediumRiskFlags.length > 0 && amount >= 3000000) {
    return {
      canProceed: false,
      reason: '用户存在中风险合规标记且交易金额较大，需要compliance审核',
      flags: mediumRiskFlags,
    };
  }
  
  return {
    canProceed: true,
    reason: null,
    flags: [],
  };
}
