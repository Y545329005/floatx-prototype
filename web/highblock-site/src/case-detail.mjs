// Case & roadshow-recap detail pages (template + query param rendering).
// Case content is derived from the app's project data (prototype/src/mock/data.js projects p1–p6),
// downgraded for public-web compliance: valuation, round size, deadlines, allocation, documents,
// revenue projections and IPO timelines are all stripped. Event recaps derive from the same
// events used on the news page (past events only — no sign-ups, no announcements).
// Illustrative throughout; keep both languages in sync when updating.

const t = (zh, en) => ({ zh, en });

const cases = [
  {
    id: 'quantumcore',
    name: 'QuantumCore Technologies',
    sector: t('量子計算', 'Quantum computing'),
    stage: t('C 輪', 'Series C'),
    location: t('香港', 'Hong Kong'),
    summary: t(
      '專注基於新型拓撲量子比特的通用量子計算方案，2025 年完成室溫量子比特原型驗證，為全球少數在該技術路線取得突破的企業之一。',
      'Develops universal quantum computing solutions based on novel topological qubits. In 2025 the company validated a room-temperature qubit prototype — one of the few breakthroughs on this technology route.'
    ),
    intro: [
      t(
        '專注基於新型拓撲量子比特的通用量子計算方案，2025 年完成室溫量子比特原型驗證，為全球少數在該技術路線取得突破的企業之一。',
        'Develops universal quantum computing solutions based on novel topological qubits. In 2025 the company validated a room-temperature qubit prototype — one of the few breakthroughs on this technology route.'
      ),
      t(
        '公司已獲多項國際專利，並與香港科技大學建立聯合實驗室。核心團隊來自 MIT、Stanford 及香港科技大學，現階段聚焦將原型成果向工程化與商業化落地推進。',
        'The company holds multiple international patents and has established a joint laboratory with The Hong Kong University of Science and Technology. Its core team comes from MIT, Stanford and HKUST, and is focused on moving the validated prototype towards engineering and commercialisation.'
      ),
    ],
    highlights: [
      t('全球首個室溫量子比特晶片原型通過驗證', 'First room-temperature qubit chip prototype validated'),
      t('與香港科技大學建立聯合實驗室', 'Joint laboratory established with The Hong Kong University of Science and Technology'),
      t('團隊成員來自 MIT、Stanford 及香港科技大學', 'Team members from MIT, Stanford and HKUST'),
    ],
    team: [
      { name: t('張振宇', 'Zhang Zhenyu'), role: 'CEO', bg: t('前 Google 量子計算研究員', 'Former quantum computing researcher at Google') },
      { name: t('Dr. Lisa Wong', 'Dr. Lisa Wong'), role: 'CTO', bg: t('MIT 物理學博士', 'PhD in Physics, MIT') },
    ],
    eventIds: ['quantumcore-openday'],
  },
  {
    id: 'bionova',
    name: 'BioNova Therapeutics',
    sector: t('生物醫藥', 'Biopharmaceuticals'),
    stage: t('C+ 輪', 'Series C+'),
    location: t('深圳', 'Shenzhen'),
    summary: t(
      '將新一代蛋白降解技術（PROTAC）應用於腫瘤治療，核心管線針對非小細胞肺癌，另有三條臨床前管線覆蓋其他實體瘤領域。',
      'Applies next-generation protein degradation technology (PROTAC) to oncology, with a lead pipeline targeting non-small cell lung cancer and three preclinical programmes across other solid tumours.'
    ),
    intro: [
      t(
        '將新一代蛋白降解技術（PROTAC）應用於腫瘤治療，核心管線針對非小細胞肺癌，臨床 I/II 期數據顯示良好的安全性與有效性。',
        'Applies next-generation protein degradation technology (PROTAC) to oncology. Its lead pipeline targets non-small cell lung cancer, with Phase I/II data showing favourable safety and efficacy.'
      ),
      t(
        '公司擁有全球自主知識產權的 PROTAC 平台，核心管線已獲 FDA 孤兒藥認定，另有三條臨床前管線覆蓋乳腺癌、前列腺癌等其他實體瘤領域。',
        'The company owns a proprietary PROTAC platform with global intellectual property. The lead pipeline has received an FDA Orphan Drug designation, and three preclinical programmes cover other solid tumours including breast and prostate cancer.'
      ),
    ],
    highlights: [
      t('核心管線已進入臨床 II 期，初步數據優於現有標準療法', 'Lead pipeline in Phase II trials, with early data outperforming existing standard-of-care'),
      t('擁有自主知識產權 PROTAC 平台，並獲 FDA 孤兒藥認定', 'Proprietary PROTAC platform with an FDA Orphan Drug designation'),
      t('三條臨床前管線覆蓋其他實體瘤領域', 'Three preclinical programmes across other solid tumours'),
    ],
    team: [
      { name: t('Dr. 趙明輝', 'Dr. Minghui Zhao'), role: 'CEO', bg: t('前輝瑞腫瘤事業部副總裁', 'Former VP of Pfizer’s oncology business unit') },
      { name: t('Dr. 王思遠', 'Dr. Siyuan Wang'), role: 'CSO', bg: t('中國科學院上海藥物所教授', 'Professor at the Shanghai Institute of Materia Medica, Chinese Academy of Sciences') },
    ],
    eventIds: [],
  },
  {
    id: 'skynet',
    name: 'SkyNet Robotics',
    sector: t('機器人', 'Robotics'),
    stage: t('B 輪', 'Series B'),
    location: t('新加坡', 'Singapore'),
    summary: t(
      '研發面向倉儲物流場景的自主移動機器人（AMR）與智能調度系統，核心能力為自研 3D 視覺 SLAM 演算法及群體智能調度平台。',
      'Develops autonomous mobile robots (AMR) and intelligent scheduling systems for warehousing and logistics, built on in-house 3D vision SLAM algorithms and a swarm-intelligence scheduling platform.'
    ),
    intro: [
      t(
        '研發面向倉儲物流場景的自主移動機器人（AMR）與智能調度系統，核心能力為自研 3D 視覺 SLAM 演算法及群體智能調度平台。',
        'Develops autonomous mobile robots (AMR) and intelligent scheduling systems for warehousing and logistics, built on in-house 3D vision SLAM algorithms and a swarm-intelligence scheduling platform.'
      ),
      t(
        '系統在複雜倉儲環境下的定位精度與通行效率處於行業前列，已與頭部物流企業開展試點合作，並獲新加坡政府 DeepTech 基金配套資助。',
        'Its positioning accuracy and throughput in complex warehouse environments rank among the industry’s leading results. The company has begun pilots with leading logistics operators and is supported by a matching grant from a Singapore government DeepTech fund.'
      ),
    ],
    highlights: [
      t('已簽約頭部物流企業開展試點合作', 'Pilots signed with leading logistics companies'),
      t('自研 SLAM 演算法定位精度達行業領先水平', 'In-house SLAM algorithms delivering industry-leading positioning accuracy'),
      t('獲新加坡政府 DeepTech 基金配套資助', 'Supported by a Singapore government DeepTech matching grant'),
    ],
    team: [
      { name: t('林志遠', 'Zhiyuan Lin'), role: 'CEO', bg: t('前大疆技術總監', 'Former technical director at DJI') },
    ],
    eventIds: [],
  },
  {
    id: 'greencell',
    name: 'GreenCell Energy',
    sector: t('新能源', 'New energy'),
    stage: t('Pre-IPO', 'Pre-IPO'),
    location: t('香港', 'Hong Kong'),
    summary: t(
      '專注下一代固態電池的研發與生產，半固態電池產品已於 2025 年實現量產，並獲主流車企訂單。',
      'Develops and manufactures next-generation solid-state batteries; its semi-solid-state product entered mass production in 2025 with orders from mainstream automakers.'
    ),
    intro: [
      t(
        '專注下一代固態電池的研發與生產，半固態電池產品已於 2025 年實現量產，並獲三家主流車企訂單。',
        'Develops and manufactures next-generation solid-state batteries; its semi-solid-state product entered mass production in 2025 with orders from three mainstream automakers.'
      ),
      t(
        '固態電池能量密度達 500Wh/kg 並獲車企定點，現階段聚焦量產良率提升與新一代產品的迭代開發。',
        'Its solid-state cells reach an energy density of 500Wh/kg with automaker design wins. The company is focused on improving mass-production yield and iterating on its next-generation products.'
      ),
    ],
    highlights: [
      t('固態電池能量密度達 500Wh/kg，並獲車企定點', 'Solid-state cells reach 500Wh/kg energy density, with automaker design wins'),
      t('半固態產品量產出貨三家主流車企', 'Semi-solid-state product shipping to three mainstream automakers'),
      t('半固態與全固態兩條技術路線並行推進', 'Parallel development of semi-solid-state and all-solid-state technology routes'),
    ],
    team: [
      { name: t('Dr. 陳國棟', 'Dr. Guodong Chen'), role: 'CEO', bg: t('前寧德時代研究院副院長', 'Former deputy dean of the CATL research academy') },
    ],
    eventIds: ['greencell-briefing'],
  },
  {
    id: 'aurora',
    name: 'Aurora FinTech',
    sector: t('金融科技', 'Financial technology'),
    stage: t('B 輪', 'Series B'),
    location: t('香港', 'Hong Kong'),
    summary: t(
      '構建基於區塊鏈的真實資產（RWA）代幣化交易平台，以合規代幣化結構為私募股權二級市場提供流動性方案。',
      'Builds a blockchain-based platform for tokenising real-world assets (RWA), providing liquidity solutions for the private equity secondary market through compliant tokenisation structures.'
    ),
    intro: [
      t(
        '構建基於區塊鏈的真實資產（RWA）代幣化交易平台，以合規代幣化結構為私募股權二級市場提供流動性方案。',
        'Builds a blockchain-based platform for tokenising real-world assets (RWA), providing liquidity solutions for the private equity secondary market through compliant tokenisation structures.'
      ),
      t(
        '平台使原本缺乏流動性的私募份額可在合資格投資者之間轉讓。項目已獲香港數碼港加速器計劃支持，團隊具國際投行與交易平台從業背景。',
        'The platform enables traditionally illiquid private fund interests to be transferred between eligible investors. The project is supported by the Cyberport accelerator programme, and the team has backgrounds at international investment banks and trading platforms.'
      ),
    ],
    highlights: [
      t('獲香港數碼港加速器計劃支持', 'Supported by the Cyberport accelerator programme'),
      t('開發基於區塊鏈的私募二級交易平台', 'Building a blockchain-based private-markets secondary trading platform'),
      t('團隊具國際投行與交易平台從業背景', 'Team with international investment bank and trading platform backgrounds'),
    ],
    team: [
      { name: t('黃天佑', 'Tianyou Huang'), role: 'CEO', bg: t('前高盛副總裁', 'Former VP at Goldman Sachs') },
    ],
    eventIds: ['aurora-rwa'],
  },
  {
    id: 'mediconnect',
    name: 'MediConnect Health',
    sector: t('醫療健康', 'Healthcare'),
    stage: t('C 輪', 'Series C'),
    location: t('香港', 'Hong Kong'),
    summary: t(
      '提供基於 AI 的醫療影像輔助診斷平台，以 SaaS 模式服務醫療機構，協助醫生提升診斷效率與準確率。',
      'Provides an AI-powered medical imaging diagnostic support platform to healthcare providers on a SaaS basis, helping doctors improve diagnostic efficiency and accuracy.'
    ),
    intro: [
      t(
        '提供基於 AI 的醫療影像輔助診斷平台，以 SaaS 模式服務醫療機構，協助醫生提升診斷效率與準確率。',
        'Provides an AI-powered medical imaging diagnostic support platform to healthcare providers on a SaaS basis, helping doctors improve diagnostic efficiency and accuracy.'
      ),
      t(
        'AI 模型在肺結節、乳腺癌、糖尿病視網膜病變等領域達到專家級診斷水平，系統已獲 CE 認證，並接入香港公立醫院與私家診所網絡。',
        'Its AI models reach specialist-level diagnostic performance in lung nodules, breast cancer and diabetic retinopathy. The system is CE-certified and connected to Hong Kong public hospitals and private clinics.'
      ),
    ],
    highlights: [
      t('AI 影像診斷系統獲 CE 認證，覆蓋 30+ 病種', 'CE-certified AI imaging diagnosis covering 30+ conditions'),
      t('已接入香港公立醫院與私家診所網絡', 'Connected to Hong Kong public hospitals and private clinics'),
      t('模型在多個影像領域達到專家級診斷水平', 'Specialist-level diagnostic performance across multiple imaging domains'),
    ],
    team: [
      { name: t('Dr. 劉嘉欣', 'Dr. Kaixin Liu'), role: 'CEO', bg: t('前香港大學醫學院教授', 'Former professor at the University of Hong Kong Faculty of Medicine') },
    ],
    eventIds: [],
  },
];

