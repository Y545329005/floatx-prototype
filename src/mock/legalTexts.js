// 正式法务文本（2026-10-22 · 公司提供 docx 原文录入，替换原型占位稿）
// 三语结构：{ 'zh-CN': ..., 'zh-HK': ..., en: ... }；p 为段落数组（一段一 <p>，空数组表示仅小节标题）
// 使用条款 / 隐私政策原文为简体，繁中由 ICU Hans-Hant 转写；风险披露原文为繁中，简中由 Hant-Hans 转写
const T = (zhCN, zhHK, en) => ({ 'zh-CN': zhCN, 'zh-HK': zhHK, en });

/* ===== 使用条款 Terms and Conditions ===== */
export const termsOfUseSections = [
  {
    h: T("", "", ""),
    p: [
      T("在使用本网站之前，请仔细阅读相关使用条款与条件（下称「使用条款」）。阁下登入、浏览及/或使用本网站及其任何网页（下称「本网站」）时，表示阁下已阅读、得悉及同意被使用条款所约束。当阁下使用本网站，即同意受到登入本网站之日所生效的使用条款版本监管。我们保留随时更改本网站及使用条款之权利，而无需发出通知。本网站由HighBlock Securities Limited（下称「HighBlock」）提供，并仅供参考之用。本网站内容未经证券及期货事务监察委员会审查。", "在使用本網站之前，請仔細閱讀相關使用條款與條件（下稱「使用條款」）。閣下登入、瀏覽及/或使用本網站及其任何網頁（下稱「本網站」）時，表示閣下已閱讀、得悉及同意被使用條款所約束。當閣下使用本網站，即同意受到登入本網站之日所生效的使用條款版本監管。我們保留隨時更改本網站及使用條款之權利，而無需發出通知。本網站由HighBlock Securities Limited（下稱「HighBlock」）提供，並僅供參考之用。本網站內容未經證券及期貨事務監察委員會審查。", "Please read these terms and conditions of use (“Terms” hereinafter) with care before using this website. By accessing, browsing, and/or using this website and any pages hereof (“This Website” hereinafter), you are indicating that you have read, acknowledged and agreed to be bound by the Terms. Your use of This Website is governed by the version of Terms in effect on the date This Website is accessed by you. We reserve the right to change This Website and the Terms at any time without prior notice. The contents of This Website are provided for reference only by HighBlock Securities Limited (“HighBlock” hereinafter). The contents of This Website have not been reviewed by the Hong Kong Securities and Futures Commission."),
    ],
  },
  {
    h: T("不构成任何要约", "不構成任何要約", "No Solicitation Nor Offer"),
    p: [
      T("本网站上包含的信息或意见并不构成发行、出售要约或诱使购买任何证券或金融工具，也不构成任何投资建议或有关此类证券或其他金融工具的建议。如果您试图以任何方式依赖本网站上包含的任何内容，则后果自负。在做出可能影响您或您个人财务或业务的任何决定或采取任何行动之前，您应始终咨询具有适当资格的专业顾问，以获取适当的财务、法律、会计、税务和其他建议。", "本網站上包含的信息或意見並不構成發行、出售要約或誘使購買任何證券或金融工具，也不構成任何投資建議或有關此類證券或其他金融工具的建議。如果您試圖以任何方式依賴本網站上包含的任何內容，則後果自負。在做出可能影響您或您個人財務或業務的任何決定或採取任何行動之前，您應始終諮詢具有適當資格的專業顧問，以獲取適當的財務、法律、會計、稅務和其他建議。", "The information or opinions contained on This Website do not constitute a distribution, an offer to sell or the solicitation of an offer to buy any securities or financial instruments or investment advice or any advice or recommendation in respect of such securities or other financial instrument, nor is the information directed at any jurisdiction in which such distribution, offer, sale or recommendation would be unlawful or not authorized nor is it directed at persons which such offer, sale or recommendation is not authorized. Should you seek to rely in any way whatsoever upon any content contained on This Website, you do so at your own risk. Before you make any decision or take any action that might affect you or your personal finances or business, you should always consult a suitably qualified professional adviser(s) to obtain appropriate financial, legal, accounting, tax and other advice."),
      T("本网站所载资料只适用于专业投资者（定义见于《证券及期货条例》及《证券及期货（专业投资者）规则》），无论在任何权限下，其内容不可视为分销、销售优惠或购买证券之诱因，如果有关活动在有关权限之法律下是不合法的，特别是美国。有关基金的详细声明，请查阅有关销售文件及认购章程。如网站所载资料与有关基金的认购章程不符，以认购章程和其他此类文件中的表述为准。", "本網站所載資料只適用於專業投資者（定義見於《證券及期貨條例》及《證券及期貨（專業投資者）規則》），無論在任何權限下，其內容不可視為分銷、銷售優惠或購買證券之誘因，如果有關活動在有關權限之法律下是不合法的，特別是美國。有關基金的詳細聲明，請查閱有關銷售文件及認購章程。如網站所載資料與有關基金的認購章程不符，以認購章程和其他此類文件中的表述為準。", "The information contained on This Website is intended for Professional Investors only as defined under the Securities and Futures Ordinance and the Securities and Futures (Professional Investor) Rules and should not be construed as a distribution, an offer to sell, or a solicitation to buy any securities in any jurisdiction where such activities would be unlawful under the laws of such jurisdiction, in particular the United States of America. Please refer to the offering documents for further important details. If the information contained in This Website is inconsistent with the relevant offering documents the information in the relevant offering documents and other such documents shall prevail."),
    ],
  },
  {
    h: T("不承担任何责任及不作担保", "不承擔任何責任及不作擔保", "No Liability Nor Warranty"),
    p: [
      T("本网站中包含的信息或我们提供给您的信息仅供参考。对于此类信息，我们不承担任何责任。我们认为，本网站上包含的信息在发布之日是准确的，但是对于此类信息的准确性、适用性、有用性、可靠性或完整性，我们不做任何保证，对于任何错误或遗漏也不承担任何责任（包括任何第三方责任），适用于包括董事或员工。", "本網站中包含的信息或我們提供給您的信息僅供參考。對於此類信息，我們不承擔任何責任。我們認為，本網站上包含的信息在發佈之日是準確的，但是對於此類信息的準確性、適用性、有用性、可靠性或完整性，我們不做任何保證，對於任何錯誤或遺漏也不承擔任何責任（包括任何第三方責任），適用於包括董事或員工。", "The information contained in This Website or provided to you by us is provided for reference purposes only. We do not accept any responsibility whatsoever in respect of such information. We believe that the information contained on This Website is accurate as at the date of publication, however, no warranty is made as to accuracy, suitability, usefulness, reliability or completeness of any such information and no liability in respect of any errors or omissions (including any third-party liability) is accepted by HighBlock, its directors or employees."),
    ],
  },
  {
    h: T("免责声明", "免責聲明", "Disclaimer"),
    p: [
      T("本网站所列载的任何内容并非及不应被视为买卖任何理财产品的要约，亦不应被视为投资建议。您应就本身的投资经验、投资目标、财政资源及其他相关条件，小心衡量自己是否适合参与任何投资产品。投资涉及风险。投资者不应仅根据此资料而作出投资决定。详情及风险因素请参阅有关基金的认购章程。基金或股份的价格及盈利有升有跌，资料内所载的过往表现，不可视作未来表现的指标。如有疑问，请寻求独立的财务和专业建议。", "本網站所列載的任何內容並非及不應被視為買賣任何理財產品的要約，亦不應被視為投資建議。您應就本身的投資經驗、投資目標、財政資源及其他相關條件，小心衡量自己是否適合參與任何投資產品。投資涉及風險。投資者不應僅根據此資料而作出投資決定。詳情及風險因素請參閱有關基金的認購章程。基金或股份的價格及盈利有升有跌，資料內所載的過往表現，不可視作未來表現的指標。如有疑問，請尋求獨立的財務和專業建議。", "Nothing contained in or on This Website should be construed as an offer to buy or sell any investment products, and should not be considered as investment advice. You should carefully consider whether any investment products are appropriate in view of your investment experience, objectives, financial resources and relevant circumstances. Investment involves risk. Investors should not make investment decision based on This Website or its materials alone. Please refer to the offering documents of the respective funds for details, including risk factors. The price of units or shares and the income from them may go down as well as up and any past performance figures shown are not indicative of future performance. If in doubt, please seek independent financial and professional advice."),
      T("HighBlock已尽其所知及所信，使本网站所载数据在发布之时为真实准确；但HighBlock并不声明或保证（不论明示或暗示）有关本网站所载信息及数据的准确性及完备性。HighBlock，其联属机构，董事，高级职员及雇员对本网站所提供数据的任何错误或遗漏并不负有相关责任，亦并不会对任何源自于或有关于使用本网站提供的信息而导致的任何损失或费用承担责任（包括但不限于利润损失、交易损失或任何因使用或无法使用本网站引致的损害赔偿）。", "HighBlock已盡其所知及所信，使本網站所載數據在發佈之時為真實準確；但HighBlock並不聲明或保證（不論明示或暗示）有關本網站所載信息及數據的準確性及完備性。HighBlock，其聯屬機構，董事，高級職員及僱員對本網站所提供數據的任何錯誤或遺漏並不負有相關責任，亦並不會對任何源自於或有關於使用本網站提供的信息而導致的任何損失或費用承擔責任（包括但不限於利潤損失、交易損失或任何因使用或無法使用本網站引致的損害賠償）。", "All information contained in This Website is published to the best of the knowledge and belief of HighBlock to be accurate at the time it was published. However, no representation or warranty, expressed or implied is made by HighBlock as to its accuracy or completeness of the information or data provided in This Website. HighBlock, its affiliates, directors, officers or employees accept no liability for any errors or omissions relating to information available in This Website, and will not be liable for any damages or costs (including but not limited to lost profits, trading losses or damages that result from use or loss of use of This Website) arising out of or in any way connected with the use of the information provided in This Website."),
    ],
  },
  {
    h: T("链接至其他网站", "連結至其他網站", "Links to Other Websites"),
    p: [
      T("我们可能在本网站中建立与其他一个或多个第三方营运之网站的链接。我们无法控制上述其他网站以及网站中所提供的内容或产品/服务。任何上述链接的存在不得构成我们对于上述其他网站、网站所提供之内容、产品或服务以及网站运营方的认许、陈述或保证。您对上述网站的访问和使用受该等网站使用条款和隐私政策的约束且概由您自行承担风险。", "我們可能在本網站中建立與其他一個或多個第三方營運之網站的連結。我們無法控制上述其他網站以及網站中所提供的內容或產品/服務。任何上述連結的存在不得構成我們對於上述其他網站、網站所提供之內容、產品或服務以及網站運營方的認許、陳述或保證。您對上述網站的訪問和使用受該等網站使用條款和隱私政策的約束且概由您自行承擔風險。", "We may establish links between This Website and one or more websites operated by third parties. We have no control over any such other websites, the contents therein or the products/services offered. The existence of any such links shall not constitute an endorsement of, or representation or warranty by us regarding such websites, the contents of the websites or the products or services of the websites. Your access to and use of such linked websites is governed by the terms of use and privacy policies of those sites and shall be at your own risk."),
    ],
  },
  {
    h: T("系统中断和不完整传输", "系統中斷和不完整傳輸", "System Outages and Incomplete Transmissions"),
    p: [
      T("网络传输或软件问题可能会产生不准确或不完整的信息和材料副本并可能被下载和显示于用户计算机中。HighBlock对任何于信息和材料传输过程中出现的损害、改变或遗漏均不承担责任。", "網絡傳輸或軟件問題可能會產生不準確或不完整的信息和材料副本並可能被下載和顯示於用戶電腦中。HighBlock對任何於信息和材料傳輸過程中出現的損害、改變或遺漏均不承擔責任。", "Internet transmission or software problems may produce inaccurate or incomplete copies of information and materials that may be downloaded and displayed on a user's computer. HighBlock is not liable for any damages, changes, or omissions that occur during transmission of information and materials."),
    ],
  },
  {
    h: T("其他", "其他", "Other"),
    p: [
      T("在未经HighBlock同意下，请勿复制、分发、刊发、倚赖或使用本网站当中的数据。", "在未經HighBlock同意下，請勿複製、分發、刊發、倚賴或使用本網站當中的數據。", "You must not copy, distribute, publish, rely on or otherwise use information contained in This Website without HighBlock’s consent."),
    ],
  },
  {
    h: T("", "", ""),
    p: [
      T("本使用条款的中文版本仅供参考。如本使用条款的中英文版本之间存在任何不一致或冲突，应以英文版本为准。", "本使用條款的中文版本僅供參考。如本使用條款的中英文版本之間存在任何不一致或衝突，應以英文版本為準。", ""),
    ],
  },
];

