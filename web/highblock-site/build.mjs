import { serviceDevices } from './src/services-devices.mjs';
import { researchPlanes, researchPlanesCss } from './src/research-planes.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(root, 'dist');
fs.mkdirSync(path.join(out, 'assets'), { recursive: true });
const copy = {
  zh: {
    lang: 'zh-Hant', suffix: '', other: 'en', language: 'EN',
    nav: ['關於我們', '產品與服務', '合規', '聯絡我們'], menu: '開啟導覽選單',
    heroTitle: '私募股權<span class="hero-title-tail">資訊與諮詢</span>',
    heroText: '專注大中華區成長期科技與消費企業，以持牌主體、合規體系及透明的資訊服務，為符合資格的專業投資者提供私募股權市場資訊與諮詢服務。',
    heroCta: '預約諮詢', heroVerify: '核驗',
    aboutTitle: "關於 HighBlock",
    aboutParagraphs: ["HighBlock Securities 的初衷，是為投資者開拓優質投資機遇。我們立足產業研究，深入理解企業的商業模式與發展潛力，致力於連結投資者與具有長期價值的成長機會。","HighBlock Securities 匯聚香港及內地多領域的資深人才，兼具監管視野、產業洞察與企業分析能力。團隊以跨領域協作整合研究、法律及合規視角，為項目分析、風險辨識與投資者服務提供專業支持。"],
    why: "核心優勢",
    whyTitle: "為專業投資者而設",
    whyIntro: "以持牌監管框架為基礎，結合深入的企業研究與長期價值視角，為專業投資者提供私募股權市場資訊與諮詢服務。",
    advantages: [["持牌監管框架","依託香港證監會第 1、4、9 類持牌主體，整合法律與合規專業，重視服務範圍、資訊披露及風險說明。","REGULATORY FRAMEWORK"],["專注成長期股權","聚焦大中華區 Pre-A 至 C 輪成長期企業，為專業投資者提供相關市場資訊、項目資訊及諮詢服務。","GROWTH EQUITY"],["立足長期價值","從企業發展與產業演進的長期視角出發，綜合考量成長潛力、投資期限及退出不確定性，協助投資者理解機遇與風險。","LONG-TERM VALUE"]],
    philosophy: "投資理念",
    philosophyTitle: "理解成長邏輯，審視長期價值",
    philosophyIntro: "從二級市場拓展到一級市場私募股權投資領域，我們都能靈活運用投資能力。我們相信，對投資機遇的判斷，始於對企業及其所處產業的深入理解。研究既要辨識成長的驅動因素，也要審視成長能否持續，以及實現預期所需的條件。",
    nodes: ["產業脈絡","企業基本面","風險與價值"],
    nodeText: [["看清成長的來源","從真實需求、技術演進與競爭格局出發，理解企業所處的產業位置，辨識驅動成長的結構性因素。"],["回歸企業本質","關注商業模式、競爭優勢與核心差異，研究企業如何創造價值、形成壁壘，以及將發展潛力轉化為持續的經營成果。"],["審慎衡量風險","審視估值、資訊完整性、投資期限及退出路徑，檢驗成長預期所依賴的假設，並評估預期未能實現時的風險。"]],
    culture: "我們的文化",
    cultureTitle: "求真、協作、坦誠",
    cultureIntro: "我們相信，專業來自持續積累，信任建立於日常實踐。尊重事實、開放協作與坦誠溝通，是團隊共同遵循的工作原則。",
    values: [["求真｜尊重事實","重視資訊來源與證據，鼓勵對既有判斷提出質疑；當新的事實出現，持續檢視並修正觀點。"],["協作｜交流不同觀點","尊重不同專業背景與獨立見解，讓不同思想碰撞，在充分討論中檢視觀點、深化理解。"],["坦誠｜清晰溝通","如實說明資訊依據、服務範圍及尚存的不確定性，以負責任的溝通與持續跟進建立長期信任。"]],
    people: "我們的團隊",
    peopleTitle: "多元專業，協同研判",
    peopleText: "HighBlock Securities 的團隊匯集香港及內地多領域的資深人士，專業背景涵蓋投資研究、法律與合規。團隊成員結合各自的實務經驗，從產業發展、企業價值及監管要求等角度審視項目，為投資者提供兼具研究深度與專業規範的服務。",
    contact: '聯絡我們', services: '了解我們的服務', compliance: '合規與風險',
    legal: ['免責聲明', '私隱政策', '使用條款'], note: '本網站僅供專業投資者參考，不構成任何投資要約、招攬或收益承諾。',
    legalStatus: '香港證監會第 1、4、9 類受規管活動', verify: 'SFC 公眾紀錄冊', home: '主頁',
    contactTitle: '聯絡我們', contactChannels: ['電話', '電郵', '地址'], contactPlaceholder: '待輸入', contactValues: ['待輸入', '待輸入', '香港中環亞畢諾道3號環貿中心17樓04-05'], contactText: '歡迎了解 HighBlock 的資訊與諮詢服務。服務對象為符合資格的專業投資者。',
    contactLabel: '預約諮詢', contactNotice: '線上預約暫未開放。請透過您已知的官方聯絡渠道與我們預約。',
    fields: ['姓名', '聯絡電話', '電郵', '您的問題（選填）'], contactConsent: '我已閱讀個人資料收集聲明及私隱政策。',
    contactButton: '線上預約暫未開放', privacyContact: '合規及個人資料查詢', privacyContactText: '如有合規、網站聲明或個人資料相關查詢，請聯絡：',
    complianceTitle: '以清晰的框架，<br>建立長期信任', complianceText: '服務範圍、監管資訊及資料保障，均應清晰可查。',
    safeguards: [
      ['持牌監管框架', 'HighBlock Securities Limited 持有香港證監會第 1、4、9 類牌照，中央編號 BWW124。牌照範圍與條件請以香港證監會公眾紀錄冊為準。'],
      ['合規與風險管理', '依照適用規則進行合規審查，記錄諮詢流程，並清晰說明服務範圍與相關風險。'],
      ['客戶盡職調查', '按照適用要求進行身份核查、專業投資者資格評估及反洗錢審查。'],
      ['個人資料保障', '個人資料的收集、使用及保護，請參閱本網站私隱政策與相關收集聲明。']
    ],
    policyTitle: '網站聲明與政策', policyText: '請在使用本網站或相關服務前，閱讀適用的聲明與政策。'
  },
  en: {
    lang: 'en', suffix: '.en', other: 'zh', language: '繁中',
    nav: ['About us', 'Products & Services', 'Compliance', 'Contact'], menu: 'Open navigation menu',
    heroTitle: 'Private Equity<br>Information & Advisory',
    heroText: 'Focused on growth-stage technology and consumer companies in Greater China, we provide private equity market information and advisory services to eligible Professional Investors.',
    heroCta: 'Contact us', heroVerify: 'Verify',
    aboutTitle: "About HighBlock",
    aboutParagraphs: ["HighBlock Securities was founded to open up quality investment opportunities for investors. Grounded in industry research and a deep understanding of business models and growth potential, we seek to connect investors with opportunities for growth and long-term value.","HighBlock Securities brings together experienced professionals from Hong Kong and mainland China across multiple disciplines, combining regulatory perspective, industry insight and company analysis. Through collaboration across research, legal and compliance disciplines, the team provides professional support for project analysis, risk identification and investor services."],
    why: "Our strengths",
    whyTitle: "Designed for Professional Investors",
    whyIntro: "Working within a licensed regulatory framework, we combine in-depth company research with a long-term perspective to provide Professional Investors with private equity market information and advisory services.",
    advantages: [["A licensed regulatory framework","Operating through an entity licensed by Hong Kong’s Securities and Futures Commission for Type 1, 4 and 9 regulated activities, we bring together legal and compliance expertise, with attention to the scope of our services, information disclosure and risk communication.","REGULATORY FRAMEWORK"],["A focus on growth equity","We focus on growth-stage companies in Greater China from Pre-A to Series C, providing Professional Investors with relevant market information, project information and advisory services.","GROWTH EQUITY"],["A long-term view of value","Taking a long-term view of business development and industry evolution, we consider growth potential, investment horizons and uncertainty around exits to help investors understand both opportunities and risks.","LONG-TERM VALUE"]],
    philosophy: "Our philosophy",
    philosophyTitle: "Understand the drivers of growth Assess long-term value",
    philosophyIntro: "From secondary markets to private equity investing in the primary market, we can apply our investment capabilities flexibly. We believe that assessing an investment opportunity begins with a deep understanding of a company and its industry. Research must identify what drives growth, examine whether that growth can be sustained and consider the conditions required for expectations to be realised.",
    nodes: ["Industry context","Company fundamentals","Risk and value"],
    nodeText: [["Understand the sources of growth","Starting with underlying demand, technological developments and the competitive landscape, we examine a company’s position within its industry and identify the structural factors that drive growth."],["Focus on business fundamentals","We examine business models, competitive advantages and key differentiators, studying how companies create value, build barriers to competition and translate their potential into sustained business results."],["Assess risk with care","We examine valuations, the completeness of information, investment horizons and potential exit routes, testing the assumptions behind growth expectations and assessing the risks if those expectations are not met."]],
    culture: "Our culture",
    cultureTitle: "Truth Collaboration Candour",
    cultureIntro: "We believe that expertise develops through continuous learning and that trust is built through everyday practice. Respect for facts, open collaboration and candid communication guide how we work together.",
    values: [["Truth / Respect the facts","We value reliable sources and evidence, encourage scrutiny of existing judgements and continually review and refine our views as new facts emerge."],["Collaboration / Exchange perspectives","We respect diverse professional backgrounds and independent thinking, bringing different ideas into dialogue and testing our views through open discussion to deepen our understanding."],["Candour / Communicate clearly","We explain the basis of our information, the scope of our services and the uncertainties that remain, building lasting trust through responsible communication and continued follow-up."]],
    people: "Our people",
    peopleTitle: "Diverse expertise Collaborative analysis",
    peopleText: "The HighBlock Securities team brings together experienced professionals from Hong Kong and mainland China with backgrounds in investment research, law and compliance. Drawing on their practical experience, our people assess projects through the lenses of industry development, company value and regulatory requirements, providing investors with services that combine research depth with professional standards.",
    contact: 'Contact us', services: 'Explore our services', compliance: 'Compliance and risk',
    legal: ['Disclaimers', 'Privacy policy', 'Terms of use'], note: 'This website is for Professional Investors only and does not constitute an offer, solicitation or promise of returns.',
    legalStatus: 'SFC Types 1, 4 and 9 regulated activities', verify: 'SFC public register', home: 'Home',
    contactTitle: 'Contact us', contactChannels: ['Phone', 'Email', 'Address'], contactPlaceholder: 'To be added', contactValues: ['To be added', 'To be added', 'Unit 04, Unit 05, 17/F, Universal Trade Centre, Nos. 3-5A Arbuthnot Road, Hong Kong'], contactText: 'Learn more about HighBlock’s information and advisory services for eligible Professional Investors.',
    contactLabel: 'Arrange a consultation', contactNotice: 'Online consultation requests are not currently available. Please use your existing official contact channel to arrange a meeting.',
    fields: ['Name', 'Phone', 'Email', 'Your question (optional)'], contactConsent: 'I have read the personal information collection statement and Privacy Policy.',
    contactButton: 'Online requests are not available', privacyContact: 'Compliance and personal data enquiries', privacyContactText: 'For compliance, website disclosure or personal data enquiries, please contact:',
    complianceTitle: 'Clarity builds<br>lasting trust', complianceText: 'The scope of services, regulatory information and data safeguards should be clear and accessible.',
    safeguards: [
      ['A licensed framework', 'HighBlock Securities Limited holds SFC Types 1, 4 and 9 licences, CE number BWW124. Refer to the SFC public register for the scope and conditions.'],
      ['Compliance and risk', 'Compliance review, appropriate advisory records and clear information about the scope of services and associated risks.'],
      ['Client due diligence', 'Identity checks, Professional Investor eligibility assessment and anti-money laundering review in line with applicable requirements.'],
      ['Personal data', 'Please refer to this website’s Privacy Policy and relevant collection statements for the collection, use and protection of personal data.']
    ],
    policyTitle: 'Website policies and disclosures', policyText: 'Please read the applicable policies and disclosures before using this website or our services.'
  }
};
const logo = '<img class="brand-symbol" src="assets/highblock-logo.svg" width="38" height="38" alt="" aria-hidden="true"><span class="brand-name">HighBlock<small>SECURITIES LIMITED</small></span>';
const file = (name, c) => `${name}${c.suffix}.html`;
const sfc = c => `https://apps.sfc.hk/publicregWeb/corp/BWW124/details?locale=${c.lang === 'en' ? 'en' : 'zh'}`;
function header(c, page) {
  const other = copy[c.other];
  return `<a class="skip-link" href="#main">${c.lang === 'en' ? 'Skip to content' : '跳至內容'}</a><header class="site-header"><div class="header-brand-group"><a href="${file('index', c)}" class="brand" aria-label="HighBlock Securities Limited ${c.home}">${logo}</a><a class="home-link" href="${file('index', c)}" ${page === 'index' ? 'aria-current="page"' : ''}>${c.lang === 'en' ? 'Home' : '首頁'}</a></div><nav class="main-nav" id="main-nav" aria-label="${c.lang === 'en' ? 'Main navigation' : '主要導覽'}"><a href="${file('about', c)}" ${page === 'about' ? 'aria-current="page"' : ''}>${c.nav[0]}</a><a href="${file('services', c)}" ${page === 'services' ? 'aria-current="page"' : ''}>${c.nav[1]}</a><a href="${file('compliance', c)}" ${page === 'compliance' ? 'aria-current="page"' : ''}>${c.nav[2]}</a><a class="nav-contact" href="${file('contact', c)}" ${page === 'contact' ? 'aria-current="page"' : ''}>${c.nav[3]}</a></nav><a class="language-link" href="${file(page, other)}" lang="${other.lang}" aria-label="${c.lang === 'en' ? '切換至繁體中文' : 'Switch to English'}">${c.language}</a><button class="menu-toggle" aria-label="${c.menu}" aria-controls="main-nav" aria-expanded="false"><span></span><span></span></button></header>`;
}
function footer(c) {
  return `<footer class="site-footer"><div class="footer-top"><a class="brand" href="${file('index', c)}">${logo}</a><div class="footer-nav"><a href="${file('about', c)}">${c.nav[0]}</a><a href="${file('services', c)}">${c.services}</a><a href="${file('compliance', c)}">${c.compliance}</a><a href="${file('contact', c)}">${c.contact}</a></div></div><div class="footer-bottom"><p>${c.note}</p><p>${c.legalStatus} · CE No. BWW124 · <a target="_blank" rel="noopener" href="${sfc(c)}">${c.verify}</a></p><p>© 2026 HighBlock Securities Limited. All rights reserved.</p></div></footer><nav class="legal-dock" aria-label="${c.lang === 'en' ? 'Legal information' : '法律資訊'}"><a href="legal/${file('risk-disclosure', c)}">${c.legal[0]}</a><a href="legal/${file('privacy-policy', c)}">${c.legal[1]}</a><a href="legal/${file('terms-of-use', c)}">${c.legal[2]}</a></nav>`;
}
function render(c, page, title, body, extra = '') {
  return `<!doctype html><html lang="${c.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#0a0e17"><meta name="description" content="${c.lang === 'en' ? 'HighBlock Securities Limited. Private equity market information and advisory services for Professional Investors.' : 'HighBlock Securities Limited 為專業投資者提供私募股權市場資訊及諮詢服務。'}"><meta name="robots" content="noindex,nofollow"><title>${title} | HighBlock Securities Limited</title><link rel="icon" href="assets/favicon.svg"><link rel="stylesheet" href="assets/site.css">${page === 'index' ? '<link rel="stylesheet" href="assets/research-planes.css">' : ''}${page === 'services' ? '<link rel="stylesheet" href="assets/services.css"><link rel="stylesheet" href="assets/services-devices.css">' : ''}<link rel="alternate" hreflang="${copy[c.other].lang}" href="${file(page, copy[c.other])}">${page === 'index' ? '<script defer src="assets/motion-flow.js"></script><script defer src="assets/financial-motion.js"></script><script defer src="assets/research-planes.js"></script>' : ''}<script defer src="assets/website-notice.js"></script><script defer src="assets/site.js"></script>${extra}</head><body data-page="${page}">${header(c, page)}${body}${footer(c)}</body></html>`;
}
function homepage(c) {
  return `<main id="main"><section class="hero" id="top"><div id="financial-background" class="financial-scene" role="img" aria-label="${c.lang === 'en' ? 'An abstract financial technology light sculpture' : '抽象金融科技光影雕塑'}"><canvas aria-hidden="true"></canvas><div class="vignette"></div></div><div class="hero-shade"></div><div class="brand-corners" aria-hidden="true"><img class="brand-corner corner-bottom-left" src="assets/highblock-logo.svg" width="40" height="40" alt=""></div><div class="hero-copy"><h1>${c.heroTitle}</h1><p class="hero-description">${c.heroText}</p><a class="button hero-link" href="${file('contact', c)}"><svg class="calendar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="4" y="5" width="16" height="16" rx="2"></rect><path d="M8 3v4M16 3v4M4 10h16"></path></svg><span>${c.heroCta}</span></a><div class="hero-credentials"><span class="hero-company">HighBlock Securities Limited</span><span class="hero-license">SFC CE No. BWW124 · <a href="${sfc(c)}" target="_blank" rel="noopener">${c.heroVerify}</a></span></div></div><div class="hero-bottom"><span class="hero-location">HONG KONG <i></i> PROFESSIONAL INVESTORS</span></div></section><section id="why" class="section-wrap why-section"><div class="section-head reveal"><p class="eyebrow">${c.why}</p><div><h2>${c.whyTitle}</h2><p class="body-copy">${c.whyIntro}</p></div></div><div class="advantages-grid">${c.advantages.map((a, i) => `<article class="advantage reveal"><div class="capability-mark mark-${i}" aria-hidden="true"><span></span><span></span><span></span></div><p class="utility-label">${a[2]}</p><h3>${a[0]}</h3><p>${a[1]}</p></article>`).join('')}</div><div class="section-links"><a class="text-link" href="${file('about', c)}">${c.nav[0]}</a><a class="text-link" href="${file('services', c)}">${c.services}</a></div></section><section class="section-wrap philosophy-section" id="philosophy"><div class="section-head reveal"><p class="eyebrow">${c.philosophy}</p><div><h2>${c.philosophyTitle}</h2><p class="body-copy">${c.philosophyIntro}</p></div></div>${researchPlanes(c)}</section><section class="section-wrap culture-section" id="culture"><div class="culture-intro reveal"><p class="eyebrow">${c.culture}</p><h2>${c.cultureTitle}</h2><p class="body-copy">${c.cultureIntro}</p></div><div class="values-grid">${c.values.map(v => `<article class="reveal"><h3>${v[0]}</h3><p>${v[1]}</p></article>`).join('')}</div></section><section class="section-wrap people-section" id="people"><p class="eyebrow reveal">${c.people}</p><div class="people-copy reveal"><h2>${c.peopleTitle}</h2><p class="body-copy">${c.peopleText}</p><a class="button" href="${file('contact', c)}">${c.contact}</a></div><div class="people-line" aria-hidden="true"><span></span><span></span><span></span></div></section></main>`;
}
function about(c) {
  return `<main id="main" class="inner-page"><section class="section-wrap page-intro about-intro"><p class="eyebrow">${c.nav[0]}</p><h1 class="page-heading">${c.aboutTitle}</h1></section><section class="section-wrap about-story"><p class="utility-label">HIGHBLOCK SECURITIES</p><div class="about-prose">${c.aboutParagraphs.map(p => `<p>${p}</p>`).join('')}<div class="section-links"><a class="text-link" href="${file('index', c)}#why">${c.why}</a><a class="text-link" href="${file('index', c)}#people">${c.people}</a></div></div></section></main>`;
}
function compliance(c) {
  return `<main id="main" class="inner-page"><section class="section-wrap page-intro"><p class="eyebrow">${c.nav[2]}</p><h1 class="page-heading">${c.complianceTitle}</h1><p class="body-copy">${c.complianceText}</p></section><section class="section-wrap safeguards-grid">${c.safeguards.map((s, i) => `<article><span class="utility-label">${['REGULATION','RISK','DUE DILIGENCE','PERSONAL DATA'][i]}</span><h2>${s[0]}</h2><p>${s[1]}</p>${i === 0 ? `<a class="text-link" href="${sfc(c)}" target="_blank" rel="noopener">${c.verify}</a>` : ''}</article>`).join('')}</section><section class="section-wrap policy-section"><h2>${c.policyTitle}</h2><p class="body-copy">${c.policyText}</p><div class="policy-links">${['risk-disclosure','privacy-policy','terms-of-use'].map((p, i) => `<a href="legal/${file(p, c)}">${c.legal[i]}</a>`).join('')}</div></section></main>`;
}
function contact(c) {
  const icons = ['<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.58 2.81.7A2 2 0 0 1 22 16.92z"></path>','<rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m3 7 9 6 9-6"></path>','<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"></path><circle cx="12" cy="10" r="2.5"></circle>'];
  return `<main id="main" class="inner-page"><section class="section-wrap page-intro contact-intro"><h1 class="page-heading">${c.contactTitle}</h1><p class="body-copy">${c.contactText}</p></section><section class="section-wrap contact-layout"><dl class="contact-channels">${c.contactChannels.map((label, i) => `<div class="contact-channel"><dt><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${icons[i]}</svg><span>${label}</span></dt><dd>${c.contactValues[i]}</dd></div>`).join('')}</dl><div class="contact-form-panel"><h2>${c.contactLabel}</h2><p class="availability-note" role="status">${c.contactNotice}</p><form class="consultation-form" data-contact-form><fieldset disabled><label>${c.fields[0]}<input name="name" autocomplete="name" type="text"></label><label>${c.fields[1]}<input name="phone" autocomplete="tel" type="tel"></label><label>${c.fields[2]}<input name="email" autocomplete="email" type="email"></label><label>${c.fields[3]}<textarea name="question" rows="3"></textarea></label><label class="consent-label"><input type="checkbox" name="consent">${c.contactConsent}</label><button class="button" disabled type="submit">${c.contactButton}</button></fieldset></form></div></section></main>`;
}
for (const c of Object.values(copy)) {
  fs.writeFileSync(path.join(out, file('index', c)), render(c, 'index', c.lang === 'en' ? 'Private Equity Information & Advisory' : '私募股權資訊與諮詢', homepage(c)));
  // Preserve old shared preview links by sending them to the selected homepage.
  fs.writeFileSync(path.join(out, file('motion-preview', c)), `<!doctype html><html lang="${c.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta http-equiv="refresh" content="0;url=${file('index', c)}"><title>HighBlock Securities Limited</title></head><body><a href="${file('index', c)}">${c.home}</a></body></html>`);
  fs.writeFileSync(path.join(out, file('about', c)), render(c, 'about', c.nav[0], about(c)));
  fs.writeFileSync(path.join(out, file('compliance', c)), render(c, 'compliance', c.nav[2], compliance(c)));
  fs.writeFileSync(path.join(out, file('contact', c)), render(c, 'contact', c.contact, contact(c)));
  const fragment = path.join(root, 'src', `services-${c.lang === 'en' ? 'en' : 'zh'}.html`);
  if (fs.existsSync(fragment)) fs.writeFileSync(path.join(out, file('services', c)), render(c, 'services', c.nav[1], fs.readFileSync(fragment, 'utf8').replace('<!-- services-devices -->', serviceDevices(c.lang)), '<script defer src="assets/services.js"></script>'));
}
fs.copyFileSync(path.join(out, 'assets/highblock-logo.svg'), path.join(out, 'assets/favicon.svg'));
console.log('Built HighBlock bilingual static pages.');

// The entry acknowledgement uses its own approved bilingual notice.
const websiteNotice = JSON.parse(fs.readFileSync(path.join(root, 'src/website-notice.json'), 'utf8'));
fs.writeFileSync(path.join(out, 'assets/website-notice.js'), `window.HighBlockWebsiteNotice = ${JSON.stringify(websiteNotice)};\n`);
for (const name of fs.readdirSync(path.join(out, 'legal')).filter(n => n.endsWith('.html'))) {
  const p = path.join(out, 'legal', name);
  let html = fs.readFileSync(p, 'utf8');
  if (!html.includes('src="../assets/website-notice.js"')) html = html.replace('<script defer src="../assets/site.js"></script>', '<script defer src="../assets/website-notice.js"></script><script defer src="../assets/site.js"></script>');
  fs.writeFileSync(p, html);
}

fs.writeFileSync(path.join(out, 'assets/research-planes.css'), researchPlanesCss);