const events = [
  {
    id: 'greencell-briefing',
    date: '2026-07-20',
    dateText: t('2026 年 7 月 20 日', '20 July 2026'),
    title: t('GreenCell 投資人交流會（線上）', 'GreenCell investor briefing (online)'),
    summary: t(
      'GreenCell 管理層分享固態電池量產與車企合作的最新進展，並就技術路線與產能規劃回應參會者提問。',
      'GreenCell management shared progress on solid-state battery mass production and automaker partnerships, and answered participants’ questions on technology routes and capacity planning.'
    ),
    agenda: [
      t('管理層主旨分享：固態電池技術路線與量產進展', 'Keynote from management: solid-state technology routes and production progress'),
      t('車企合作與定點供應的最新進展', 'Latest developments in automaker partnerships and design wins'),
      t('技術路線與產能規劃問答', 'Q&A on technology routes and capacity planning'),
    ],
    points: [
      t('半固態電池產品已於 2025 年量產並出貨三家主流車企', 'Semi-solid-state product in mass production since 2025, shipping to three mainstream automakers'),
      t('固態電池能量密度達 500Wh/kg，並獲車企定點', 'Solid-state cells reach 500Wh/kg energy density, with automaker design wins'),
      t('管理層就產能規劃與量產節奏回應參會者提問', 'Management answered questions on capacity planning and production cadence'),
    ],
    qa: [
      {
        q: t('半固態與全固態路線的量產時間如何安排？', 'How are production timelines arranged for the semi-solid and all-solid-state routes?'),
        a: t('管理層表示半固態已進入量產階段，全固態正推進中試，量產節奏將配合車企定點進度。', 'Management noted that the semi-solid-state product is already in mass production while the all-solid-state line is in pilot testing, with production timing aligned to automaker design-win schedules.'),
      },
      {
        q: t('與車企的合作以哪種模式為主？', 'What is the primary model of cooperation with automakers?'),
        a: t('以聯合開發與定點供應為主，並按項目進度逐步擴大配套範圍。', 'Mainly joint development and design-win supply, with the scope of supply expanding step by step as programmes progress.'),
      },
    ],
    caseIds: ['greencell'],
  },
  {
    id: 'aurora-rwa',
    date: '2026-07-08',
    dateText: t('2026 年 7 月 8 日', '8 July 2026'),
    title: t('Aurora FinTech RWA 主題分享（線上）', 'Aurora FinTech RWA topic sharing (online)'),
    summary: t(
      '團隊講解真實資產代幣化的合規結構設計、私募份額二級流動性的市場實踐，以及其中的監管考量。',
      'The team explained the compliant structuring of real-world asset tokenisation and the market practice of secondary liquidity for private shares, together with the regulatory considerations involved.'
    ),
    agenda: [
      t('真實資產代幣化的合規結構設計講解', 'Explaining compliant structuring for real-world asset tokenisation'),
      t('私募份額二級流動性的市場實踐分享', 'Sharing market practice on secondary liquidity for private interests'),
      t('監管考量與合規框架問答', 'Q&A on regulatory considerations and compliance frameworks'),
    ],
    points: [
      t('代幣化結構須面向合資格投資者並符合適用規則', 'Tokenisation structures must target eligible investors and comply with applicable rules'),
      t('私募份額二級轉讓的流動性方案仍處早期市場實踐階段', 'Secondary-transfer liquidity solutions remain at an early stage of market practice'),
      t('團隊分享香港監管框架下的合規設計考量', 'The team outlined compliance design considerations under the Hong Kong regulatory framework'),
    ],
    qa: [
      {
        q: t('私募份額二級轉讓的合規基礎是什麼？', 'What is the compliance basis for secondary transfers of private interests?'),
        a: t('需按適用規則設計份額轉讓結構，參與方限於合資格投資者，並履行相應的盡職審查。', 'Transfer structures must follow applicable rules, participation is limited to eligible investors, and appropriate due diligence applies.'),
      },
      {
        q: t('監管機構對 RWA 代幣化的態度如何？', 'How are regulators approaching RWA tokenisation?'),
        a: t('團隊分享對香港監管指引與沙盒安排的觀察，強調合規先行是項目推進的前提。', 'The team shared observations on Hong Kong’s regulatory guidance and sandbox arrangements, stressing that compliance comes first.'),
      },
    ],
    caseIds: ['aurora'],
  },
  {
    id: 'quantumcore-openday',
    date: '2026-06-24',
    dateText: t('2026 年 6 月 24 日', '24 June 2026'),
    title: t('QuantumCore 技術開放日（香港科學園）', 'QuantumCore technology open day (Hong Kong Science Park)'),
    summary: t(
      '線下參觀量子計算實驗室，技術團隊演示室溫量子比特原型，並與專業投資者就產業化路徑交流。',
      'An on-site visit to the quantum computing laboratory, where the technology team demonstrated the room-temperature qubit prototype and exchanged views with Professional Investors on the path to industrialisation.'
    ),
    agenda: [
      t('量子計算實驗室線下參觀', 'On-site visit to the quantum computing laboratory'),
      t('室溫量子比特原型演示', 'Demonstration of the room-temperature qubit prototype'),
      t('產業化路徑交流與問答', 'Exchange and Q&A on the path to industrialisation'),
    ],
    points: [
      t('技術團隊演示室溫量子比特原型並講解技術路線', 'The technology team demonstrated the room-temperature qubit prototype and explained the technology route'),
      t('同步與香港科技大學聯合實驗室的研究方向', 'Updates on the joint laboratory’s research directions with The Hong Kong University of Science and Technology'),
      t('就工程化與產業化路徑與專業投資者交流', 'Exchange with Professional Investors on engineering and industrialisation paths'),
    ],
    qa: [
      {
        q: t('室溫量子比特工程化的主要挑戰是什麼？', 'What are the main engineering challenges for room-temperature qubits?'),
        a: t('團隊表示下一階段聚焦相干性保持與晶片良率，工程化驗證將分階段推進。', 'The team said the next phase focuses on coherence preservation and chip yield, with engineering validation advancing in stages.'),
      },
      {
        q: t('產業化路徑如何規劃？', 'How is the industrialisation path planned?'),
        a: t('依托聯合實驗室與產學合作，先在特定運算場景形成落地能力。', 'Via the joint laboratory and academic-industrial collaboration, starting with delivery capability in specific computing scenarios.'),
      },
    ],
    caseIds: ['quantumcore'],
  },
];