/* ===== 风险披露声明及免责声明 Risk Disclosure Statements and Disclaimers ===== */
export const riskDisclosureSections = [
  {
    h: T("重要通知", "重要通知", "IMPORTANT NOTICE"),
    p: [
      T("此等风险披露声明不拟披露或讨论任何交易的所有风险及其他重要事项。因此，若你认为恰当便应该谘询你自己的法律、税务、财务及其他专业顾问，并且确保自己完全明白涉及的风险，与及满意自己于你进行任何某宗交易之前，你是愿意接受一切有关风险。重要的是你必须根据自己的投资经验、投资目标、财务状况及其他有关情况，去判断有关交易是否适合你。你明白、同意及接受以下你预期或实际买卖或其他活动须面对的风险。", "此等風險披露聲明不擬披露或討論任何交易的所有風險及其他重要事項。因此，若你認為恰當便應該諮詢你自己的法律、稅務、財務及其他專業顧問，並且確保自己完全明白涉及的風險，與及滿意自己於你進行任何某宗交易之前，你是願意接受一切有關風險。重要的是你必須根據自己的投資經驗、投資目標、財務狀況及其他有關情況，去判斷有關交易是否適合你。你明白、同意及接受以下你預期或實際買賣或其他活動須面對的風險。", "These risk disclosure statements do not purport to disclose or discuss all of the risks and other significant aspects of any transaction. You should therefore consult with your own legal, tax, financial and other professional advisers as you deem appropriate and ensure that you fully understand the risks involved and satisfy yourself that you are willing to accept such risks before entering into any particular transaction. It is important for you to determine whether any transaction is suitable for you in the light of your own investment experience, investment objectives, financial situation and other relevant circumstances. You understand, agree and accept the following risks where they apply to your expected or actual trading or other activity."),
    ],
  },
  {
    h: T("证券交易的风险", "證券交易的風險", "RISK OF SECURITIES TRADING"),
    p: [
      T("证券价格有时可能会非常波动。证券价格可升可跌，甚至变成毫无价值。买卖证券未必一定能够赚取利润，反而可能会招致损失。", "證券價格有時可能會非常波動。證券價格可升可跌，甚至變成毫無價值。買賣證券未必一定能夠賺取利潤，反而可能會招致損失。", "The prices of securities fluctuate, sometimes dramatically. The price of a security may move up or down, and may become valueless. It is as likely that losses will be incurred rather than profit made as a result of buying and selling securities."),
    ],
  },
  {
    h: T("买卖创业板股份的风险", "買賣創業板股份的風險", "RISK OF TRADING GROWTH ENTERPRISE MARKET STOCKS"),
    p: [
      T("创业板股份涉及很高的投资风险。尤其是该等公司可在无需具备盈利往绩及无需预测未来盈利的情况下在创业板上市。创业板股份可能非常波动及流通性很低。", "創業板股份涉及很高的投資風險。尤其是該等公司可在無需具備盈利往績及無需預測未來盈利的情況下在創業板上市。創業板股份可能非常波動及流通性很低。", "Growth Enterprise Market (GEM) stocks involve a high investment risk. In particular, companies may list on GEM with neither a track record of profitability nor any obligation to forecast future profitability. GEM stocks may be very volatile and illiquid."),
      T("你只应在审慎及仔细考虑后，才作出有关的投资决定。创业板市场的较高风险性质及其他特点，意味着这个市场较适合专业及其他熟悉投资技巧的投资者。", "你只應在審慎及仔細考慮後，才作出有關的投資決定。創業板市場的較高風險性質及其他特點，意味著這個市場較適合專業及其他熟悉投資技巧的投資者。", "You should make the decision to invest only after due and careful consideration. The greater risk profile and other characteristics of GEM mean that it is a market more suited to professional and other sophisticated investors."),
      T("现时有关创业板股份的资料只可以在香港联合交易所有限公司所操作的互联网网站上找到。创业板上市公司一般毋须在宪报指定的报章刊登付费公告。", "現時有關創業板股份的資料只可以在香港聯合交易所有限公司所操作的互聯網網站上找到。創業板上市公司一般毋須在憲報指定的報章刊登付費公告。", "Current information on GEM stocks may only be found on the internet website operated by The Stock Exchange of Hong Kong Limited. GEM Companies are usually not required to issue paid announcements in gazetted newspapers."),
      T("假如你对本风险披露声明的内容或创业板市场的性质及在创业板买卖的股份所涉风险有不明白之处，应寻求独立的专业意见。", "假如你對本風險披露聲明的內容或創業板市場的性質及在創業板買賣的股份所涉風險有不明白之處，應尋求獨立的專業意見。", "You should seek independent professional advice if you are uncertain of or have not understood any aspect of this risk disclosure statement or the nature and risks involved in trading of GEM stocks."),
    ],
  },
  {
    h: T("在香港以外地方收取或持有的客户资产的风险", "在香港以外地方收取或持有的客戶資產的風險", "RISK OF CLIENT ASSETS RECEIVED OR HELD OUTSIDE HONG KONG"),
    p: [
      T("持牌人或注册人在香港以外地方收取或持有的客户资产，是受到有关海外司法管辖区的适用法律及规例所监管的。这些法律及规例与《证券及期货条例》（第 571 章）及根据该条例制订的规则可能有所不同。因此，有关客户资产将可能不会享有赋予在香港收取或持有的客户资产的相同保障。", "持牌人或註冊人在香港以外地方收取或持有的客戶資產，是受到有關海外司法管轄區的適用法律及規例所監管的。這些法律及規例與《證券及期貨條例》（第 571 章）及根據該條例制訂的規則可能有所不同。因此，有關客戶資產將可能不會享有賦予在香港收取或持有的客戶資產的相同保障。", "Client assets received or held by the licensed or registered person outside Hong Kong are subject to the applicable laws and regulations of the relevant overseas jurisdiction which may be different from the Securities and Futures Ordinance (Cap.571) and the rules made thereunder. Consequently, such client assets may not enjoy the same protection as that conferred on client assets received or held in Hong Kong."),
    ],
  },
  {
    h: T("提供将你的证券抵押品等再质押的授权书的风险", "提供將你的證券抵押品等再質押的授權書的風險", "RISK OF PROVIDING AN AUTHORITY TO REPLEDGE YOUR SECURITIES COLLATERAL ETC."),
    p: [
      T("向持牌人或注册人提供授权书，容许其按照某份证券借贷协议书使用你的证券或证券抵押品、将你的证券抵押品再质押以取得财务通融，或将你的证券抵押品存放为用以履行及清偿其交收责任及债务的抵押品，存在一定风险。", "向持牌人或註冊人提供授權書，容許其按照某份證券借貸協議書使用你的證券或證券抵押品、將你的證券抵押品再質押以取得財務通融，或將你的證券抵押品存放為用以履行及清償其交收責任及債務的抵押品，存在一定風險。", "There is risk if you provide the licensed or registered person with an authority that allows it to apply your securities or securities collateral pursuant to a securities borrowing and lending agreement, re-pledge your securities collateral for financial accommodation or deposit your securities collateral as collateral for the discharge and satisfaction of its settlement obligations and liabilities."),
      T("假如你的证券或证券抵押品是由持牌人或注册人在香港收取或持有的，则上述安排仅限于你已就此给予书面同意的情况下方行有效。此外，除非你是专业投资者，你的授权书必须指明有效期，而该段有效期不得超逾12个月。若你是专业投资者，则有关限制并不适用。", "假如你的證券或證券抵押品是由持牌人或註冊人在香港收取或持有的，則上述安排僅限於你已就此給予書面同意的情況下方行有效。此外，除非你是專業投資者，你的授權書必須指明有效期，而該段有效期不得超逾12個月。若你是專業投資者，則有關限制並不適用。", "If your securities or securities collateral are received or held by the licensed or registered person in Hong Kong, the above arrangement is allowed only if you consent in writing. Moreover, unless you are a professional investor, your authority must specify the period for which it is current and be limited to not more than 12 months. If you are a professional investor, these restrictions do not apply."),
      T("此外，假如你的持牌人或注册人在有关授权的期限届满前最少14日向你发出有关授权将被视为已续期的提示，而你对于在有关授权的限期届满前以此方式将该授权延续不表示反对，则你的授权将会在没有你的书面同意下被视为已续期。", "此外，假如你的持牌人或註冊人在有關授權的期限屆滿前最少14日向你發出有關授權將被視為已續期的提示，而你對於在有關授權的限期屆滿前以此方式將該授權延續不表示反對，則你的授權將會在沒有你的書面同意下被視為已續期。", "Additionally, your authority may be deemed to be renewed (i.e. without your written consent) if the licensed or registered person issues you a reminder at least 14 days prior to the expiry of the authority, and you do not object to such deemed renewal before the expiry date of your then existing authority."),
      T("现时并无任何法例规定你必须签署这些授权书。然而，持牌人或注册人可能需要授权书，以便例如向你提供保证金贷款或获准将你的证券或证券抵押品借出予第三方或作为抵押品存放于第三方。有关持牌人或注册人应向你阐释将为何种目的而使用授权书。", "現時並無任何法例規定你必須簽署這些授權書。然而，持牌人或註冊人可能需要授權書，以便例如向你提供保證金貸款或獲准將你的證券或證券抵押品借出予第三方或作為抵押品存放於第三方。有關持牌人或註冊人應向你闡釋將為何種目的而使用授權書。", "You are not required by any law to sign these authorities. But an authority may be required by licensed or registered persons, for example, to facilitate margin lending to you or to allow your securities or securities collateral to be lent to or deposited as collateral with third parties. The licensed or registered person should explain to you the purposes for which one of these authorities is to be used."),
      T("倘若你签署授权书，而你的证券或证券抵押品已借出予或存放于第三方，该等第三方将对你的证券或证券抵押品具有留置权或作出押记。虽然有关持牌人或注册人根据你的授权书而借出或存放属于你的证券或证券抵押品须对你负责，但上述持牌人或注册人的违责行为可能会导致你损失你的证券或证券抵押品。", "倘若你簽署授權書，而你的證券或證券抵押品已借出予或存放於第三方，該等第三方將對你的證券或證券抵押品具有留置權或作出押記。雖然有關持牌人或註冊人根據你的授權書而借出或存放屬於你的證券或證券抵押品須對你負責，但上述持牌人或註冊人的違責行為可能會導致你損失你的證券或證券抵押品。", "If you sign one of these authorities and your securities or securities collateral are lent to or deposited with third parties, those third parties will have a lien or charge on your securities or securities collateral. Although the licensed or registered person is responsible to you for securities or securities collateral lent or deposited under your authority, a default by it could result in the loss of your securities or securities collateral."),
      T("大多数持牌人或注册人均提供不涉及证券借贷的现金帐户。假如你毋需使用保证金贷款，或不希望本身证券或证券抵押品被借出或遭抵押，则切勿签署上述的授权书，并应要求开立该等现金帐户。", "大多數持牌人或註冊人均提供不涉及證券借貸的現金帳戶。假如你毋需使用保證金貸款，或不希望本身證券或證券抵押品被借出或遭抵押，則切勿簽署上述的授權書，並應要求開立該等現金帳戶。", "A cash account not involving securities borrowing and lending is available from most licensed or registered persons. If you do not require margin facilities or do not wish your securities or securities collateral to be lent or pledged, do not sign the above authorities and ask to open this type of cash account."),
    ],
  },
  {
    h: T("提供代存邮件或将邮件转交第三方的授权书的风险", "提供代存郵件或將郵件轉交第三方的授權書的風險", "RISK OF PROVIDING AN AUTHORITY TO HOLD MAIL OR TO DIRECT MAIL TO THIRD PARTIES"),
    p: [
      T("假如你向持牌人或注册人提供授权书，允许他代存邮件或将邮件转交予第三方，那么你便须尽速亲身收取所有关于你帐户的成交单据及结单，并加以详细阅读，以确保可及时侦察到任何差异或错误。", "假如你向持牌人或註冊人提供授權書，允許他代存郵件或將郵件轉交予第三方，那麼你便須盡速親身收取所有關於你帳戶的成交單據及結單，並加以詳細閱讀，以確保可及時偵察到任何差異或錯誤。", "If you provide the licensed or registered person with an authority to hold mail or to direct mail to third parties, it is important for you to promptly collect in person all contract notes and statements of your account and review them in detail to ensure that any anomalies or mistakes can be detected in a timely fashion."),
    ],
  },
  {
    h: T("在香港联合交易所有限公司买卖纳斯达克－美国证券交易所证券的风险", "在香港聯合交易所有限公司買賣納斯達克－美國證券交易所證券的風險", "RISK OF TRADING NASDAQ-AMEX SECURITIES AT THE STOCK EXCHANGE OF HONG KONG LIMITED"),
    p: [
      T("按照纳斯达克－美国证券交易所试验计划（「试验计划」）挂牌买卖的证券是为熟悉投资技巧的投资者而设的。你在买卖该项试验计划的证券之前，应先谘询有关持牌人或注册人的意见和熟悉该项试验计划。你应知悉，按照该项试验计划挂牌买卖的证券并非以香港联合交易所有限公司的主板或创业板作第一或第二上市的证券类别加以监管。", "按照納斯達克－美國證券交易所試驗計劃（「試驗計劃」）掛牌買賣的證券是為熟悉投資技巧的投資者而設的。你在買賣該項試驗計劃的證券之前，應先諮詢有關持牌人或註冊人的意見和熟悉該項試驗計劃。你應知悉，按照該項試驗計劃掛牌買賣的證券並非以香港聯合交易所有限公司的主板或創業板作第一或第二上市的證券類別加以監管。", "The securities under the NASDAQ-AMEX Pilot Program (“PP”) are aimed at sophisticated investors. You should consult the licensed or registered person and become familiarized with the PP before trading in the PP securities. You should be aware that the PP securities are not regulated as a primary or secondary listing on the Main Board or the Growth Enterprise Market of The Stock Exchange of Hong Kong Limited."),
    ],
  },
  {
    h: T("电子通讯相关的风险", "電子通訊相關的風險", "RISK ASSOCIATED WITH ELECTRONIC COMMUNICATION"),
    p: [
      T("你明了基于互联网或其他电子通讯系统可能遇到未可预计的交通挤塞情况及其他原因，因此电子通讯系统可能并非是可靠的通讯途径，而这种不可靠性并非HighBlock Securities Limited（「HighBlock」）所能控制。这可能会导致下列情况，包括：在传送或收取你的指示或其他资料时有所延误、延误执行买卖盘或有关买卖盘以有别于你落盘时的市价执行、你与HighBlock进行通讯时出现误解及错误等等。尽管HighBlock将会采取一切可行的步骤去保障其系统、顾客资料、帐户及为客户利益而持有的资产，你接纳透过电子通讯系统进行交易所涉及的风险。", "你明瞭基於互聯網或其他電子通訊系統可能遇到未可預計的交通擠塞情況及其他原因，因此電子通訊系統可能並非是可靠的通訊途徑，而這種不可靠性並非HighBlock Securities Limited（「HighBlock」）所能控制。這可能會導致下列情況，包括：在傳送或收取你的指示或其他資料時有所延誤、延誤執行買賣盤或有關買賣盤以有別於你落盤時的市價執行、你與HighBlock進行通訊時出現誤解及錯誤等等。儘管HighBlock將會採取一切可行的步驟去保障其系統、顧客資料、帳戶及為客戶利益而持有的資產，你接納透過電子通訊系統進行交易所涉及的風險。", "You understand that the Internet or other electronic communication system, due to unpredictable traffic congestion and other reasons, may not be a reliable medium of communication and that such unreliability is beyond the control of HighBlock Securities Limited (“HighBlock”). This may give rise to situations including delays in transmission and receipt of your instructions or other information, delays in execution or execution of your instructions at prices different from those prevailing at the time your instructions were given, misunderstanding and errors in any communication between you and HighBlock and so on. Whilst HighBlock will take every possible step to safeguard its systems, client information, accounts and assets held for the benefit of its clients, you accept the risk of conducting transactions via electronic communication systems."),
    ],
  },
  {
    h: T("进行场外交易的风险", "進行場外交易的風險", "RISKS OF ENTERING INTO OTC TRANSACTIONS"),
    p: [
      T("在某些司法管豁区，场外交易或会是容许或获批准的。就某宗场外交易而言，有可能很困难或甚至无法去平掉现有的仓位、进行估值、判断价格或评估须承受的风险。因此，场外交易或会涉及更高的风险。此等交易也可能受到较宽松的规管或受另一个监管制度所约束。于你进行此等交易之前，你应当熟习适用的规则及有关的风险。", "在某些司法管豁區，場外交易或會是容許或獲批准的。就某宗場外交易而言，有可能很困難或甚至無法去平掉現有的倉位、進行估值、判斷價格或評估須承受的風險。因此，場外交易或會涉及更高的風險。此等交易也可能受到較寬鬆的規管或受另一個監管制度所約束。於你進行此等交易之前，你應當熟習適用的規則及有關的風險。", "Over-the-counter transactions (“OTC Transactions”) may be allowed or permitted in some jurisdictions. With regard to an OTC Transaction, it may be difficult or impossible to liquidate an existing position, to assess the value, to determine a fair price or to assess the exposure to risk. For these reasons, OTC Transactions may involve increased risks. OTC Transactions may be less regulated or subject to a separate regulatory regime. Before you undertake such transactions, you should familiarize yourself with applicable rules and attendant risks."),
    ],
  },
  {
    h: T("沪港通及深港通风险披露声明", "滬港通及深港通風險披露聲明", "SHANGHAI-HONG KONG STOCK CONNECT AND SHENZHEN-HONG KONG STOCK CONNECT RISK DISCLOSURE STATEMENT"),
    p: [
      T("请客户阅读此风险披露声明、提出问题及征求独立的意见（如适宜）。此风险披露声明并未涵盖所有与透过沪港通及深港通进行证券交易有关的风险。客户确认明白并已评估涉及沪港通及深港通的风险（包括但不限载于此风险披露声明的风险），且客户同意接受该等风险。", "請客戶閱讀此風險披露聲明、提出問題及徵求獨立的意見（如適宜）。此風險披露聲明並未涵蓋所有與透過滬港通及深港通進行證券交易有關的風險。客戶確認明白並已評估涉及滬港通及深港通的風險（包括但不限載於此風險披露聲明的風險），且客戶同意接受該等風險。", "Client is invited to read this Risk Disclosure Statement, to ask questions and take independent advice if appropriate. This Risk Disclosure Statement is not exhaustive and does not purport to disclose all risks relating to trading in securities via the Shanghai-Hong Kong Stock Connect (“SSE-HK Connect”) and Shenzhen-Hong Kong Stock Connect (“SZSE-HK Connect”). The client acknowledges that the client understands and has assessed the risks relating to SSE-HK Connect and SZSE-HK Connect including but not limited to those set out in this Risk Disclosure Statement and the client agrees to accept those risks."),
      T("此风险披露声明可能不时被更改或补充，但HighBlock并不就此风险披露声明所载的资料是否最新、准确或完整而作出任何声明，也不承诺不时更新其内容。如欲了解更多资料，请参阅HighBlock、香港交易及结算所有限公司、香港证券及期货事务监察委员会（香港证监会）、中国证券监督管理委员、上海证券交易所（上交所）及深圳证券交易所（深交所）不时在其网站发布的资料。", "此風險披露聲明可能不時被更改或補充，但HighBlock並不就此風險披露聲明所載的資料是否最新、準確或完整而作出任何聲明，也不承諾不時更新其內容。如欲了解更多資料，請參閱HighBlock、香港交易及結算所有限公司、香港證券及期貨事務監察委員會（香港證監會）、中國證券監督管理委員、上海證券交易所（上交所）及深圳證券交易所（深交所）不時在其網站發佈的資料。", "This Risk Disclosure Statement may be amended or supplemented from time to time. However, HighBlock does not represent that the information set out in this Risk Disclosure Statement is up-to-date, accurate or complete, nor undertakes to update it from time to time. For further information, the client may refer to the information published from time to time on the websites of HighBlock, Hong Kong Exchanges and Clearing Limited, Securities and Futures Commission of Hong Kong (SFC), China Securities Regulatory Commission (CSRC), Shanghai Stock Exchange (SSE) and Shenzhen Stock Exchange (SZSE)."),
      T("透过沪港通及深港通买卖证券所涉及的一些主要风险如下：", "透過滬港通及深港通買賣證券所涉及的一些主要風險如下：", "Trading in securities via SSE-HK Connect and SZSE-HK Connect will be subject to some of the following key risks:"),
    ],
  },
  {
    h: T("1. 不受投资者赔偿基金保障", "1. 不受投資者賠償基金保障", "1. Not protected by Investor Compensation Fund"),
    p: [
      T("投资者须注意，香港的投资者赔偿基金并不涵盖透过沪港通或深港通进行的任何北向交易和南向交易。", "投資者須注意，香港的投資者賠償基金並不涵蓋透過滬港通或深港通進行的任何北向交易和南向交易。", "Investors should note that none of northbound or southbound trading under SSE-HK Connect or SZSE-HK Connect will be covered by Hong Kong’s Investor Compensation Fund."),
      T("香港的投资者赔偿基金主要保障任何因持牌中介人或认可财务机构因为违责事项，而导致任何国籍的投资者因涉及香港交易所上市或买卖的产品而蒙受的金钱损失。", "香港的投資者賠償基金主要保障任何因持牌中介人或認可財務機構因為違責事項，而導致任何國籍的投資者因涉及香港交易所上市或買賣的產品而蒙受的金錢損失。", "Hong Kong’s Investor Compensation Fund is established to pay compensation to investors of any nationality who suffer pecuniary losses as a result of default of a licensed intermediary or authorized financial institution in relation to exchange-traded products in Hong Kong."),
      T("就港股通南向交易而言，由于中国内地的证券商并非香港证监会的持牌人或注册机构，亦不受到证监会的规管，因此投资者赔偿基金将不涵盖透过沪港通或深港通进行的港股通南向交易。", "就港股通南向交易而言，由於中國內地的證券商並非香港證監會的持牌人或註冊機構，亦不受到證監會的規管，因此投資者賠償基金將不涵蓋透過滬港通或深港通進行的港股通南向交易。", "As far as southbound trading is concerned, since Mainland China securities brokers are neither licensees nor registered institutions with the SFC and they are not regulated by the SFC, the Investor Compensation Fund will not cover southbound trading via SSE-HK Connect or SZSE-HK Connect."),
      T("就沪港通或深港通北向交易而言，根据《证券及期货条例》，投资者赔偿基金仅涵盖在认可股票市场即香港联合交易所有限公司（联交所）及认可期货市场香港期货交易所有限公司（期交所）上买卖的产品。由于沪港通或深港通北向交易违责事项并不涉及联交所和期交所上市或买卖的产品，因此一如买卖海外证券的投资者，投资者赔偿基金亦不涵盖沪港通或深港通北向交易。", "就滬港通或深港通北向交易而言，根據《證券及期貨條例》，投資者賠償基金僅涵蓋在認可股票市場即香港聯合交易所有限公司（聯交所）及認可期貨市場香港期貨交易所有限公司（期交所）上買賣的產品。由於滬港通或深港通北向交易違責事項並不涉及聯交所和期交所上市或買賣的產品，因此一如買賣海外證券的投資者，投資者賠償基金亦不涵蓋滬港通或深港通北向交易。", "As for northbound trading, according to the Securities and Futures Ordinance, the Investor Compensation Fund will only cover products traded in Hong Kong’s recognized securities market (The Stock Exchange of Hong Kong Limited, SEHK) and recognized futures market (Hong Kong Futures Exchange Limited, HKFE). Since default matters in northbound trading via SSE-HK Connect or SZSE-HK Connect do not involve products listed or traded in SEHK or HKFE, so similar to the case of investors trading overseas securities, they will not be covered by the Investor Compensation Fund."),
      T("另一方面，根据《证券投资者保护基金管理办法》，中国投资者保护基金的用途为证券公司被撤销、关闭和破产或被证监会实施行政接管、托管经营等强制性监管措施时，按照国家有关政策规定对债权人予以「偿付」或「国务院批准的其他用途」。对于参与北向交易的香港投资者而言，由于他们是通过香港本地券商进行北向交易，该券商并非内地证券公司，因此中国内地投资者保护基金亦不涵盖沪港通或深港通北向交易。", "另一方面，根據《證券投資者保護基金管理辦法》，中國投資者保護基金的用途為證券公司被撤銷、關閉和破產或被證監會實施行政接管、托管經營等強制性監管措施時，按照國家有關政策規定對債權人予以「償付」或「國務院批准的其他用途」。對於參與北向交易的香港投資者而言，由於他們是通過香港本地券商進行北向交易，該券商並非內地證券公司，因此中國內地投資者保護基金亦不涵蓋滬港通或深港通北向交易。", "On the other hand, according to the Measures for the Administration of Securities Investor Protection Fund, the functions of China Securities Investor Protection Fund (CSIPF) include “indemnifying creditors as required by China’s relevant policies in case a securities company is subjected to compulsory regulatory measures including dissolution, closure, bankruptcy and administrative takeover by the CSRC and custodian operation” or “other functions approved by the State Council”. As far as Hong Kong investors participating in northbound trading are concerned, since they are carrying out northbound trading through securities brokers in Hong Kong and these brokers are not Mainland China brokers, therefore they are not protected by CSIPF on the Mainland China."),
    ],
  },
  {
    h: T("2. 额度用尽", "2. 額度用盡", "2. Quotas used up"),
    p: [
      T("当沪港通/深港通的北向每日额度用完时，即每日额度余额在连续竞价时段（或深交所的收盘集合竞价时段）跌至零或交易已超过余额，当日余下时间就不会再接受买盘订单，但卖盘订单则可以继续。下一个交易日会恢复接受买盘订单。至于已获接受的买盘订单不会因每日额度用尽受影响，除非相关经纪取消订单，否则将维持在上交所/深交所的订单纪录内。", "當滬港通/深港通的北向每日額度用完時，即每日額度餘額在連續競價時段（或深交所的收盤集合競價時段）跌至零或交易已超過餘額，當日餘下時間就不會再接受買盤訂單，但賣盤訂單則可以繼續。下一個交易日會恢復接受買盤訂單。至於已獲接受的買盤訂單不會因每日額度用盡受影響，除非相關經紀取消訂單，否則將維持在上交所/深交所的訂單紀錄內。", "If the northbound daily quota of SSE-HK Connect/SZSE-HK Connect is used up, i.e. the daily quota balance of SSE-HK Connect/SZSE-HK Connect drops to zero or the daily quota is exceeded during a continuous auction session (or closing call auction for SZSE), no further buy orders will be accepted for the remainder of the day while sell orders will still be accepted. Buying services will be resumed on the next trading day. Buy orders already accepted will not be affected by the daily quota being used up and will remain on the order book of SSE or SZSE unless otherwise canceled by the relevant brokers."),
      T("若果北向每日额度于开市集合竞价时段用尽，新的买盘将被驳回。不过，由于取消订单在开市集合竞价时段很普遍，北向每日额度余额或可于开市集合竞价时段完结前已快速回复正数水平。届时，联交所于当日将再次接受北向买盘订单。", "若果北向每日額度於開市集合競價時段用盡，新的買盤將被駁回。不過，由於取消訂單在開市集合競價時段很普遍，北向每日額度餘額或可於開市集合競價時段完結前已快速回復正數水平。屆時，聯交所於當日將再次接受北向買盤訂單。", "If the used up of northbound daily quota happens during the opening call auction session, new buy orders will be rejected. However, as order cancellation is common during opening call auction, the northbound daily quota balance may resume to a positive level before the end of the opening call auction. When that happens, SEHK will again accept northbound buy orders."),
    ],
  },
  {
    h: T("3. 交易日及时间差异", "3. 交易日及時間差異", "3. Trading day and trading hours"),
    p: [
      T("由于沪港通及深港通只有在内地与香港两地市场均为交易日、而且内地与香港两地市场的银行在相应的款项交收日均开放服务时才会开放，所以有可能出现内地市场为正常交易日、而香港投资者却不能买卖证券的情况。投资者应该注意沪港通及深港通的开放日期，并因应自身的风险承受能力决定是否在沪港通或深港通暂停期间承担证券价格波动的风险。", "由於滬港通及深港通只有在內地與香港兩地市場均為交易日、而且內地與香港兩地市場的銀行在相應的款項交收日均開放服務時才會開放，所以有可能出現內地市場為正常交易日、而香港投資者卻不能買賣證券的情況。投資者應該注意滬港通及深港通的開放日期，並因應自身的風險承受能力決定是否在滬港通或深港通暫停期間承擔證券價格波動的風險。", "SSE-HK Connect and SZSE-HK Connect will only operate on days when both Mainland China and Hong Kong markets are open for trading and when banking services in both Mainland China and Hong Kong markets are available on the corresponding settlement days. So it is possible that there are occasions when it is a normal trading day for the Mainland China market but Hong Kong investors cannot carry out any securities trading. Investors should take note of the days SSE-HK Connect and SZSE-HK Connect are open for business and decide according to their own risk tolerance capability whether or not to take on the risk of price fluctuations in securities during the time when SSE-HK Connect or SZSE-HK Connect is closed."),
      T("另外，内地与香港股市的交易时间并不一样，透过沪港通/深港通买卖 A 股的时间，会与买卖港股不同，投资者需要留意有关差异。", "另外，內地與香港股市的交易時間並不一樣，透過滬港通/深港通買賣 A 股的時間，會與買賣港股不同，投資者需要留意有關差異。", "In addition, there is difference in trading hours between Mainland China and Hong Kong markets. Trading hours for A-shares under SSE-HK Connect and SZSE-HK Connect are different from Hong Kong and investors shall beware of such difference."),
    ],
  },
  {
    h: T("4. 前端监控对沽出的限制", "4. 前端監控對沽出的限制", "4. Restrictions on selling imposed by front-end monitoring"),
    p: [
      T("对于那些将证券存放于券商以外的投资者而言，如果需要沽出所持有的某些证券，必须在不晚于沽出当天（T 日）开市前成功把该证券转至券商帐户中。如果投资者错过了此期限，他/她将不能于 T 日沽出该证券。", "對於那些將證券存放於券商以外的投資者而言，如果需要沽出所持有的某些證券，必須在不晚於沽出當天（T 日）開市前成功把該證券轉至券商帳戶中。如果投資者錯過了此期限，他/她將不能於 T 日沽出該證券。", "For investors who keep their securities outside of their brokers, if they want to sell certain securities they hold, they must transfer those securities to the respective accounts of their brokers before the market opens on the day of selling (T day). If they fail to meet this deadline, they will not be able to sell those securities on T day."),
    ],
  },
  {
    h: T("5. 合资格股票的调出", "5. 合資格股票的調出", "5. The recalling of eligible stocks"),
    p: [
      T("当一些原本为合资格股票被调出沪港通或深港通范围时，该股票只能被卖出而不能被买入。这对投资者的投资组合或策略可能会有影响。投资者需要密切关注上交所、深交所及联交所提供及不时更新的合资格股票名单。", "當一些原本為合資格股票被調出滬港通或深港通範圍時，該股票只能被賣出而不能被買入。這對投資者的投資組合或策略可能會有影響。投資者需要密切關注上交所、深交所及聯交所提供及不時更新的合資格股票名單。", "When a stock is recalled from the scope of eligible stocks for trading via SSE-HK Connect or SZSE-HK Connect, the stock can only be sold but restricted from being bought. This may affect the investment portfolio or strategies of investors. Investors should therefore pay close attention to the list of eligible stocks as provided and renewed from time to time by SSE, SZSE and SEHK."),
    ],
  },
  {
    h: T("6. 内地市场风险", "6. 內地市場風險", "6. Mainland China market risks"),
    p: [],
  },
  {
    h: T("6.1 市场波动风险", "6.1 市場波動風險", "6.1 Market volatility risk"),
    p: [
      T("内地股市以散户为主，炒风比较炽热，而且容易受到内地政府的政策和消息所影响，会比较波动。", "內地股市以散戶為主，炒風比較熾熱，而且容易受到內地政府的政策和消息所影響，會比較波動。", "The Mainland China stock market is relatively volatile as it is mostly made up of retail investors who tend to be speculative and susceptible to the central government policies and news."),
    ],
  },
  {
    h: T("6.2 宏观经济风险", "6.2 宏觀經濟風險", "6.2 Macro-economic risk"),
    p: [
      T("中国经济情况与股市表现息息相关，目前中国经济增长虽然仍高于全球平均水平，但增幅已经放缓。另外，市场亦关注内地政府和企业负债水平会否过高。", "中國經濟情況與股市表現息息相關，目前中國經濟增長雖然仍高於全球平均水平，但增幅已經放緩。另外，市場亦關注內地政府和企業負債水平會否過高。", "There is a close relationship between the Chinese economy and stock market performance. The Chinese economic growth is still above the global average, but has already shown signs of slowdown. Moreover, there is growing concern over the country's government and corporate debts."),
    ],
  },
  {
    h: T("6.3 人民币汇价波动风险", "6.3 人民幣匯價波動風險", "6.3 Currency Risk"),
    p: [
      T("本港投资者买卖沪深股票，如需要将港元兑换成人民币，便要承受人民币汇价变动的风险，而汇兑过程亦会有成本。", "本港投資者買賣滬深股票，如需要將港元兌換成人民幣，便要承受人民幣匯價變動的風險，而匯兌過程亦會有成本。", "Hong Kong investors will expose to the risk of RMB exchange rate movements if they have to convert HKD into RMB for trading in Shanghai and Shenzhen A-shares. The conversion also incurs costs."),
      T("人民币汇价变动会对内地上市公司的盈利和债务造成影响，尤其是对出口业和以外币作为债务计价的公司会有较显注的影响。", "人民幣匯價變動會對內地上市公司的盈利和債務造成影響，尤其是對出口業和以外幣作為債務計價的公司會有較顯注的影響。", "Movements in the RMB exchange rate will affect the profits and debts of the Mainland China listed companies. Such effects will be more significant to those export-oriented companies and companies having debts denominated in currencies other than RMB."),
    ],
  },
  {
    h: T("6.4 政策风险", "6.4 政策風險", "6.4 Policy Risk"),
    p: [
      T("中央政府的经济和金融政策往往会左右投资市场的表现。你需要留意中央政府刺激经济或发展不同行业的政策，亦要留意针对货币、利率、信贷和股票市场的金融政策。", "中央政府的經濟和金融政策往往會左右投資市場的表現。你需要留意中央政府刺激經濟或發展不同行業的政策，亦要留意針對貨幣、利率、信貸和股票市場的金融政策。", "Central government's economic and financial policies will affect the performance of investment market. Investors shall beware of the central government policies for stimulating the economy or supporting different industries, as well as their different financial policies in respect of the currency, interest rate, credit and stock markets."),
    ],
  },
  {
    h: T("7. 关于深交所创业板风险", "7. 關於深交所創業板風險", "7. Risks relating to ChiNext Board of SZSE"),
    p: [
      T("一般而言，相对于在主板上市的股票，于深交所创业板上市的股票有较高的风险。", "一般而言，相對於在主板上市的股票，於深交所創業板上市的股票有較高的風險。", "Generally, stocks listed on ChiNext Board of SZSE contain higher risk than those listed on Main Board."),
    ],
  },
  {
    h: T("7.1 规管差异风险", "7.1 規管差異風險", "7.1 Regulatory Risks"),
    p: [
      T("深交所创业板市场与深交所主板和中小板市场在上市、交易、信息披露以及其他事项的规则和指引方面都存在较大差异。例如，就上市条件而言，寻求在创业板市场上市的公司将适用更短的盈利历史、更低的净利润和营业收入，以及更低的经营活动产生的现金流量要求。创业板上市公司较之主板和中小板公司对于股本总额的要求也更低。关于深交所创业板、主板、中小板的上市条件详情，请参阅深交所网站。", "深交所創業板市場與深交所主板和中小板市場在上市、交易、信息披露以及其他事項的規則和指引方面都存在較大差異。例如，就上市條件而言，尋求在創業板市場上市的公司將適用更短的盈利歷史、更低的淨利潤和營業收入，以及更低的經營活動產生的現金流量要求。創業板上市公司較之主板和中小板公司對於股本總額的要求也更低。關於深交所創業板、主板、中小板的上市條件詳情，請參閱深交所網站。", "The rules and guidance on listing, trading, disclosure and other matters of SZSE ChiNext vary much from those of the SZSE main board and SME board. For example, on the listing requirements, a shorter track record period and lower net profit, revenue and operating cash flow requirements will apply for company seeking IPO and listing on the ChiNext market. ChiNext companies may also have a lower post-IPO total share capital than main board and SME board companies. For details of the listing requirements on the ChiNext market, the SZSE main board and SME board, please visit SZSE website."),
      T("另外，创业板市场采用与主板和中小板市场较为不同的信息披露规则。例如，创业板上市公司的临时报告仅要求在证监会指定网站和公司网站上披露。如果投资者继续采用与主板市场和中小板市场相似的信息查询方法，可能无法及时了解到公司正在发生的重大变动。因此，建议投资者密切关注创业板上市公司的公告及风险警示，了解市场风险，并在交易创业板股票时遵守相关法律法规。", "另外，創業板市場採用與主板和中小板市場較為不同的信息披露規則。例如，創業板上市公司的臨時報告僅要求在證監會指定網站和公司網站上披露。如果投資者繼續採用與主板市場和中小板市場相似的信息查詢方法，可能無法及時了解到公司正在發生的重大變動。因此，建議投資者密切關注創業板上市公司的公告及風險警示，了解市場風險，並在交易創業板股票時遵守相關法律法規。", "Besides, ChiNext market adopts disclosure rules that substantially vary from those of the main board and SME board. For example, ad hoc reports of ChiNext companies are only required to be published on a CSRC designated website and on the issuers’ websites. If investors continue to check information through the usual disclosure channels for main board and SME boards, they may miss out some important information disclosed by ChiNext companies. Therefore, investors are advised to closely monitor announcements and risk alerts of ChiNext companies, be aware of market risks, and comply with relevant rules and regulations while trading in the ChiNext market."),
    ],
  },
  {
    h: T("7.2 退市风险", "7.2 退市風險", "7.2 Delisting risks"),
    p: [
      T("创业板市场上市公司退市标准与深交所主板市场和中小板市场不同，可能导致创业板市场上市公司退市的情形更多。创业板市场上市公司面临更大的退市风险，且退市速度可能更快。", "創業板市場上市公司退市標準與深交所主板市場和中小板市場不同，可能導致創業板市場上市公司退市的情形更多。創業板市場上市公司面臨更大的退市風險，且退市速度可能更快。", "The delisting standards of the ChiNext market are different from those of the SZSE main board and SME board. There are more situations that will lead to the delisting of ChiNext companies. ChiNext companies have greater exposure to the risk of being delisted, and such delisting process may be speed-ed up."),
      T("另外，创业板市场上市公司股票可能在深交所决定终止其上市后直接退市。投资者将无法交易已退市公司的股份，在此情况下将可能损失全部本金。", "另外，創業板市場上市公司股票可能在深交所決定終止其上市後直接退市。投資者將無法交易已退市公司的股份，在此情況下將可能損失全部本金。", "In addition, the shares of ChiNext companies may be delisted immediately after SZSE determines its delisting. Investors will not be able to trade in delisted shares, and may lose all the invested capital in this case."),
    ],
  },
  {
    h: T("7.3 公司经营风险", "7.3 公司經營風險", "7.3 Operating risks"),
    p: [
      T("创业板市场上市公司一般处于发展初期，经营历史较短，规模较小，经营稳定性较低，抵抗市场风险和行业风险的能力较弱。尽管它们可能拥有更大的发展潜力并可更多地借助于科技创新，其未来表现（尤其是那些尚未有良好盈利记录的公司）存在很大的不确定性。", "創業板市場上市公司一般處於發展初期，經營歷史較短，規模較小，經營穩定性較低，抵抗市場風險和行業風險的能力較弱。儘管它們可能擁有更大的發展潛力並可更多地借助於科技創新，其未來表現（尤其是那些尚未有良好盈利記錄的公司）存在很大的不確定性。", "ChiNext companies are generally in an early stage of development and have a shorter history. They are usually smaller in scale, have less stable operations, and are less resilient against market risks and industry risks. Although they may have higher growth potential and leverage more on technical innovations, their future performance particularly those without a profit track record is susceptible to great uncertainty."),
    ],
  },
  {
    h: T("7.4 大幅股价波动", "7.4 大幅股價波動", "7.4 High Share Price Volatility"),
    p: [
      T("创业板市场上市公司股价可能随市况变化、投资者投机行为或公司业绩变动等情况而频繁发生大幅波动。流通股本较少的创业板市场上市公司可能较容易被主要股东操纵股价。不稳定的公司业绩亦令此类公司的估值较为困难。", "創業板市場上市公司股價可能隨市況變化、投資者投機行為或公司業績變動等情況而頻繁發生大幅波動。流通股本較少的創業板市場上市公司可能較容易被主要股東操縱股價。不穩定的公司業績亦令此類公司的估值較為困難。", "The share prices of ChiNext companies may fluctuate largely and frequently due to changing market conditions, investor speculations, inconsistent financial results, etc. ChiNext companies with low public float may be vulnerable to manipulations by major shareholders. The unstable financial result also adds the difficulty to the company valuations."),
    ],
  },
  {
    h: T("7.5 公司技术风险", "7.5 公司技術風險", "7.5 Technical Risks"),
    p: [
      T("在深交所创业板上市的公司主要为高科技公司，技术创新是这些公司能否成功的关键。然而，这些公司亦面对种种与技术创新有关的风险和挑战，例如研发成本高昂、研发失败，以及技术和产品市场更迭频繁等等。", "在深交所創業板上市的公司主要為高科技公司，技術創新是這些公司能否成功的關鍵。然而，這些公司亦面對種種與技術創新有關的風險和挑戰，例如研發成本高昂、研發失敗，以及技術和產品市場更迭頻繁等等。", "Companies listed on ChiNext Board are mainly high technology companies, whose success is subject to technical innovations. However, these companies are exposed to the risks and challenges relating to technical innovation, such as high R&D costs, technical failure, and rapid development and replacement in technology and product market."),
    ],
  },
  {
    h: T("7.6 估值相关风险", "7.6 估值相關風險", "7.6 Risks relating to Valuation"),
    p: [
      T("创业板公司通常较难估计其价值，因为它们一般是处于成长早期的初创企业，经营时间较短、盈利和现金流等表现亦较不稳定，较难用一些传统的方法例如市盈率和市帐率等衡量其价值。", "創業板公司通常較難估計其價值，因為它們一般是處於成長早期的初創企業，經營時間較短、盈利和現金流等表現亦較不穩定，較難用一些傳統的方法例如市盈率和市帳率等衡量其價值。", "Generally, it is difficult to estimate the value of a company listed on ChiNext Board as they are in the early stage of development with short operating history and unstable profits and cash flow. Therefore, traditional valuation method, such as price-to-earnings ratio and price-to-book ratio, is difficult to be applied."),
    ],
  },
  {
    h: T("8. 关于上交所科创板市场风险", "8. 關於上交所科創板市場風險", "8. Risks relating to Sci-Tech Innovation Board (STAR Market) of SSE"),
    p: [
      T("一般而言，相对于在主板上市的股票，于上交所科创板上市的股票有较高的风险。", "一般而言，相對於在主板上市的股票，於上交所科創板上市的股票有較高的風險。", "Generally, stocks listed on STAR Market of SSE contain higher risk than those listed on Main Board."),
    ],
  },
  {
    h: T("8.1 规管差异风险", "8.1 規管差異風險", "8.1 Regulatory Risks"),
    p: [
      T("上交所科创板市场与上交所主板市场在上市、交易、信息披露以及其他事项的规则和指引方面都存在较大差异。例如，就上市条件而言，寻求在科创板市场上市的公司将适用更短的盈利历史、更低的净利润和营业收入，以及更低的经营活动产生的现金流量要求。科创板上市公司较之主板和中小板公司对于股本总额的要求也更低。科创板上市公司的交易安排亦与主板上市公司不同，例如价格限制、最小买卖盘和最大买卖盘。关于上交所科创板与主板的上市条件详情，请参阅上交所网站。", "上交所科創板市場與上交所主板市場在上市、交易、信息披露以及其他事項的規則和指引方面都存在較大差異。例如，就上市條件而言，尋求在科創板市場上市的公司將適用更短的盈利歷史、更低的淨利潤和營業收入，以及更低的經營活動產生的現金流量要求。科創板上市公司較之主板和中小板公司對於股本總額的要求也更低。科創板上市公司的交易安排亦與主板上市公司不同，例如價格限制、最小買賣盤和最大買賣盤。關於上交所科創板與主板的上市條件詳情，請參閱上交所網站。", "The rules and guidance on listing, trading, disclosure and other matters of SSE STAR vary much from those of the SSE main board. For example, on the listing requirements, lower net profit and revenue requirements will apply for company seeking IPO and listing on the STAR market. Different trading arrangements will apply for the trading of STAR companies, such as daily price limit, minimum order size and maximum order size. For details of the listing requirements and the trading arrangements of the STAR market and the SSE main board, please visit SSE website."),
    ],
  },
  {
    h: T("8.2 退市风险", "8.2 退市風險", "8.2 Delisting risks"),
    p: [
      T("科创板退市制度较主板更为严格，可能导致科创板市场上市公司退市的情形更多，退市速度更快。", "科創板退市制度較主板更為嚴格，可能導致科創板市場上市公司退市的情形更多，退市速度更快。", "The delisting standards of the STAR market are different from those of the SSE main board. There are more situations that will lead to the delisting of STAR companies. STAR companies have greater exposure to the risk of being delisted, and such delisting process may be speed-ed up."),
    ],
  },
  {
    h: T("8.3 公司经营风险", "8.3 公司經營風險", "8.3 Operating risks"),
    p: [
      T("科创板市场上市公司一般处于发展初期，经营历史较短，规模较小，经营稳定性较低，抵抗市场风险和行业风险的能力较弱。尽管它们可能拥有更大的发展潜力并可更多地借助于科技创新，其未来表现（尤其是那些尚未有良好盈利记录的公司）存在很大的不确定性。", "科創板市場上市公司一般處於發展初期，經營歷史較短，規模較小，經營穩定性較低，抵抗市場風險和行業風險的能力較弱。儘管它們可能擁有更大的發展潛力並可更多地借助於科技創新，其未來表現（尤其是那些尚未有良好盈利記錄的公司）存在很大的不確定性。", "STAR companies are generally in an early stage of development and have a shorter history. They are usually smaller in scale, have less stable operations, and are less resilient against market risks and industry risks. Although they may have higher growth potential and leverage more on technical innovations, their future performance particularly those without a profit track record is susceptible to great uncertainty."),
    ],
  },
  {
    h: T("8.4 大幅股价波动", "8.4 大幅股價波動", "8.4 High Share Price Volatility"),
    p: [
      T("科创板市场上市公司股价可能随市况变化、投资者投机行为或公司业绩变动等情况而频繁发生大幅波动。流通股本较少的科创板市场上市公司可能较容易被主要股东操纵股价。不稳定的公司业绩亦令此类公司的估值较为困难。", "科創板市場上市公司股價可能隨市況變化、投資者投機行為或公司業績變動等情況而頻繁發生大幅波動。流通股本較少的科創板市場上市公司可能較容易被主要股東操縱股價。不穩定的公司業績亦令此類公司的估值較為困難。", "The share prices of STAR companies may fluctuate largely and frequently due to changing market conditions, investor speculations, inconsistent financial results, etc. The unstable financial result also adds the difficulty to the company valuations."),
    ],
  },
  {
    h: T("8.5 技术风险", "8.5 技術風險", "8.5 Technical Risks"),
    p: [
      T("科创板市场上市公司的新技术能否转化为现实中的产品或服务具有不确定性。当其所在的行业正经历快速的技术更新换代时，其产品可能面临被淘汰的危险而令其公司难以为继。", "科創板市場上市公司的新技術能否轉化為現實中的產品或服務具有不確定性。當其所在的行業正經歷快速的技術更新換代時，其產品可能面臨被淘汰的危險而令其公司難以為繼。", "There is higher degree of uncertainty whether a STAR company is able to convert its technical innovations into physical products or services. When the industry is experiencing rapid technological development and replacement, its product may be obsolete and may not survive in the market."),
    ],
  },
  {
    h: T("复杂产品警告声明", "複雜產品警告聲明", "WARNING STATEMENTS ON COMPLEX PRODUCTS"),
    p: [
      T("「复杂产品」是指由于结构复杂，致令其条款、特点及风险在合理情况下不大可能会被零售投资者理解的投资产品。", "「複雜產品」是指由於結構複雜，致令其條款、特點及風險在合理情況下不大可能會被零售投資者理解的投資產品。", "“Complex product” refers to an investment product whose terms, features and risks are not reasonably likely to be understood by a retail investor because of its complex structure."),
      T("1. 投资者应就复杂产品审慎行事。", "1. 投資者應就複雜產品審慎行事。", "1. Investors should exercise caution in relation to complex products."),
      T("2. 投资者可能会损失全部投资金额或会蒙受大于投资金额的损失（如适用）。", "2. 投資者可能會損失全部投資金額或會蒙受大於投資金額的損失（如適用）。", "2. Investors may lose the entire invested amount or more than the invested amount (if applicable)."),
      T("3. 就发行人提供未经香港证监会审阅的要约文件或资料的复杂产品而言，投资者应就该要约审慎行事。", "3. 就發行人提供未經香港證監會審閱的要約文件或資料的複雜產品而言，投資者應就該要約審慎行事。", "3. For complex products for which the offering documents or information provided by the issuer have not been reviewed by the Hong Kong Securities and Futures Commission (SFC), investors are advised to exercise caution in relation to the offer."),
      T("4. 就被形容为已获香港证监会认可的复杂产品而言，该认可不表示获得官方推介，及香港证监会认可不等如对该产品作出推介或认许，亦不是对该产品的商业利弊或表现作出保证。", "4. 就被形容為已獲香港證監會認可的複雜產品而言，該認可不表示獲得官方推介，及香港證監會認可不等如對該產品作出推介或認許，亦不是對該產品的商業利弊或表現作出保證。", "4. For complex products described as having been authorized by the SFC, SFC authorization does not imply official recommendation and such authorization is not a recommendation or endorsement of a product nor does it guarantee the commercial merits of a product or its performance."),
      T("5. 如获提供过往业绩资料，往绩并非预测日后业绩表现的指标。", "5. 如獲提供過往業績資料，往績並非預測日後業績表現的指標。", "5. Where past performance information is provided, past performance is not indicative of future performance."),
      T("6. 一些复杂产品仅供专业投资者买卖。", "6. 一些複雜產品僅供專業投資者買賣。", "6. Some complex products are only available to professional investors."),
      T("7. 在作出任何投资决定前投资者应阅读要约文件及其他相关资料，以了解有关复杂产品的主要性质、特点和风险，亦应先寻求独立专业意见，并且应有足够的净资产来承担因买卖该产品而可能招致的风险和损失。", "7. 在作出任何投資決定前投資者應閱讀要約文件及其他相關資料，以了解有關複雜產品的主要性質、特點和風險，亦應先尋求獨立專業意見，並且應有足夠的淨資產來承擔因買賣該產品而可能招致的風險和損失。", "7. Investors should read the offering documents and other relevant materials to understand the key nature, features and risks of a complex product and are advised to seek independent professional advice before making any investment decision and should have sufficient net worth to be able to assume the risks and bear the potential losses of trading the product."),
    ],
  },
  {
    h: T("", "", ""),
    p: [
      T("（如中、英文版本有任何歧义，概以英文版本为准。）", "（如中、英文版本有任何歧義，概以英文版本為準。）", "(In case of any discrepancy between the English and the Chinese versions, the English version shall prevail.)"),
      T("HighBlock Securities Limited 凭藉《证券及期货条例》获许进行第 1 类（证券交易），第 4 类（就证券提供意见）及第 9 类（资产管理）受规管活动（中央编号 BWW124）。", "HighBlock Securities Limited 憑藉《證券及期貨條例》獲許進行第 1 類（證券交易），第 4 類（就證券提供意見）及第 9 類（資產管理）受規管活動（中央編號 BWW124）。", "HighBlock Securities Limited is licensed to conduct Type 1 (dealing in securities), Type 4 (advising on securities) and Type 9 (asset management) regulated activities under the Securities and Futures Ordinance (CE No. BWW124)."),
    ],
  },
];

