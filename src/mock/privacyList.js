// 个人信息收集清单（2026-11-24 · 法务 Final 定稿原文转录）
// 来源：docs/compliance/14. 个人信息收集清单-英简繁.docx（同一份表格 × 简/繁/EN 三语，已按
// document.xml 表格结构逐单元格转录，不依赖纯文本导出的行序）
// 转录纪律：
// 1. 法务定稿原文照抄——含「证券开户/交易密码」等本原型未实现的功能描述，不按产品形态裁剪
//    （披露范围 ≥ 实际收集不是合规问题，反之才是；法务文本研发无权增删改写）；
// 2. 原表格合并单元格（场景列/保存期限列）展开到每一行；多段落单元格按原文分隔符（；）连接；
// 3. 源文件异体字伪影（⽤ U+2F64 康熙部首替代「用」，共 2 处）统一转录为标准字，已建议法务修正源文件；
// 4. 繁中标题用词照抄原文「個人資訊」（PDPO 官方术语为「個人資料」，忠实原文优先）。
// 纯静态展示数据：不进 localStorage 快照（零 STATE_VERSION 影响）；后台协议版本管理暂不接入，
// 法务改版时以新 docx 重转录本文件并同步归档。
import { T } from './legalTexts';

// 保存期限：原表整列合并单元格，全部行同值（账户存续期间），共享同一三语对象
const RETENTION = T('账户存续期间', '帳戶存續期間', 'For the duration of the account');

