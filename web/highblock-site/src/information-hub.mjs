const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export function informationHub(c) {
  const en = c.lang === 'en';
  const copy = en ? {
    title: 'Information',
    intro: 'Licensing information, fund updates and website disclosures',
    contents: 'Information categories',
    updates: 'Fund updates',
    date: '5 August 2026',
    updateTitle: 'HighBlock Securities Granted SFC Type 1, 4 and 9 Licences',
    imageAlt: 'Image placeholder',
    updateFirst: 'On 5 August 2026, HighBlock Securities Limited was granted licences by Hong Kong’s Securities and Futures Commission (SFC) to carry on Type 1, Type 4 and Type 9 regulated activities. Its CE number is BWW124. All three regulated activities took effect on the same date.',
    updateActivities: 'The regulated activities cover dealing in securities (Type 1), advising on securities (Type 4) and asset management (Type 9).',
    updateConditions: 'Under the licence conditions recorded in the SFC public register, HighBlock Securities Limited may provide services only to Professional Investors in relation to Type 4 and Type 9 regulated activities.',
    source: 'Official source',
    sourceLabel: 'SFC public register · BWW124',
    licence: 'Licensing information',
    risk: 'Risk disclosures',
    terms: 'Website terms',
    company: 'Licensed corporation',
    ce: 'CE number',
    activities: 'Regulated activities',
    types: [['Type 1', 'Dealing in securities'], ['Type 4', 'Advising on securities'], ['Type 9', 'Asset management']],
    riskTitle: 'Risk Disclosure Statement and Disclaimer',
    riskText: 'Read the full statement before participating in any transaction and seek independent professional advice where appropriate',
    full: 'Read full document',
    privacy: 'Privacy Policy',
    privacyText: 'Collection, use and protection of personal data',
    use: 'Terms of Use',
    useText: 'Terms applicable to access to and use of this website',
  } : {
    title: '資訊',
    intro: '查閱持牌資料、基金動態及網站相關聲明',
    contents: '資訊分類',
    updates: '基金動態',
    date: '2026 年 8 月 5 日',
    updateTitle: 'HighBlock Securities 獲發香港證監會第 1、4、9 類牌照',
    imageAlt: '圖片待補',
    updateFirst: 'HighBlock Securities Limited 於 2026 年 8 月 5 日獲香港證券及期貨事務監察委員會（「證監會」）發牌，獲准從事第 1、4、9 類受規管活動，中央編號為 BWW124。三項受規管活動均於同日生效。',
    updateActivities: '受規管活動範圍涵蓋證券交易（第 1 類）、就證券提供意見（第 4 類）及提供資產管理（第 9 類）。',
    updateConditions: '根據證監會公眾紀錄冊所載牌照條件，HighBlock Securities Limited 就第 4 類及第 9 類受規管活動，只可向專業投資者提供服務。',
    source: '官方資料來源',
    sourceLabel: '香港證監會公眾紀錄冊 · BWW124',
    licence: '持牌資料',
    risk: '風險披露',
    terms: '網站條款',
    company: '持牌法團',
    ce: '中央編號',
    activities: '受規管活動',
    types: [['第 1 類', '證券交易'], ['第 4 類', '就證券提供意見'], ['第 9 類', '資產管理']],
    riskTitle: '風險披露聲明及免責聲明',
    riskText: '請在參與任何交易前細閱聲明全文，並按需要尋求獨立專業意見',
    full: '閱讀全文',
    privacy: '私隱政策',
    privacyText: '有關個人資料的收集、使用及保護',
    use: '使用條款',
    useText: '瀏覽及使用本網站所適用的條款',
  };
  const doc = name => `legal/${name}${c.suffix}.html`;
  const sfc = `https://apps.sfc.hk/publicregWeb/corp/BWW124/details?locale=${en ? 'en' : 'zh'}`;
  return `<main id="main" class="inner-page information-hub">
  <header class="ih-container ih-intro">
    <p class="eyebrow">HIGHBLOCK SECURITIES LIMITED</p>
    <h1>${copy.title}</h1>
    <p class="ih-intro-copy">${copy.intro}</p>
  </header>
  <div class="ih-container ih-layout">
    <aside class="ih-sidebar">
      <div class="ih-navigation">
        <p class="ih-nav-label" id="information-categories">${copy.contents}</p>
        <nav class="ih-tabs" aria-labelledby="information-categories" data-information-tabs>
          <a id="information-tab-licensing" href="#licensing">${copy.licence}</a>
          <a id="information-tab-fund-updates" href="#fund-updates">${copy.updates}</a>
          <a id="information-tab-risk-disclosures" href="#risk-disclosures">${copy.risk}</a>
          <a id="information-tab-website-terms" href="#website-terms">${copy.terms}</a>
        </nav>
      </div>
    </aside>
    <div class="ih-content">
      <section id="licensing" class="ih-section" data-information-panel aria-labelledby="licensing-heading">
        <h2 id="licensing-heading">${copy.licence}</h2>
        <div class="ih-licence-panel">
          <dl class="ih-entity">
            <div class="ih-entity-name"><dt>${copy.company}</dt><dd>HighBlock Securities Limited</dd></div>
            <div class="ih-entity-ce"><dt>${copy.ce}</dt><dd>BWW124</dd></div>
          </dl>
          <h3 class="ih-activity-label">${copy.activities}</h3>
          <dl class="ih-activities">${copy.types.map(([type, name]) => `<div><dt>${type}</dt><dd>${name}</dd></div>`).join('')}</dl>
          <p class="ih-scope">${escape(c.safeguards[0][1])}</p>
          <a class="ih-register-link" href="${sfc}" target="_blank" rel="noopener">${escape(c.verify)}</a>
        </div>
      </section>
      <section id="fund-updates" class="ih-section" data-information-panel aria-labelledby="fund-updates-heading">
        <h2 id="fund-updates-heading">${copy.updates}</h2>
        <article class="ih-update">
          <header class="ih-update-header"><time datetime="2026-08-05">${copy.date}</time><h3>${copy.updateTitle}</h3></header>
          <div class="ih-update-visual ih-image-placeholder" role="img" aria-label="${copy.imageAlt}"><span aria-hidden="true">${copy.imageAlt}</span></div>
          <div class="ih-update-prose"><p>${copy.updateFirst}</p><p>${copy.updateActivities}</p><p>${copy.updateConditions}</p></div>
          <aside class="ih-update-source"><p>${copy.source}</p><a href="${sfc}" target="_blank" rel="noopener">${copy.sourceLabel}</a></aside>
        </article>
      </section>
      <section id="risk-disclosures" class="ih-section" data-information-panel aria-labelledby="risk-disclosures-heading">
        <h2 id="risk-disclosures-heading">${copy.risk}</h2>
        <a class="ih-risk-document" href="${doc('risk-disclosure')}">
          <div class="ih-document-copy"><h3>${copy.riskTitle}</h3><p>${copy.riskText}</p></div>
          <span class="ih-document-action">${copy.full}</span>
        </a>
      </section>
      <section id="website-terms" class="ih-section" data-information-panel aria-labelledby="website-terms-heading">
        <h2 id="website-terms-heading">${copy.terms}</h2>
        <div class="ih-document-list">
          <a class="ih-document-row" href="${doc('privacy-policy')}"><div class="ih-document-copy"><h3>${copy.privacy}</h3><p>${copy.privacyText}</p></div><span class="ih-document-action">${copy.full}</span></a>
          <a class="ih-document-row" href="${doc('terms-of-use')}"><div class="ih-document-copy"><h3>${copy.use}</h3><p>${copy.useText}</p></div><span class="ih-document-action">${copy.full}</span></a>
        </div>
      </section>
    </div>
  </div>
</main>`;
}
