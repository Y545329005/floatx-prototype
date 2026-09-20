// ========== Mock数据（复用现有项目数据）==========

// 格式化货币
function formatCurrency(amount) {
  return new Intl.NumberFormat('zh-HK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// 获取项目Hero渐变色
function getProjectHeroGradient(sector) {
  const gradients = {
    '量子计算': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    '生物医药': 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    '机器人': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    '新能源': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    '人工智能': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    '金融科技': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    '企业服务': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    '消费升级': 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    '半导体': 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    '医疗健康': 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
  };
  return gradients[sector] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
}

// 获取项目Hero Emoji
function getProjectHeroEmoji(sector) {
  const emojis = {
    '量子计算': '🔬',
    '生物医药': '💊',
    '机器人': '🤖',
    '新能源': '⚡',
    '人工智能': '🧠',
    '金融科技': '💰',
    '企业服务': '💼',
    '消费升级': '🛍️',
    '半导体': '🔧',
    '医疗健康': '🏥',
  };
  return emojis[sector] || '🚀';
}

// 项目状态标签
const projectStatusLabels = {
  raising: '融资中',
  upcoming: '即将上线',
  closed: '已结束',
  sold: '已售罄',
};

// 用户数据
const currentUser = {
  id: 'u1',
  name: '张三',
  account: {
    hkd: 12500000,
    frozen: 2000000,
  },
};

// 资产历史数据
const assetHistory = [
  { date: '2026-01', total: 10000000 },
  { date: '2026-02', total: 10500000 },
  { date: '2026-03', total: 11200000 },
  { date: '2026-04', total: 10800000 },
  { date: '2026-05', total: 11500000 },
  { date: '2026-06', total: 12000000 },
  { date: '2026-07', total: 12500000 },
];

// 钱包数据
const wallet = {
  hkd: { label: '港币', symbol: 'HK$', balance: 12500000, frozen: 3000000 },
  usd: { label: '美元', symbol: '$', balance: 850000, frozen: 0 },
  cny: { label: '人民币', symbol: '¥', balance: 320000, frozen: 0 },
};

// 持仓数据
const holdings = [
  {
    id: 'h1',
    projectId: 'p4',
    projectName: 'GreenCell Energy',
    shares: 375,
    costBasis: 3000000,
    currentValue: 3600000,
    return: 20.0,
  },
];

// 交易记录
const transactions = [
  {
    id: 't1',
    type: 'deposit',
    amount: 5000000,
    currency: 'HKD',
    status: 'completed',
    createdAt: '2026-07-05',
    method: '银行转账',
  },
  {
    id: 't2',
    type: 'subscription',
    amount: 3000000,
    currency: 'HKD',
    status: 'completed',
    createdAt: '2026-07-10',
    projectName: 'GreenCell Energy',
  },
];

// 项目数据
const projects = [
  {
    id: 'p1',
    coverImage: null,
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
    investorCount: 42,
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
    ],
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
    coverImage: null,
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
    investorCount: 28,
    tags: ['生物科技', '肿瘤', '创新药'],
    highlights: [
      '核心管线已进入临床II期，初步数据优于现有标准疗法',
      '拥有全球自主知识产权的PROTAC平台',
      '已获FDA孤儿药认定',
    ],
    description: 'BioNova 专注于新一代蛋白降解技术（PROTAC）在肿瘤治疗领域的应用。核心管线BN-001针对非小细胞肺癌，在临床I/II期显示出优秀的安全性和有效性。公司同时拥有3个临床前管线，覆盖乳腺癌、前列腺癌等领域。',
    documents: [
      { name: '投资备忘录.pdf', url: '#' },
    ],
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
    coverImage: null,
    title: 'SkyNet Robotics',
    company: 'SkyNet Tech Ltd.',
    stage: 'B轮',
    sector: '机器人',
    location: '新加坡',
    valuation: 750000000,
    status: 'upcoming',
    currency: 'HKD',
    riskLevel: '高风险',
    ipoPlan: '目标港股 IPO，预计 2028 年启动上市筹备',
    roundNote: '公司定向释放少量份额供专业投资者参与。',
    intentDeadline: null,
    allocationRule: 'large-first',
    investorCount: 16,
    tags: ['机器人', '仓储物流', 'AI'],
    highlights: [
      '已签约3家头部物流企业试点，预计2027年量产',
      '自研SLAM算法精度达到行业领先水平',
      '获新加坡政府DeepTech基金配套资助',
    ],
    description: 'SkyNet Robotics 研发面向仓储物流场景的自主移动机器人（AMR）及智能调度系统。其核心优势在于自研的3D视觉SLAM算法和群体智能调度平台，在复杂仓储环境下的定位精度和通行效率均优于行业平均水平。',
    documents: [{ name: '投资备忘录.pdf', url: '#' }],
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
    coverImage: null,
    title: 'GreenCell Energy',
    company: 'GreenCell Inc.',
    stage: 'Pre-IPO轮',
    sector: '新能源',
    location: '香港',
    valuation: 8000000000,
    status: 'closed',
    currency: 'HKD',
    riskLevel: '中风险',
    ipoPlan: '目标港股主板上市，预计 2027 年递交上市申请',
    roundNote: '本轮已结束分配。',
    intentDeadline: null,
    allocationRule: 'pro-rata',
    investorCount: 85,
    tags: ['新能源', '储能', 'ESG'],
    highlights: [
      '下一代固态电池技术，能量密度提升40%',
      '已与三家车企签订战略合作备忘录',
      '获得香港特区政府绿色科技基金支持',
    ],
    description: 'GreenCell Energy 专注于下一代固态电池技术的研发与商业化。公司自主研发的电解质材料解决了传统固态电池的界面阻抗问题，有望在2027年实现量产。本轮融资将用于建设中试生产线和扩大研发团队。',
    documents: [{ name: '投资备忘录.pdf', url: '#' }],
    team: [
      { name: '陈伟明', role: 'CEO', bg: '前宁德时代研发总监' },
    ],
    financials: {
      revenue: 8000000,
      burnRate: 15000000,
      grossMargin: '45%',
    },
  },
];

// 申购数据
const subscriptions = [
  {
    id: 's1',
    projectId: 'p4',
    investorNo: 'INV-0001',
    amount: 3000000,
    currency: 'HKD',
    status: 'completed',
    createdAt: '2026-07-10',
  },
];

// 获取申购记录
function getInvestorNo(userId) {
  return 'INV-0001';
}

// 获取投资者名单
function getInvestorRoster(project) {
  return [
    { id: 'r01', investorNo: 'INV-8821', createdAt: '2026-07-29 18:23:40' },
    { id: 'r02', investorNo: 'INV-7714', createdAt: '2026-07-28 09:15:22' },
    { id: 'r03', investorNo: 'INV-6630', createdAt: '2026-07-26 14:02:11' },
  ];
}

// 格式化日期时间
function formatISODateTime(dateStr) {
  return dateStr;
}

// 格式化列表日期时间
function formatListDateTime(dateStr) {
  return dateStr.split(' ')[0];
}

// 获取项目阶段slug
function getProjectStageSlug(stage) {
  const slugs = {
    '种子轮': 'seed',
    '天使轮': 'angel',
    'Pre-A轮': 'pre-a',
    'A轮': 'a',
    'B轮': 'b',
    'C轮': 'c',
    'C+轮': 'c-plus',
    'Pre-IPO轮': 'pre-ipo',
  };
  return slugs[stage] || 'other';
}

// 获取货币符号
function getCurrencySymbol(currency) {
  const symbols = {
    'HKD': 'HK$',
    'USD': '$',
    'CNY': '¥',
  };
  return symbols[currency] || currency;
}

// 获取申购门槛
function getSubscriptionGate(user) {
  return {
    canSubscribe: true,
    kycPassed: true,
    piPassed: true,
  };
}
