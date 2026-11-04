# 资金域研发对接说明

> 面向研发的资金账户体系对接文档。代码全部在 `src/mock/data.js`（单文件 mock 数据层，localStorage 快照持久化），本文按函数名锚点索引，不依赖行号。
> 本文件无任何站内/导航入口，仅凭链接访问；内容不含凭据，只有业务口径。

## §1 模块地图

### 数据层（src/mock/data.js，按导出函数名检索）

| 区段 | 关键导出 | 说明 |
|---|---|---|
| 账户/余额 | `wallet` `CURRENCY_META` `walletKeyOf` `walletAccountOf` `applyWalletDelta` `walletOwnerView` | 三币种余额 `hkd/usd/cny`；`cny` 键对外展示为 CNH（离岸人民币），键名不改、展示走元数据映射 |
| 冻结派生 | `getFundFrozen` `getWithdrawFrozen` `getAvailableCash` | 冻结不落库，按 pending 单实时求和 |
| 申购赎回 | `submitFundOrder` `confirmFundOrder` `submitRedemptionOrder` `confirmRedemptionOrder` `rejectFundOrder` `cancelFundOrder` `getHoldingRedeemInfo` `getHoldings` `getFundPortfolio` `myFundOrders` `myFundStatements` | 数据：`fundOrders`（单据）/ `fundHoldings`（持仓）/ `fundStatements`（逐笔结单） |
| 出入金 | `submitDepositRequest` `approveDepositRequest` `rejectDepositRequest` `submitWithdrawRequest` `approveWithdrawRequest` `rejectWithdrawRequest` `cancelWithdrawRequest` `getWithdrawQuote` `withdrawalFeeConfig` `platformDepositAccount` | 数据：`depositRequests` / `withdrawRequests` / `transactions`（流水） |
| 银行卡 | `bankCards` `BANK_CARD_STATUS` `addBankCard` 及配套校验 | 三态：待验证 / 已验证 / 已拒绝；每币种 ≤3 张 |
| 合规联动 | `runAnomalyDetection` `runPepMonitoring` `logAudit` | 出入金确认时自动触发（大额/频繁/PEP/审计留痕） |

### APP 端页面（路由定义见 src/shell/router.jsx）

| 路由 | 页面组件 | 承接 |
|---|---|---|
| `#asset` | AssetOverview | 资金域归属地：充值/提现/银行卡/资金记录四入口 |
| `#fund-operation/deposit` `#fund-operation/withdraw` | FundOperation | 充值 + 提现表单 |
| `#bank-cards` `#bank-card-add/:currency` | BankCards / BankCardAdd | 银行卡管理（按币种 tab，每币种名额 3） |
| `#fund-requests` `#fund-request/:id` | 出入金单据列表/详情 | 出入金进度与结果 |
| `#transactions` `#transaction/:id` | Transactions / TransactionDetail | 资金流水 |
| `#funds` `#fund-detail/:id` | Funds / FundDetail | 基金列表/详情（申购赎回入口） |
| `#fund-subscribe/:id` | FundSubscribe | 申购表单 |
| `#fund-redeem/:holdingId` | FundRedeem | 赎回表单 |
| `#fund-orders` | FundOrders | 交易单据（申购/赎回） |
| `#fund-statements` `#fund-statement-detail/:id` | 结单列表/详情 | 逐笔结单 |

### 后台模块（src/admin/）

| 模块 | 职责 |
|---|---|
| `AdminFunds` | 资金审核（银行 ↔ 平台）：`deposits` 充值确认到账/拒绝（含首充加白）、`withdraws` 提现审核打款、`exchanges` 换汇（二期占位）；另有银行卡审核子块（资料审核 + 明文查看留痕） |
| `AdminFundTrades` | 基金交易（钱 ↔ 份额）：申购确认份额入账、赎回确认回款，`subscribe/redeem` 双 tab |
| `AdminConfig` | 提现费率配置（本地/跨境两档 + 最低出金门槛） |
| `AdminKYC` | 开户门控：首卡未加白不允许通过 KYC 审批（数据层硬校验） |

**两域分离原则**：充值/提现（银行 ↔ 平台）与申购/赎回（钱 ↔ 份额）不合并菜单、不合并单据列表。后台「资金审核」管前者，「基金交易」管后者。

## §2 核心业务口径

1. **冻结实时派生，不落库**（单一事实源）：
   `可用余额 = balance − 申购冻结(getFundFrozen) − 在途提现(getWithdrawFrozen)`
   恒等式：`可用 + 申购冻结 + 在途提现 ≡ 余额`。申购冻结 = 待确认申购单金额之和；提现冻结 = 在途提现单之和。提现通过时余额与在途同减 amount，恒等式保持。