export const privacyCollectionScenes = [
  {
    scene: T('安装使用', '安裝使用', 'Installation and Use'),
    rows: [
      {
        info: T(
          '读取及写入存储器信息、设备识别信息、设备状态信息以及设备环境信息',
          '讀取及寫入記憶體資訊、設備識別資訊、設備狀態資訊以及設備環境資訊',
          'Information read from or written to device storage; device identification information; device status information; and device environment information'
        ),
        purpose: T(
          '保障产品的稳定运行，降低用户安全风险',
          '保障產品的穩定運行，降低用戶安全風險',
          'To ensure the stable operation of the product and reduce security risks to users'
        ),
        retention: RETENTION,
      },
    ],
  },
  {
    scene: T('注册登录', '註冊登錄', 'Registration and Login'),
    rows: [
      {
        info: T(
          '手机号、验证码、密码、邀请码',
          '手機號、驗證碼、密碼、邀請碼',
          'Mobile phone number, verification code, password and invitation code'
        ),
        purpose: T(
          '用于注册创建账号和登录',
          '用於註冊創建帳號和登錄',
          'To register and create an account and enable login'
        ),
        retention: RETENTION,
      },
      {
        info: T(
          '设备相关信息：设备名称、设备型号、唯一设备标识符 (如：IMEI、IDFA、IDFV、OAID、android ID)、操作系统、IP 地址、手机移动设备的网卡 (MAC) 地址、软件安装列表、分辨率、移动应用下载渠道、当前移动应用版本号、移动应用语言设置信息、您所使用的软件版本信息、系统版本信息、移动网络信息',
          '設備相關資訊：設備名稱、設備型號、唯一設備識別字 (如：IMEI、IDFA、IDFV、OAID、android ID)、操作系統、IP 地址、手機移動設備的網卡 (MAC) 地址、軟體安裝列表、解析度、移動應用下載管道、當前移動應用版本號、移動應用語言設置資訊、您所使用的軟體版本資訊、系統版本資訊、移動網路資訊',
          'Device-related information: device name, device model, unique device identifiers (such as IMEI, IDFA, IDFV, OAID and Android ID), operating system, IP address, mobile device MAC address, list of installed applications, screen resolution, application download channel, current application version, application language settings, software version, system version and mobile network information'
        ),
        purpose: T(
          '用于识别设备的数据；用于故障排除、系统更新、软件适配，提升用户体验',
          '用於識別設備的數據；用於故障排除、系統更新、軟體適配，提升用戶體驗',
          'To identify devices, troubleshoot issues, perform system updates, ensure software compatibility and improve the user experience'
        ),
        retention: RETENTION,
      },
    ],
  },
  {
    scene: T('账号管理', '帳號管理', 'Account Management'),
    rows: [
      {
        info: T(
          '设备信息：设备机型、设备序列号、操作系统及版本、客户端版本等；历史登录设备信息',
          '設備資訊：設備機型、設備序列號、操作系統及版本、客戶端版本等；歷史登錄設備資訊',
          'Device information, such as device model, device serial number, operating system and version, and client application version; information about devices previously used to log in'
        ),
        purpose: T(
          '用于识别设备的数据(如设备序列号)或关于设备的数据(如浏览器类型)；用于故障排除、系统更新、软件适配，提升用户体验；用于管理登录设备，防止他人盗用',
          '用於識別設備的數據(如設備序列號)或關於設備的數據(如流覽器類型)；用於故障排除、系統更新、軟體適配，提升用戶體驗；用於管理登錄設備，防止他人盜用',
          'To identify devices using information such as device serial numbers; obtain information about devices, such as browser type; troubleshoot issues, perform system updates, ensure software compatibility and improve the user experience; and manage login devices to prevent unauthorised account access'
        ),
        retention: RETENTION,
      },
      {
        info: T(
          '账号信息，如昵称、密码、注册年限、绑定的第三方账号',
          '帳號資訊，如昵稱、密碼、註冊年限、綁定的第三方帳號',
          'Account information, such as nickname, password, length of time since registration and linked third-party accounts'
        ),
        purpose: T(
          '登录账号、找回与修改密码、解锁、注销账号',
          '登錄帳號、找回與修改密碼、解鎖、註銷帳號',
          'To enable account login, password recovery and changes, account unlocking and account deletion'
        ),
        retention: RETENTION,
      },
    ],
  },
  {
    scene: T('交易密码输入', '交易密碼輸入', 'Trading Password Entry'),
    rows: [
      {
        info: T(
          '身份信息核验结果',
          '身份資訊核驗結果',
          'Identity verification results'
        ),
        purpose: T(
          '便于用户使用指纹识别或者人脸识别方式输入交易密码',
          '便於用戶使用指紋識別或者人臉識別方式輸入交易密碼',
          'To enable users to enter their trading password using fingerprint or facial recognition'
        ),
        retention: RETENTION,
      },
    ],
  },
  {
    scene: T('安全运行', '安全運行', 'Security and Operation'),
    rows: [
      {
        info: T(
          '设备相关信息（设备名称、设备型号、唯一设备标识符 (如：IMEI、IDFA、IDFV、OAID、android ID)、操作系统、IP 地址、手机移动设备的网卡 (MAC) 地址、软件安装列表、分辨率、移动应用下载渠道、当前移动应用版本号、移动应用语言设置信息、您所使用的软件版本信息、系统版本信息、移动网络信息）、用户使用本平台服务时需提供或所形成的信息（标准网络日志数据、网络使用习惯、操作日志、服务记录）',
          '設備相關資訊（設備名稱、設備型號、唯一設備識別字 (如：IMEI、IDFA、IDFV、OAID、android ID)、操作系統、IP 地址、手機移動設備的網卡 (MAC) 地址、軟體安裝列表、解析度、移動應用下載管道、當前移動應用版本號、移動應用語言設置資訊、您所使用的軟體版本資訊、系統版本資訊、移動網路資訊）、用戶使用本平台服務時需提供或所形成的資訊（標準網路日誌數據、網路使用習慣、操作日誌、服務記錄）',
          'Device-related information: device name, device model, unique device identifiers (such as IMEI, IDFA, IDFV, OAID and Android ID), operating system, IP address, mobile device MAC address, list of installed applications, screen resolution, application download channel, current application version, application language settings, software version, system version and mobile network information; information provided or generated when users use the Platform services, including standard network log data, network usage patterns, operation logs and service records'
        ),
        purpose: T(
          '保障用户正常使用产品及服务、用户的账号安全',
          '保障用戶正常使用產品及服務、用戶的帳號安全',
          'To ensure that users can use the products and services normally and to protect account security'
        ),
        retention: RETENTION,
      },
    ],
  },
  {
    scene: T('证券开户', '證券開戶', 'Securities Account Opening'),
    rows: [
      {
        info: T(
          '手机照片',
          '手機照片',
          'Photos selected, taken or uploaded by the user for account opening'
        ),
        purpose: T(
          '用于提交相关开户信息',
          '用於提交相關開戶資訊',
          'To enable users to submit information required for account opening'
        ),
        retention: RETENTION,
      },
      {
        info: T(
          '证件信息：护照或身份证正反面照片',
          '證件資訊：護照或身份證正反面照片',
          'Identity document information: images of the relevant passport pages or the front and back of an identity card'
        ),
        purpose: T(
          '用于验证开立证券账户的用户身份',
          '用於驗證開立證券帳戶的用戶身份',
          'To verify the identity of users opening securities accounts'
        ),
        retention: RETENTION,
      },
      {
        info: T(
          '居住地址信息、通讯地址信息及对应证明文件',
          '居住地址資訊、通訊地址資訊及對應證明檔',
          'Residential address, correspondence address and supporting documents'
        ),
        purpose: T(
          '用于确认用户相关信息',
          '用於確認用戶相關資訊',
          'To verify the user’s relevant particulars'
        ),
        retention: RETENTION,
      },
      {
        info: T(
          '学历及职业信息（职业性质、就职公司信息）',
          '學歷及職業資訊（職業性質、就職公司資訊）',
          'Educational and employment information, including the nature of employment and employer information'
        ),
        purpose: T(
          '用于确认用户的职业风险',
          '用於確認用戶的職業風險',
          'To assess occupation-related risks'
        ),
        retention: RETENTION,
      },
      {
        info: T(
          '税务信息（包括税务国家/地区、税务编号）',
          '稅務資訊（包括稅務國家/地區、稅務編號）',
          'Tax information, including tax jurisdiction(s) and tax identification number(s)'
        ),
        purpose: T(
          '基于报税需要，用于填写W8BEN和CRS表格',
          '基於報稅需要，用於填寫W8BEN和CRS表格',
          'To complete Form W-8BEN and CRS forms for tax reporting purposes'
        ),
        retention: RETENTION,
      },
      {
        info: T(
          '电子邮箱地址',
          '電子郵箱地址',
          'Email address'
        ),
        purpose: T(
          '用于发送证券账户相关通知及信息',
          '用於發送證券帳戶相關通知及資訊',
          'To send notices and information relating to the securities account'
        ),
        retention: RETENTION,
      },
      {
        info: T(
          '资产投资信息',
          '資產投資資訊',
          'Asset and investment information'
        ),
        purpose: T(
          '客户开户合规的校验',
          '客戶開戶合規的校驗',
          'To conduct compliance checks for account opening'
        ),
        retention: RETENTION,
      },
      {
        info: T(
          '银行卡号及绑定手机号、人脸录制、手写签名',
          '銀行卡號及綁定手機號、人臉錄製、手寫簽名',
          'Bank card number and linked mobile phone number, facial video recording and handwritten signature'
        ),
        purpose: T(
          '用于中国大陆地区用户的身份校验',
          '用於中國大陸地區用戶的身份校驗',
          'To verify the identity of users in Mainland China'
        ),
        retention: RETENTION,
      },
      {
        info: T(
          '银行账户信息',
          '銀行帳戶資訊',
          'Bank account information'
        ),
        purpose: T(
          '用于非中国大陆地区用户的身份校验',
          '用於非中國大陸地區用戶的身份校驗',
          'To verify the identity of users outside Mainland China'
        ),
        retention: RETENTION,
      },
    ],
  },
];
