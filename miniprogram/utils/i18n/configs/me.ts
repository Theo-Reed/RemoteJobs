import { t, type AppLanguage } from '../index'

/**
 * 界面文案配置映射表
 * 
 * 使用对象结构定义 UI 变量与 i18n Key 的对应关系。
 * 支持 TSDoc 注释，在代码中引用 ui.xxx 时可直接查看功能描述。
 */
const UI_MAP = {
    // --- 导航与状态 ---
    /** 语言设置行标题 */
    languageEntry: 'me.languageEntry',
    /** 邀请码行标题 */
    inviteCodeEntry: 'me.inviteCodeEntry',
    /** 立即登录 */
    loginNow: 'me.loginNow',
    /** 查看并编辑个人资料 */
    viewEditProfile: 'me.viewEditProfile',
    /** 会员到期后缀 */
    expiresSuffix: 'me.expiresSuffix',
    
    // --- 会员与配额 ---
    /** 会员权益管理 */
    manageBenefits: 'me.manageBenefits',
    /** 立即解锁 */
    unlockNow: 'me.unlockNow',
    /** 岗位提炼配额标题 */
    jobQuota: 'me.jobQuota',
    /** 开启全部会员特权提示 */
    memberFullAccess: 'me.memberFullAccess',
    /** 解锁 AI 特权提示 */
    unlockAIFeatures: 'me.unlockAIFeatures',
    /** 普通用户标识 */
    regularUser: 'me.regularUser',
    /** VIP 标签 */
    vipTag: 'me.vipTag',
    /** 会员到期日期提示 */
    memberExpiredDate: 'me.memberExpiredDate',
    /** 额度点数 */
    points: 'me.points',
    /** 可用 */
    available: 'me.available',
    /** 会员中心 */
    memberCenter: 'me.memberCenter',
    /** 生效中 */
    active: 'me.active',
    /** 未激活 */
    inactive: 'me.inactive',
    /** 充值与升级 */
    rechargeUpgrade: 'me.rechargeUpgrade',

    // --- 邀请码弹窗 ---
    /** 邀请码弹窗标题 */
    inviteDialogTitle: 'me.inviteDialogTitle',
    /** 邀请码输入提示 */
    invitePlaceholder: 'me.invitePlaceholder',
    /** 无效邀请码提示 */
    invalidInviteCode: 'me.invalidInviteCode',
    /** 已激活成功提示 */
    inviteSuccess: 'me.inviteSuccess',

    // --- 语言选择 ---
    /** 语言选择面板标题 */
    languageSheetTitle: 'me.languageSheetTitle',
    /** 中文版显示名 */
    langChinese: 'me.langChinese',
    /** 英文版显示名 */
    langEnglish: 'me.langEnglish',
    /** AI 中文 */
    langAIChinese: 'me.langAIChinese',
    /** AI 英文 */
    langAIEnglish: 'me.langAIEnglish',

    // --- 提示与反馈 ---
    /** 正在保存 */
    saving: 'me.saving',
    /** 保存成功 */
    saveSuccess: 'me.saveSuccess',
    /** 授权失败 */
    authFailed: 'me.authFailed',
    /** 会员已到期 */
    memberExpired: 'me.memberExpired',
    /** 点数不足提示 */
    pointsInsufficient: 'me.pointsInsufficient',
    /** 上传失败 */
    uploadFailed: 'me.uploadFailed',
    /** 未设置手机号 */
    phoneNotBound: 'me.phoneNotBound',
    /** 登录过期提示 */
    sessionExpired: 'me.sessionExpired',
    /** 无网络提示 */
    noNetwork: 'me.noNetwork',

    // --- 支付相关 ---
    /** 订单创建中 */
    orderCreating: 'me.orderCreating',
    /** 调起支付失败 */
    paymentLaunchFailed: 'me.paymentLaunchFailed',
    /** 支付取消 */
    paymentCancelled: 'me.paymentCancelled',
    /** 支付前绑定手机号提示 */
    paymentPhoneRequired: 'me.paymentPhoneRequired',

    // --- 跨模块功能性文案 ---
    /** 统一确认/完成按钮 */
    confirm: 'jobs.doneLabel',
    /** 统一保存按钮 */
    save: 'resume.save',
    /** 统一取消按钮 */
    cancel: 'resume.cancel',
    /** 统一支付跳转 */
    toPay: 'me.toPay',
    /** AI 解锁弹窗标题 */
    aiUnlockTitle: 'me.aiUnlockTitle',
    /** AI 解锁弹窗内容 */
    aiUnlockContent: 'me.aiUnlockContent',
} as const

/**
 * 构造页面所需的完整 UI 对象
 * @param _lang 兼容性保留字段 (不再强制使用)
 * @param data 页面当前的 Data，用于填充动态占位符（如金额、徽章名等）
 */
export function buildPageUI(_lang: AppLanguage | undefined, data: any) {
    const ui: Record<string, string> = {}

    // 1. 自动执行全量静态 Key 映射
    Object.keys(UI_MAP).forEach((key) => {
        const i18nPath = UI_MAP[key as keyof typeof UI_MAP]
        ui[key] = t(i18nPath as any)
    })

    // 2. 特殊动态逻辑处理：补差价升级引导
    const rawUpgradeGuide = t('me.upgradeGuide') as string
    const displayAmount = typeof data.upgradeAmount === 'number' ? (data.upgradeAmount / 100).toFixed(1) : '0'
    ui.upgradeGuide = rawUpgradeGuide.replace('{amount}', displayAmount)

    // 3. 特殊动态逻辑处理：会员续费文案
    if (data.memberBadgeText) {
        const rawRenewContent = t('me.memberRenewContent') as string
        ui.memberRenewContent = rawRenewContent.replace('{badge}', data.memberBadgeText)
    }

    return ui
}