2. **余额变动唯一入口 `applyWalletDelta`**：所有余额增减（充值上账、申购扣款、赎回回款、提现实扣）都走这一个函数，禁止旁路直改 `wallet.balance`。

3. **申购为「余额冻结式」**：`submitFundOrder` 不扣款，只校验可用余额；pending 单金额即派生冻结。`confirmFundOrder` 确认时：**先重校验余额**（期间用户可能已提现）→ 扣款 → 份额 = (金额 − 申购费) / 确认净值，4 位小数 → 持仓按加权平均成本并入 → 出逐笔结单。

4. **赎回「先回款入账，再改持仓」**：`confirmRedemptionOrder` 先 `applyWalletDelta` 回款（记账失败则整单失败，不动份额），再扣份额、按比例冲减 `costAmount`、差额记 `realizedPnl`。提交时冻结 `frozenShares += n`，确认时释放。

5. **锁定期按「份额」判定，不按持仓**：可赎 = `shares − redeemedShares − frozenShares`（FIFO 假设：默认先赎最早批次）。同一持仓新旧批次年龄不同，按持仓判断会把刚买入的锁定期份额一起放出去。

6. **赎回不受 PI 门控**：合规门控只挡买入。PI 过期仍可卖出——在持牌语境里不能困住投资者。

7. **首充加白**：未验证银行卡的首充即验证动作。充值确认到账（`approveDepositRequest`）时，该卡首充 ≥1 万 HKD 等值 → 自动置「已验证」；不足门槛 → 拒绝并原路退回，不上账。KYC 侧联动：首卡未加白，后台不允许通过 KYC 开户审批。

8. **充值对账三元组**：`refCode`（平台下发的 6 位码，用户写入汇款备注，最强匹配键）+ `payerRef`（用户从银行回单抄录的参考号，可空，第二匹配键）+ `transferDate`（用户声明汇款时间）。与金额一起构成财务核销依据。**实际到账金额与币种以财务核对录入为准**（用户可能汇错币种，银行换汇入账后金额币种都变）。

9. **提现费用**：本地（香港卡 0%）/ 跨境（0.5%）两档百分比，`withdrawalFeeConfig` 后台可配；手续费从申请金额内扣（集团 FR-13），单据下单时快照 `feeRate/feeAmount/netAmount`，后台改费率不回改历史单；最低出金 HKD 100 / USD 10 / CNH 100，按申请金额校验（非净到账）。审批校验基数 = 余额 − 申购冻结（本单提交时已冻结，通过即冻结转实扣，**不得再减在途提现**，双计会错杀）。

10. **费率**：申购 1%、赎回 0（`FUND_FEE_RATE`）。

11. **金额与份额精度**：金额一律 `formatExactAmount`（千分位 + 固定 2 位小数），份额一律 `formatShares`（最多 4 位）。禁止按页面变精度的第三种写法。

## §3 演示逻辑 vs 业务规则（接后端替换清单）

| 原型实现 | 性质 | 接后端时 |
|---|---|---|
| `applyWalletDelta` 按 userId 分流（演示账户写全局 `wallet`，其他客户写 `testAccounts`） | 演示护栏（防后台确认他人单据污染演示账户） | 删除分流，改为按 userId 的真实账户表记账 |
| `wallet` / `testAccounts` / `currentUser` 模块级单例 | 演示态 | 全部替换为服务端账户体系 |
| `genRef = 'BK' + Date.now()` 等假银行参考号（充值/提现 `bankRef`） | mock | 银行回执真实单号 |
| `Storage` 快照机制（`zhifu-app-state` + `STATE_VERSION` + `SNAPSHOT_MIGRATIONS` 逐级迁移） | 原型持久化 | 服务端存储；快照迁移机制随之废弃 |
| `makeReceiptSvg` 模拟回单兜底（无真实凭证时） | mock | 真实凭证对象存储 |
| `pushNotification` / `logAudit` 写本地数组 | 原型通知/审计 | 服务端通知与审计日志 |
| `FUND_SEED_RESULT` 及各类演示种子（预置单据/持仓/中间态） | 演示种子 | 不迁移 |
| 演示重置（清业务数据、保留语言与登录态） | 演示功能 | 不迁移 |

**待确认口径提示**：资金域口径确认单（2026-11-04，8 条待财务/RO 勾选）不在本仓库，以最终确认口径为准。已知分歧示例：本原型银行卡为三态（待验证/已验证/已拒绝），集团《统一法币出入金整体方案》§5.5 为四态（含「已停用」）——原型按「解绑替代停用」实现，该分歧在确认单中待裁。