// Resolve the one-way id links into embedded summaries so the runtime renderer
// never has to cross-reference the two collections.
const pick = lang => value => value[lang];
for (const item of cases) {
  item.linkedEvents = item.eventIds
    .map(eventId => events.find(e => e.id === eventId))
    .filter(Boolean)
    .map(e => ({ id: e.id, title: e.title, date: e.date, dateText: e.dateText }));
}
for (const item of events) {
  item.linkedCases = item.caseIds
    .map(caseId => cases.find(cs => cs.id === caseId))
    .filter(Boolean)
    .map(cs => ({ id: cs.id, name: cs.name, sector: cs.sector, stage: cs.stage, location: cs.location }));
}

const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

function labels(c, kind) {
  const en = c.lang === 'en';
  if (kind === 'case') {
    return {
      kind,
      flag: en ? 'Illustrative' : '示意',
      crumbTail: en ? 'Company case' : '案例詳情',
      sections: {
        about: en ? 'About the company' : '公司簡介',
        highlights: en ? 'Highlights' : '發展亮點',
        team: en ? 'Core team' : '核心團隊',
        related: en ? 'Related roadshow recaps' : '相關路演回顧',
      },
      viewRelated: en ? 'View recap' : '查看回顧',
      viewDetails: en ? 'View details' : '查看詳情',
      indexEyebrow: en ? 'Case scope' : '案例範圍',
      indexTitle: en ? 'Companies we track' : '我們跟蹤的企業類型',
      indexIntro: en ? 'Select a company to view its illustrative profile. These profiles describe the sectors and stages HighBlock tracks and are not a recommendation of any company.' : '選擇一間企業查看示意詳情。以下內容說明 HighBlock 持續跟蹤的行業與發展階段，不構成對任何企業的推薦。',
      notFound: en ? 'No matching case found. Please select from the cases below.' : '未找到對應案例，請從以下列表選擇。',
      breadcrumbAria: en ? 'Breadcrumb' : '麵包屑導覽',
    };
  }
  return {
    kind,
    flag: en ? 'Illustrative' : '示意',
    crumbTail: en ? 'Recap details' : '回顧詳情',
    sections: {
      summary: en ? 'Summary' : '紀要摘要',
      agenda: en ? 'Agenda' : '議程',
      points: en ? 'Key points' : '要點',
      qa: en ? 'Q&A highlights' : '問答摘錄',
      related: en ? 'Related cases' : '相關案例',
    },
    viewRelated: en ? 'View case' : '查看案例',
    viewDetails: en ? 'View recap' : '查看回顧',
    indexEyebrow: en ? 'Roadshow recap' : '路演回顧',
    indexTitle: en ? 'Past event recaps' : '已舉行活動紀要',
    indexIntro: en ? 'Select a recap to view its illustrative summary. Records cover past events only — no sign-ups and no announcements.' : '選擇一則紀要查看示意詳情。回顧僅涵蓋已舉行活動，不設報名，亦無活動預告。',
    notFound: en ? 'No matching recap found. Please select from the recaps below.' : '未找到對應回顧，請從以下列表選擇。',
    breadcrumbAria: en ? 'Breadcrumb' : '麵包屑導覽',
  };
}