/* ===== 隐私声明与个人资料收集声明 Privacy Statement and PICS ===== */
export const privacyPolicySections = [
  {
    h: T("隐私声明与个人资料收集声明（合称「隐私政策」）", "隱私聲明與個人資料收集聲明（合稱「隱私政策」）", "PRIVACY STATEMENT and PERSONAL INFORMATION COLLECTION STATEMENT (Collectively the “Privacy Policy”)"),
    p: [
      T("本隐私政策阐述了我们如何收集、使用、处理、披露、共用、转移和保护个人资料。本隐私政策中使用的术语和定义具有《HighBlock Securities Limited服务协定条款》中的相同含义，但本隐私政策中另有规定的除外。我们向使用者请求提供某些个人资料是因为适用法律或法规要求我们收集该等资料，或者其与我们的特定目的相关。提供您的个人资料是自愿的，如果未获得该等个人资料，我们可能无法向您提供服务和接受和/或处理您的投资。", "本隱私政策闡述了我們如何收集、使用、處理、披露、共用、轉移和保護個人資料。本隱私政策中使用的術語和定義具有《HighBlock Securities Limited服務協定條款》中的相同含義，但本隱私政策中另有規定的除外。我們向使用者請求提供某些個人資料是因為適用法律或法規要求我們收集該等資料，或者其與我們的特定目的相關。提供您的個人資料是自願的，如果未獲得該等個人資料，我們可能無法向您提供服務和接受和/或處理您的投資。", "This Privacy Policy explains how we collect, use, process, disclose, share, transfer, and protect personal data. The terms and definitions used in this Privacy Policy shall have the same meanings as in the Terms of Service Agreement of HighBlock Securities Limited, except as otherwise provided herein. When we ask for certain personal data from users, it is because we are required by applicable laws or regulations to collect such data, or it is relevant to our specified purposes. The provision of your personal data is voluntary. If such personal data is not obtained, we may not be able to provide you the services and accept and/or process your investment."),
      T("我们充分理解和尊重您个人资料的重要性，我们应当根据适用法律和法规的规定采取相应的安全保护措施，保护您的个人资料。我们致力于按照《个人资料（私隐）条例》（香港法例第486章）（「私隐条例」）的要求保护我们持有之个人资讯的隐私、机密和安全。我们同样致力于确保我们的所有雇员和代理人履行该等义务。本隐私政策适用于我们提供的所有服务。如果本隐私政策与具体适用于我们向您提供的任何产品或服务的其他政策存在任何不一致的，应当以该等政策为准；在其他情形下，以本隐私政策为准。", "我們充分理解和尊重您個人資料的重要性，我們應當根據適用法律和法規的規定採取相應的安全保護措施，保護您的個人資料。我們致力於按照《個人資料（私隱）條例》（香港法例第486章）（「私隱條例」）的要求保護我們持有之個人資訊的隱私、機密和安全。我們同樣致力於確保我們的所有僱員和代理人履行該等義務。本隱私政策適用於我們提供的所有服務。如果本隱私政策與具體適用於我們向您提供的任何產品或服務的其他政策存在任何不一致的，應當以該等政策為準；在其他情形下，以本隱私政策為準。", "We fully understand and respect the importance of your personal data, and we shall adopt corresponding safety protection measures to protect your personal data in accordance with the applicable laws and regulations. We are committed to protecting the privacy, confidentiality, and security of the personal information we hold by complying with the requirements of the Personal Data (Privacy Ordinance) (Cap. 486 of the Laws of Hong Kong) (“PDPO”). We are equally committed to ensuring that all our employees and agents uphold these obligations. This Privacy Policy applies to all services we provide. To the extent of any inconsistencies between this Privacy Policy and another policy that is specifically applicable to any products or services we provide to you, such policy shall prevail; otherwise, this Privacy Policy shall prevail."),
      T("在使用我们的服务之前，请确保您已仔细阅读并完全理解本隐私政策。通过使用我们的服务，您同意我们的隐私政策。如果您不同意本隐私政策中的任何条款或条件，您应当立即停止使用我们的服务。如果您对本隐私政策有任何问题、评论或者建议的，您可联系我们的保障资料主任。", "在使用我們的服務之前，請確保您已仔細閱讀並完全理解本隱私政策。通過使用我們的服務，您同意我們的隱私政策。如果您不同意本隱私政策中的任何條款或條件，您應當立即停止使用我們的服務。如果您對本隱私政策有任何問題、評論或者建議的，您可聯繫我們的保障資料主任。", "Before using our services, please make sure that you have read carefully and understood this Privacy Policy in full. By using our services, you consent to our Privacy Policy. If you do not agree to any term or condition within this Privacy Policy, you should immediately stop using our services. If you have any questions, comments, or suggestions in connection with this Privacy Policy, you may contact our Data Protection Officer."),
    ],
  },
  {
    h: T("第1条 个人资料。", "第1條 個人資料。", "Section 1 Personal Data."),
    p: [
      T("如果您是HighBlock Securities Limited的服务使用者，我们可能收集的资料（「客户个人资料」）包括但不限于您的：", "如果您是HighBlock Securities Limited的服務使用者，我們可能收集的資料（「客戶個人資料」）包括但不限於您的：", "If you are a user of the services of HighBlock Securities Limited, the data (“Customer Personal Data”) which we may collect includes, without limitation, your:"),
      T("法定全名（包括曾用名和中英文姓名，如适用）；性别；出生日期；国籍；居住地国家；联系电话；电子邮件地址；居住地址；护照号码；其他身份证明文件；税收居住国；税号；", "法定全名（包括曾用名和中英文姓名，如適用）；性別；出生日期；國籍；居住地國家；聯繫電話；電子郵件地址；居住地址；護照號碼；其他身份證明文件；稅收居住國；稅號；", "Full legal name (including former name, and names in English and Chinese, if applicable); gender; date of birth; nationality; country of residence; contact number; e-mail address; residential address; passport number; other identity documentation; country of tax residence; Tax ID;"),
      T("身份证明、面部识别资料；", "身份證明、面部識別資料；", "Proof of identity, facial recognition data;"),
      T("居住证明；", "居住證明；", "Proof of residence;"),
      T("就业资讯（包括您职业的详细资讯，例如，雇主名称、业务性质、职位、工作年限和办公室联系资讯）；", "就業資訊（包括您職業的詳細資訊，例如，雇主名稱、業務性質、職位、工作年限和辦公室聯繫資訊）；", "Employment information (including details of your occupation, such as the name of your employer, the nature of business, your job title, years of employment, and office contact details);"),
      T("财务资讯；", "財務資訊；", "Financial information;"),
      T("交易资讯，例如，您与我们的历史交易记录；以及", "交易資訊，例如，您與我們的歷史交易記錄；以及", "Transaction information, such as the details of your historic transactions with us; and"),
      T("资金和/或财务来源证明", "資金和/或財務來源證明", "Proof of source of funds and/or wealth"),
    ],
  },
  {
    h: T("第2条 收集、使用和披露客户个人资料。", "第2條 收集、使用和披露客戶個人資料。", "Section 2 Collection, Use and Disclosure of Customer Personal Data."),
    p: [
      T("在(i)向您（或者您的授权代表）告知收集资料的目的；以及(ii)您（或者您的授权代表）已书面同意为该等目的收集和使用客户个人资料后，我们通常在您向我们办理注册申请的过程中收集客户个人资料，或者收集与您向我们办理注册申请相关的客户个人资料，或者通过您的授权签字人或授权交易商向我们披露您的客户个人资料（合称为「授权代表」）。您同意，您或者您的授权代表是在知情的情况下向我们提供客户个人资料。我们应当在收集任何额外的客户个人资料以及将您的客户个人资料用于未向您告知的目的之前征求您的同意（但法律允许或授权的除外）。", "在(i)向您（或者您的授權代表）告知收集資料的目的；以及(ii)您（或者您的授權代表）已書面同意為該等目的收集和使用客戶個人資料後，我們通常在您向我們辦理註冊申請的過程中收集客戶個人資料，或者收集與您向我們辦理註冊申請相關的客戶個人資料，或者通過您的授權簽字人或授權交易商向我們披露您的客戶個人資料（合稱為「授權代表」）。您同意，您或者您的授權代表是在知情的情況下向我們提供客戶個人資料。我們應當在收集任何額外的客戶個人資料以及將您的客戶個人資料用於未向您告知的目的之前徵求您的同意（但法律允許或授權的除外）。", "We generally collect Customer Personal Data in the course of or in connection with your registration application with us, or via an Authorized Signatory or Authorized Trader of you to disclose your Customer Personal Data to us (collectively refers to “Authorized Representative”), after (i) you (or your Authorized Representative) have been notified of the purpose for which the data is collected, and (ii) you (or your Authorized Representative) has provided written consent to the collection and usage of Customer Personal Data for those purposes. You agree that any provision of Customer Personal Data to us is done knowingly and on an informed basis by you or your Authorized Representative. We shall seek your consent before collecting any additional Customer Personal Data and before using your Customer Personal Data for a purpose which has not been notified to you (except where permitted or authorised by law)."),
      T("我们将为以下目的收集和使用客户个人资料，并且，我们可能会在必要的情况下为以下目的向我们的关联方、集团公司、顾问、向我们提供产品和/或服务的主体（包括但不限于资讯技术系统提供商、了解您的客户和反洗钱合规服务提供者）、政府机构、监管部门和关联公司披露收集的客户个人资料：", "我們將為以下目的收集和使用客戶個人資料，並且，我們可能會在必要的情況下為以下目的向我們的關聯方、集團公司、顧問、向我們提供產品和/或服務的主體（包括但不限於資訊技術系統提供商、瞭解您的客戶和反洗錢合規服務提供者）、政府機構、監管部門和關聯公司披露收集的客戶個人資料：", "Customer Personal Data will be collected and used by us for the following purpose and we may disclose the collected Customer Personal Data to our affiliates, group companies, advisers, parties providing products and/or services to us (including, without limitation, information technology systems suppliers, Know-Your-Client and Anti-Money Laundering compliance service providers), government agencies, regulatory authorities and related companies where necessary for the following purposes:"),
      T("确保法律和监管合规；例如，遵守各个司法管辖区域的反洗钱和恐怖主义融资法律（您理解，我们可能会出于了解您的客户和反洗钱目的而向我们的关联方和集团公司共用您的客户个人资料，并且，如果您选择使用我们的关联方或集团公司提供的服务，则您可能需要或者可能不需要提供额外的客户个人资料），相关的检查，包括确定您是否是《证券及期货条例》（及其不时的修订）项下的「专业投资者」；", "確保法律和監管合規；例如，遵守各個司法管轄區域的反洗錢和恐怖主義融資法律（您理解，我們可能會出於瞭解您的客戶和反洗錢目的而向我們的關聯方和集團公司共用您的客戶個人資料，並且，如果您選擇使用我們的關聯方或集團公司提供的服務，則您可能需要或者可能不需要提供額外的客戶個人資料），相關的檢查，包括確定您是否是《證券及期貨條例》（及其不時的修訂）項下的「專業投資者」；", "To maintain legal and regulatory compliance; for example, to comply with anti-money laundering and terrorist financing laws across jurisdictions (you understand that we may share your Customer Personal Data with our affiliates and group companies for know-your-client and anti-money laundering purposes, and should you choose to engage the services of our affiliates or group companies, you may or may not be required to provide additional Customer Personal Data), related checks including ascertaining whether you are a “professional investor” under the Securities and Futures Ordinance (as amended from time to time);"),
      T("维护投资者名册；", "維護投資者名冊；", "To maintain investor registers;"),
      T("收取费用和收费；", "收取費用和收費；", "To collect fees and charges;"),
      T("执行本隐私政策和其他协议的条件和条款（如适用）；", "執行本隱私政策和其他協議的條件和條款（如適用）；", "To enforce the conditions and terms of this Privacy Policy and other agreements (where applicable);"),
      T("评估您向我们办理注册的资格；", "評估您向我們辦理註冊的資格；", "To assess and evaluate your eligibility for registering with us;"),
      T("履行向您提供货物或服务项下的或者与之相关的义务；", "履行向您提供貨物或服務項下的或者與之相關的義務；", "To perform obligations under or in connection with the provision of goods or services to you;"),
      T("改进我们的产品/服务、行销或者客户关系；", "改進我們的產品/服務、行銷或者客戶關係；", "To improve our products/services, marketing, or customer relationships;"),
      T("通过您不时向我们提供的短信、电子邮寄地址和/或联系号码开展直接行销以及向您发送我们产品/服务、福利、促销和奖励的更新资讯；以及", "通過您不時向我們提供的短信、電子郵寄地址和/或聯繫號碼開展直接行銷以及向您發送我們產品/服務、福利、促銷和獎勵的更新資訊；以及", "Direct marketing and send you updates of our products/services, benefits, promotions, and rewards through SMS, e-mail address, and/or the contact number you provided to us from time to time, unless you have opted not to receive such information; and"),
      T("促进我们遵守对我们适用的任何法律、习惯和制度。", "促進我們遵守對我們適用的任何法律、習慣和制度。", "To facilitate our compliance with any laws, customs, and regulations which may be applicable to us."),
      T("如果您代表的是某个实体的实益所有权人或者其他个人，您必须向其告知上述目的。我们可能会要求您提供证明该等告知的证据。", "如果您代表的是某個實體的實益所有權人或者其他個人，您必須向其告知上述目的。我們可能會要求您提供證明該等告知的證據。", "If you are representing beneficial owners of an entity or other individuals, you must notify them of the purposes. We may ask you for proof of such notification."),
      T("即使您与我们的关系（例如，本隐私政策）终止或者发生任何变化，以上条款中所列的目的可能会继续适用一段合理的期间（包括，在适用的情况下，一段使我们能够执行在与您签订的任何协议项下我们享有之权利的期间）。", "即使您與我們的關係（例如，本隱私政策）終止或者發生任何變化，以上條款中所列的目的可能會繼續適用一段合理的期間（包括，在適用的情況下，一段使我們能夠執行在與您簽訂的任何協議項下我們享有之權利的期間）。", "The purposes listed in the above clauses may continue to apply even in situations where your relationship with us (for example, this Privacy Policy) has been terminated or altered in any way, for a reasonable period thereafter (including, where applicable, a period to enable us to enforce our rights under any agreements with you)."),
      T("我们仅在以下情况下处理、使用或披露客户个人资料：", "我們僅在以下情況下處理、使用或披露客戶個人資料：", "We shall only process, use or disclose Customer Personal Data:"),
      T("完全为履行我们在本隐私政策项下的义务和提供本隐私政策项下要求的服务之目的，以及为上文所披露的目的；或者", "完全為履行我們在本隱私政策項下的義務和提供本隱私政策項下要求的服務之目的，以及為上文所披露的目的；或者", "Strictly for the purposes of fulfilling our obligations and providing the services required under this Privacy Policy, and for purposes as disclosed above; or"),
      T("经您事先书面同意；或者", "經您事先書面同意；或者", "With your prior written consent; or"),
      T("适用法律或法规要求时，但是，在该等法律或法规允许的情况下，我们应当通知您。", "適用法律或法規要求時，但是，在該等法律或法規允許的情況下，我們應當通知您。", "When required by applicable laws or regulations, but we shall notify you if permitted under such laws or regulations."),
    ],
  },
  {
    h: T("第3条 第三方来源的资讯。", "第3條 第三方來源的資訊。", "Section 3 Information from Third Party Sources."),
    p: [
      T("我们可能会不时从适用法律和法规要求或允许的第三方来源（例如，公共资料库、征信机构、身份验证合作伙伴、经销商和管道合作伙伴、联合行销合作伙伴和社交媒体平台）获取有关您的资讯。我们可能会为核实您身份的目的从公共资料库和身份验证合作伙伴获取有关您的资讯。身份验证合作伙伴会结合有关您的政府记录和公开可获得资讯，核实您的身份。该等资讯包括您的姓名、地址、工作岗位、公开就业资讯、信用记录、公共机构维护的任何制裁名单上的状态以及其他相关资料。我们是为了遵守我们的法定义务（例如，反洗钱法律）而获取该等资讯。", "我們可能會不時從適用法律和法規要求或允許的第三方來源（例如，公共資料庫、徵信機構、身份驗證合作夥伴、經銷商和管道合作夥伴、聯合行銷合作夥伴和社交媒體平台）獲取有關您的資訊。我們可能會為覈實您身份的目的從公共資料庫和身份驗證合作夥伴獲取有關您的資訊。身份驗證合作夥伴會結合有關您的政府記錄和公開可獲得資訊，覈實您的身份。該等資訊包括您的姓名、地址、工作崗位、公開就業資訊、信用記錄、公共機構維護的任何制裁名單上的狀態以及其他相關資料。我們是為了遵守我們的法定義務（例如，反洗錢法律）而獲取該等資訊。", "From time to time, we may obtain information about you from third party sources as required or permitted by applicable laws and regulations, such as public databases, credit bureaus, ID verification partners, resellers and channel partners, joint marketing partners, and social media platforms. We may obtain information about you from public databases and ID verification partners for the purposes of verifying your identity. ID verification partners use a combination of government records and publicly available information about you to verify your identity. Such information includes your name, address, job role, public employment profile, credit history, status on any sanctions lists maintained by public authorities, and other relevant data. We obtain such information to comply with our legal obligations, such as anti-money laundering laws."),
    ],
  },
  {
    h: T("第4条 与第三方共用个人资料。", "第4條 與第三方共用個人資料。", "Section 4 Personal Data Sharing with Third Parties."),
    p: [
      T("我们会注意仅允许为履行其任务和职责而需要客户个人资料的人员访问该等资讯，以及向有合法目的访问客户个人资料的第三方共用该等资讯。我们仅在以下情况下共用该等资讯：", "我們會注意僅允許為履行其任務和職責而需要客戶個人資料的人員訪問該等資訊，以及向有合法目的訪問客戶個人資料的第三方共用該等資訊。我們僅在以下情況下共用該等資訊：", "We take care to allow Customer Personal Data to be accessed only by those who require such information in order to perform their tasks and duties, and to share it with third parties who have a legitimate purpose for accessing it. We will only share such information in the following circumstances:"),
      T("我们可能会向第三方身份验证服务提供者共用客户个人资料，以履行我们在适用法律、法规和政策下的义务；", "我們可能會向第三方身份驗證服務提供者共用客戶個人資料，以履行我們在適用法律、法規和政策下的義務；", "We may share Customer Personal Data with third party identity verification services in order to meet our obligations under the applicable laws, regulations, and policies;"),
      T("我们可能会根据合同规定向有助于我们部分业务运营的服务提供者共用客户个人资料。这可能包括（但不限于）收款、行销、客户支援和技术服务；", "我們可能會根據合同規定向有助於我們部分業務運營的服務提供者共用客戶個人資料。這可能包括（但不限於）收款、行銷、客戶支援和技術服務；", "We may share Customer Personal Data with service providers under contract who help with parts of our business operations. This may include, but is not limited to, bill collection, marketing, customer support, and technology services;"),
      T("我们可能会与我们集团的其他成员、托管人、服务提供者、代理人、承包商、资料处理者、基金管理人、电信公司或者专业公司及其正式指定的代表（包括其雇员、董事或代理人）共用客户个人资料，以处理您的投资；以及", "我們可能會與我們集團的其他成員、托管人、服務提供者、代理人、承包商、資料處理者、基金管理人、電信公司或者專業公司及其正式指定的代表（包括其僱員、董事或代理人）共用客戶個人資料，以處理您的投資；以及", "We may share Customer Personal Data with other members of our group, custodians, service providers, agents, contractors, data processors, fund administrators, telecommunication companies, or professional firms and their duly appointed delegates (including their employees, directors, or agents) to process your investments; and"),
      T("当我们在适用法律、法规和政策项下被要求时，或者当我们善意地认为制止人身伤害或经济损失、举报可疑的非法活动或者调查违反本隐私政策或任何其他协议的行为而有必要披露客户个人资料时，我们可能会向执法部门、政府机构、监管机构或者其他第三方共用客户个人资料。", "當我們在適用法律、法規和政策項下被要求時，或者當我們善意地認為制止人身傷害或經濟損失、舉報可疑的非法活動或者調查違反本隱私政策或任何其他協議的行為而有必要披露客戶個人資料時，我們可能會向執法部門、政府機構、監管機構或者其他第三方共用客戶個人資料。", "We may share Customer Personal Data with law enforcement, government bodies, regulatory bodies, or other third parties when we are required to do so under the applicable laws, regulations, and policies, or when we believe in good faith that the disclosure of Customer Personal Data is necessary to prevent physical harm or financial loss, to report suspected illegal activity, or to investigate violations of this Privacy Policy or any other agreements."),
    ],
  },
  {
    h: T("第5条 保留个人资料。", "第5條 保留個人資料。", "Section 5 Retention of Personal Data."),
    p: [
      T("我们可能会将客户个人资料保留一段必要的时间，以实现本隐私政策中所列的或者适用法律要求或允许的目的。当合理认为保留客户个人资料对收集客户个人资料的目的不再有用或者对合法目的不再有必要时，我们将不再保留客户个人资料或者尽快删除可与资料主体相关联的资讯。", "我們可能會將客戶個人資料保留一段必要的時間，以實現本隱私政策中所列的或者適用法律要求或允許的目的。當合理認為保留客戶個人資料對收集客戶個人資料的目的不再有用或者對合法目的不再有必要時，我們將不再保留客戶個人資料或者盡快刪除可與資料主體相關聯的資訊。", "We may retain Customer Personal Data for as long as it is necessary to fulfil the purposes listed in this Privacy Policy or as required or permitted by applicable laws. We will cease to retain Customer Personal Data or remove the means by which the data can be associated with a Data Subject as soon as it is reasonable to assume that such retention no longer serves the purposes for which the Customer Personal Data were collected and are no longer necessary for legal purposes."),
    ],
  },
  {
    h: T("第6条 保护个人资料。", "第6條 保護個人資料。", "Section 6 Protection of Personal Data."),
    p: [
      T("为了保护客户个人资料免遭未经授权的访问、收集、使用、披露、复制、修改、处置或者类似的风险，我们引入了适当的管理、物理和技术措施，例如，最新的防病毒保护、加密和使用隐私筛检程序保护我们对客户个人资料的所有存储和传输，以及仅在有必要知晓的前提下在内部或者向我们授权的第三方服务提供者和代理人披露客户个人资料。但是，您应当知晓，没有任何一种互联网传输方式或者电子存储方法是绝对安全的。尽管无法保证安全，但我们仍将尽力保护客户个人资料的安全，并不断审查和加强我们的资讯安全措施。", "為了保護客戶個人資料免遭未經授權的訪問、收集、使用、披露、複製、修改、處置或者類似的風險，我們引入了適當的管理、物理和技術措施，例如，最新的防病毒保護、加密和使用隱私篩檢程序保護我們對客戶個人資料的所有存儲和傳輸，以及僅在有必要知曉的前提下在內部或者向我們授權的第三方服務提供者和代理人披露客戶個人資料。但是，您應當知曉，沒有任何一種互聯網傳輸方式或者電子存儲方法是絕對安全的。儘管無法保證安全，但我們仍將盡力保護客戶個人資料的安全，並不斷審查和加強我們的資訊安全措施。", "To safeguard Customer Personal Data from unauthorised access, collection, use, disclosure, copying, modification, disposal or similar risks, we have introduced appropriate administrative, physical and technical measures, such as up-to-date antivirus protection, encryption and the use of privacy filters, to secure all storage and transmission of Customer Personal Data by us, and disclosing Customer Personal Data both internally and to our authorised third party service providers and agents only on a need-to-know basis. You should be aware, however, that no method of transmission over the Internet or method of electronic storage is completely secure. While security cannot be guaranteed, we strive to protect the security of Customer Personal Data and are constantly reviewing and enhancing our information security measures."),
    ],
  },
  {
    h: T("第7条 访问和更正个人资料。", "第7條 訪問和更正個人資料。", "Section 7 Access and Correction of Personal Data."),
    p: [
      T("您有权根据私隐条例的规定要求访问和更正您的客户个人资料。如果您希望提出(a)访问请求，以访问我们持有的有关您的客户个人资料的副本或者有关我们使用或披露客户个人资料的方式的资讯；或者(b)更正请求，以更正或更新我们持有的有关您的客户个人资料，您可以书面形式或者通过电子邮件向我们的保障资料主任提交您的请求，联系资讯见下文。请注意，对于访问请求，可能会收取合理的费用。如果收取费用的，我们将在处理您的请求之前向您告知相关费用。我们将在合理的范围内尽快回复您的访问请求。如果我们无法在收到您的访问请求后的合理时间内回复您的访问请求，我们将在能够回复您请求的合理时间内以书面形式通知您。", "您有權根據私隱條例的規定要求訪問和更正您的客戶個人資料。如果您希望提出(a)訪問請求，以訪問我們持有的有關您的客戶個人資料的副本或者有關我們使用或披露客戶個人資料的方式的資訊；或者(b)更正請求，以更正或更新我們持有的有關您的客戶個人資料，您可以書面形式或者通過電子郵件向我們的保障資料主任提交您的請求，聯繫資訊見下文。請注意，對於訪問請求，可能會收取合理的費用。如果收取費用的，我們將在處理您的請求之前向您告知相關費用。我們將在合理的範圍內盡快回復您的訪問請求。如果我們無法在收到您的訪問請求後的合理時間內回復您的訪問請求，我們將在能夠回復您請求的合理時間內以書面形式通知您。", "You have a right to request access to and correction of your Customer Personal Data in accordance with the PDPO. If you wish to make (a) an access request for access to a copy of the Customer Personal Data which we hold about you or information about the ways in which we use or disclose Customer Personal Data, or (b) a correction request to correct or update any of the Customer Personal Data which we hold about you, you may submit your request in writing or via email to our Data Protection Officer at the contact details provided below. Please note that a reasonable fee may be charged for an access request. If so, we will inform you of the fee before processing your request. We will respond to your access request as soon as reasonably possible. Should we not be able to respond to your access request within a reasonable period of time after receiving your access request, we will inform you in writing within a reasonable period of time by which we will be able to respond to your request."),
    ],
  },
  {
    h: T("第8条 将个人资料转移至香港境外。", "第8條 將個人資料轉移至香港境外。", "Section 8 Transfer of Personal Data Outside Hong Kong."),
    p: [
      T("您提供的客户个人资料或者其副本将披露或转移给对上文第2条中所述之目的相关和必要的主体。我们一般不会将客户个人资料转移到香港境外的国家。但是，我们的某些服务提供者、关联方和集团公司可能会为上述目的在香港境外存储、转移和以其他方式处理客户个人资料。如果我们进行该等存储、转移和处理，我们将采取措施确保您的客户个人资料继续获得至少与私隐条例项下提供之保护相当的保护标准。如果是代表某个实体订立本隐私政策，您确认，该实体的全部实益所有权人均同意为上述目的将客户个人资料转移至香港境外。我们可能会要求您提供证明该等同意的证据。", "您提供的客戶個人資料或者其副本將披露或轉移給對上文第2條中所述之目的相關和必要的主體。我們一般不會將客戶個人資料轉移到香港境外的國家。但是，我們的某些服務提供者、關聯方和集團公司可能會為上述目的在香港境外存儲、轉移和以其他方式處理客戶個人資料。如果我們進行該等存儲、轉移和處理，我們將採取措施確保您的客戶個人資料繼續獲得至少與私隱條例項下提供之保護相當的保護標準。如果是代表某個實體訂立本隱私政策，您確認，該實體的全部實益所有權人均同意為上述目的將客戶個人資料轉移至香港境外。我們可能會要求您提供證明該等同意的證據。", "Customer Personal Data provided by you, or copies of which, will be disclosed or transferred to parties relevant and necessary for the purposes as stated in Section 2 above. We generally do not transfer Customer Personal Data to countries outside of Hong Kong. However, some of our service providers, affiliates, and group companies may store, transfer, and otherwise process Customer Personal Data outside Hong Kong for the purposes set out above. If we do so, we will take steps to ensure that your Customer Personal Data continues to receive a standard of protection that is at least comparable to that provided under the PDPO. If this Privacy Policy is entered into on behalf of an entity, you confirm that all beneficial owners of that entity consent to the transfer of Customer Personal Data outside of Hong Kong for the abovementioned purposes. We may require you to furnish proof of such consent."),
    ],
  },
  {
    h: T("第9条 个人资料的准确性。", "第9條 個人資料的準確性。", "Section 9 Accuracy of Personal Data."),
    p: [
      T("我们通常依赖于您（或者您的授权代表）提供的客户个人资料是完整、准确且最新的。为确保您提供的客户个人资料是最新、完整且准确的，在该等客户个人资料发生变化的情况下，您应当通过电子邮件通知我们的保障资料主任，联系资讯见下文。", "我們通常依賴於您（或者您的授權代表）提供的客戶個人資料是完整、準確且最新的。為確保您提供的客戶個人資料是最新、完整且準確的，在該等客戶個人資料發生變化的情況下，您應當通過電子郵件通知我們的保障資料主任，聯繫資訊見下文。", "We generally rely on the fact that Customer Personal Data provided by you (or your Authorised Representative) is complete, accurate, and up to date. In order to ensure that Customer Personal Data provided by you is current, complete, and accurate, you should update us if there are changes to such Customer Personal Data by informing our Data Protection Officer via email at the contact details provided below."),
    ],
  },
  {
    h: T("第10条 同意和撤销同意。", "第10條 同意和撤銷同意。", "Section 10 Consent and Withdrawing Consent."),
    p: [
      T("通过在注册时向我们提供客户个人资料和/或签订本隐私政策，您确认，您已阅读、理解并同意本隐私政策的所有条款和条件，并同意为本隐私政策中所述的所有目的收集、使用、披露和/或处理客户个人资料。在您以书面形式撤销同意之前，该等同意将持续有效。您可在任何时候通过电子邮件向我们的保障资料主任（compliance@highblockhk.com）发送书面通知，撤销您对收集、使用或披露和/或处理客户个人资料的同意。在收到请求后，我们将在收到您撤销请求之日起的30天内向您告知撤销同意可能造成的后果。在您撤销后，我们将停止收集、使用或披露客户个人资料（视情况而定），但在私隐条例或者任何其他适用法律或法规项下要求或授权无需同意而收集、使用或披露客户个人资料的除外。", "通過在註冊時向我們提供客戶個人資料和/或簽訂本隱私政策，您確認，您已閱讀、理解並同意本隱私政策的所有條款和條件，並同意為本隱私政策中所述的所有目的收集、使用、披露和/或處理客戶個人資料。在您以書面形式撤銷同意之前，該等同意將持續有效。您可在任何時候通過電子郵件向我們的保障資料主任（compliance@highblockhk.com）發送書面通知，撤銷您對收集、使用或披露和/或處理客戶個人資料的同意。在收到請求後，我們將在收到您撤銷請求之日起的30天內向您告知撤銷同意可能造成的後果。在您撤銷後，我們將停止收集、使用或披露客戶個人資料（視情況而定），但在私隱條例或者任何其他適用法律或法規項下要求或授權無需同意而收集、使用或披露客戶個人資料的除外。", "By providing Customer Personal Data to us for registering and/or by entering into this Privacy Policy, you acknowledge that you have read, understood, and agreed to all the terms and conditions of this Privacy Policy, and consent to the collection, use, disclosure, and/or processing of Customer Personal Data for all the purposes referred to in this Privacy Policy. The consent will remain valid until such time as it is withdrawn by you in writing. You can at any time withdraw your consent to the collection, use, or disclosure, and/or processing of Customer Personal Data by giving us written notice via email to our Data Protection Officer at compliance@highblockhk.com. Upon receipt of the request, we will inform you of the likely consequences of withdrawing consent within 30 days from the day we receive your withdrawal request. Upon your withdrawal, we will cease collecting, using, or disclosing the Customer Personal Data, as the case may be, unless the collection, use, or disclosure of the Customer Personal Data without consent is required or authorised under the PDPO or any other applicable laws or regulations."),
    ],
  },
  {
    h: T("第11条 使用Cookie。", "第11條 使用Cookie。", "Section 11 Use of Cookie."),
    p: [
      T("Cookie是一个小型档（或者档中的记录），网站可将其发送到您的浏览器，然后，您的浏览器可将其存储在您的电脑硬盘上。我们使用Cookie跟踪您对我们网站的访问并在您重复访问时识别您的网络浏览器，进而改进我们的网站，以便我们可以收集有关新访问者和重复访问者的统计资料，以及处理通过网站进行的交易和服务。Cookie还使我们能够保存注册和订阅资讯或者密码，使得您无需在每次访问我们网站时重新输入相关资讯，从而使我们的网站对用户更加友好。尽管有上述规定，您并不是必须接受Cookie，您应当阅读您网络浏览器随附的资讯，了解如何设置您的网络浏览器，以在您收到Cookie时通知您，让您有机会决定接受或拒绝该Cookie。如果您选择阻止使用Cookie，则我们网站的某些功能可能无法正常工作。", "Cookie是一個小型檔（或者檔中的記錄），網站可將其發送到您的瀏覽器，然後，您的瀏覽器可將其存儲在您的電腦硬盤上。我們使用Cookie跟蹤您對我們網站的訪問並在您重復訪問時識別您的網絡瀏覽器，進而改進我們的網站，以便我們可以收集有關新訪問者和重復訪問者的統計資料，以及處理通過網站進行的交易和服務。Cookie還使我們能夠保存註冊和訂閱資訊或者密碼，使得您無需在每次訪問我們網站時重新輸入相關資訊，從而使我們的網站對用戶更加友好。儘管有上述規定，您並不是必須接受Cookie，您應當閱讀您網絡瀏覽器隨附的資訊，瞭解如何設置您的網絡瀏覽器，以在您收到Cookie時通知您，讓您有機會決定接受或拒絕該Cookie。如果您選擇阻止使用Cookie，則我們網站的某些功能可能無法正常工作。", "A cookie is a small file (or record in a file) which the website can send to your browser, which may then store it on your computer’s hard drive. We use cookies to improve our website by tracking your visits to our website and recognising your web browser when you are a repeat visitor so that we can gather statistics on new and repeat visitors, as well as to process transactions and services conducted through our websites. Cookies also allow us to make our website more user friendly by allowing us to save registration and subscription details or passwords so that you do not have to re-enter them every time you visit our website. Notwithstanding the above, you do not have to accept cookies, and you should read the information that comes with your web browser software to see how you can set up your web browser to notify you when you receive a cookie and to give you the opportunity to decide whether to accept or reject it. Should you choose to block the use of cookies, some functions of our website may not work properly."),
    ],
  },
  {
    h: T("第12条 第三方链接。", "第12條 第三方連結。", "Section 12 Third party links."),
    p: [
      T("我们可能会提供连接至其他互联网位置或网站（「第三方网站」）的超链接。您与第三方网站或从第三方网站建立的任何链接将由您自担风险。使用第三方网站必须遵守第三方网站的条款，您提供的任何资讯将适用第三方网站的条款，包括与保密、资料隐私和安全相关的条款。除另有明确的书面约定以外，我们对第三方网站提供的货物和服务不承担任何责任或义务。我们未宣传、推荐、批准、保证第三方网站的内容，也未对第三方网站的内容作出任何保证、陈述或承诺。我们声明，对于直接或间接因您访问第三方网站或者您在第三方网站上或通过第三方网站提供的任何资讯或从事的任何交易，或者第三方网站发布或提供的任何资讯、货物或服务的问题，或者第三方网站上的任何错误、遗漏或虚假陈述，或者因第三方网站产生的任何电脑病毒，或者与第三方网站相关的系统故障而引起的或者与之相关的任何损失、损害和任何其他后果，我们概不负责。我们不是您与任何第三方网站的提供者之间达成的任何合同安排的当事方，但另有明确规定或约定的除外。", "我們可能會提供連接至其他互聯網位置或網站（「第三方網站」）的超連結。您與第三方網站或從第三方網站建立的任何連結將由您自擔風險。使用第三方網站必須遵守第三方網站的條款，您提供的任何資訊將適用第三方網站的條款，包括與保密、資料隱私和安全相關的條款。除另有明確的書面約定以外，我們對第三方網站提供的貨物和服務不承擔任何責任或義務。我們未宣傳、推薦、批准、保證第三方網站的內容，也未對第三方網站的內容作出任何保證、陳述或承諾。我們聲明，對於直接或間接因您訪問第三方網站或者您在第三方網站上或通過第三方網站提供的任何資訊或從事的任何交易，或者第三方網站發佈或提供的任何資訊、貨物或服務的問題，或者第三方網站上的任何錯誤、遺漏或虛假陳述，或者因第三方網站產生的任何電腦病毒，或者與第三方網站相關的系統故障而引起的或者與之相關的任何損失、損害和任何其他後果，我們概不負責。我們不是您與任何第三方網站的提供者之間達成的任何合同安排的當事方，但另有明確規定或約定的除外。", "We may provide hyperlinks to other locations or websites on the Internet (“Third Party Websites”). Any link you make to or from the Third Party Website will be at your own risk. Any use of the Third Party Website will be subject to, and any information you provide will be governed by, the terms of the Third Party Website, including those relating to confidentiality, data privacy and security. Unless otherwise expressly agreed in writing, we are in no way responsible or liable for the goods and services offered by the Third Party Website. We do not endorse, recommend, approve, guarantee, or make any warranties, representations, or undertakings relating to the content of the Third Party Website. We disclaim liability for any loss, damage, and any other consequence resulting directly or indirectly from or relating to your access to the Third Party Website or any information that you may provide or any transaction conducted on or via the Third Party Website, or the failure of any information, goods, or services posted or offered at the Third Party Website, or any error, omission, or misrepresentation on the Third Party Website, or any computer virus arising from or system failure associated with the Third Party Website. We are not a party to any contractual arrangement entered into between you and the provider of any Third Party Website unless otherwise expressly specified or agreed."),
    ],
  },
  {
    h: T("第13条 保障资料主任。", "第13條 保障資料主任。", "Section 13 Data Protection Officer."),
    p: [
      T("我们可在任何时候通过在我们的网站上公布变更的方式对我们的隐私政策进行更新。如果您对我们的资料保护和隐私政策及程序有任何咨询或反馈，您可通过电子邮件联系我们的保障资料主任，电子邮件地址：compliance@highblockhk.com。", "我們可在任何時候通過在我們的網站上公佈變更的方式對我們的隱私政策進行更新。如果您對我們的資料保護和隱私政策及程序有任何諮詢或反饋，您可通過電子郵件聯繫我們的保障資料主任，電子郵件地址：compliance@highblockhk.com。", "We may update our Privacy Policy at any time by posting the changes on our website. You may contact our Data Protection Officer via compliance@highblockhk.com if you have any enquiries or feedback on our data protection and privacy policies and procedures."),
    ],
  },
  {
    h: T("第14条 英文版本优先。", "第14條 英文版本優先。", "Section 14 English Prevails."),
    p: [
      T("本隐私政策的中文翻译仅用作提供参考。如果本隐私政策的中英文版本有任何不一致或冲突的地方，应以英文版本为准。", "本隱私政策的中文翻譯僅用作提供參考。如果本隱私政策的中英文版本有任何不一致或衝突的地方，應以英文版本為準。", "The Chinese translation of this Privacy Policy is for reference only. Should there be any inconsistency or conflict between the English and Chinese versions of this Privacy Policy, the English version shall prevail."),
    ],
  },
];