const json = value => JSON.stringify(value).replace(/</g, '\\u003c');

function breadcrumb(c, kind) {
  const en = c.lang === 'en';
  const links = kind === 'case'
    ? [
        { href: `services${c.suffix}.html`, text: en ? 'Products & Services' : '產品與服務' },
        { href: `services${c.suffix}.html#services-cases`, text: en ? 'Case scope' : '案例範圍' },
      ]
    : [
        { href: `news${c.suffix}.html`, text: en ? 'Information' : '資訊' },
        { href: `news${c.suffix}.html#fund-updates`, text: en ? 'Fund updates' : '基金動態' },
        { href: `news${c.suffix}.html#fund-updates`, text: en ? 'Roadshow recap' : '路演回顧' },
      ];
  const label = labels(c, kind).breadcrumbAria;
  return `<nav class="detail-breadcrumb" aria-label="${esc(label)}">${links.map(l => `<a href="${l.href}">${esc(l.text)}</a>`).join('<span aria-hidden="true">/</span>')}<span aria-current="page">${esc(labels(c, kind).crumbTail)}</span></nav>`;
}

// Page body shell. The runtime script (assets/detail-page.js) renders the detail or the
// index fallback into #detail-root based on the query parameter.
export function detailPage(c, kind) {
  const en = c.lang === 'en';
  const data = { items: kind === 'case' ? cases : events, labels: labels(c, kind) };
  const backHref = kind === 'case' ? `services${c.suffix}.html#services-cases` : `news${c.suffix}.html#fund-updates`;
  const backText = kind === 'case' ? (en ? 'Back to case scope' : '返回案例範圍') : (en ? 'Back to roadshow recap' : '返回路演回顧');
  const noscript = en
    ? `<p class="detail-noscript">This page requires JavaScript. Please <a href="${backHref}">return to the list</a> to browse.</p>`
    : `<p class="detail-noscript">本頁詳情需啟用 JavaScript。請<a href="${backHref}">返回列表頁</a>瀏覽。</p>`;
  const note = en
    ? 'This page is illustrative and only describes the sectors and development stages HighBlock continues to track. It does not constitute a recommendation of any company and does not represent HighBlock’s investments or performance. To learn more, please '
    : '本頁內容為示意資料，僅用於說明 HighBlock 持續跟蹤的行業與發展階段，不構成對任何企業的推薦，亦不代表 HighBlock 的投資或業績。如欲進一步了解，請';
  const noteTail = en ? '.</span>' : '。</span>';
  const contactText = en ? 'contact us' : '與我們聯絡';
  return `<main id="main" class="inner-page detail-page"><div class="detail-shell">${breadcrumb(c, kind)}<div id="detail-root" class="detail-root">${noscript}</div><p class="detail-backline"><a class="text-link" href="${backHref}"><span>${esc(backText)}</span></a></p><aside class="detail-note"><p>${esc(note)}<span class="detail-note-tail"><a href="contact${c.suffix}.html">${esc(contactText)}</a>${noteTail}</p></aside><script type="application/json" id="site-detail-data">${json(data)}</script></div></main>`;
}
