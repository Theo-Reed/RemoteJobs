export type AppLanguage = 'Chinese' | 'English'

// One source of truth for supported languages
export const SUPPORTED_LANGUAGES: AppLanguage[] = ['Chinese', 'English']

// Simple key-based dictionary for UI text.
// NOTE: Job content is excluded by design.
const dict = {
  tab: {
    community: { Chinese: '社区', English: 'Community' },
    jobs: { Chinese: '岗位', English: 'Jobs' },
    me: { Chinese: '我', English: 'Me' },
  },
  me: {
    title: { Chinese: '我', English: 'Me' },
    userNotLoggedIn: { Chinese: '用户未登录', English: 'Not logged in' },
    favoritesEntry: { Chinese: '我收藏的岗位', English: 'Saved jobs' },
    languageEntry: { Chinese: '语言', English: 'Language' },
    langChinese: { Chinese: '中文', English: 'Chinese' },
    langEnglish: { Chinese: 'English', English: 'English' },
    comingSoon: { Chinese: '敬请期待', English: 'Coming soon' },
    loginSuccess: { Chinese: '登录成功', English: 'Logged in' },
    phoneAuthFailed: { Chinese: '手机号授权失败', English: 'Phone authorization failed' },
    phoneAuthRequired: { Chinese: '请先授权手机号', English: 'Please authorize your phone number' },
    openDetailFailed: { Chinese: '无法打开详情', English: 'Unable to open details' },
    loadFavoritesFailed: { Chinese: '加载收藏失败', English: 'Failed to load saved jobs' },
    emptyFavorites: { Chinese: '暂无收藏岗位', English: 'No saved jobs' },
  },
  community: {
    title: { Chinese: '社区', English: 'Community' },
    desc: { Chinese: '敬请期待', English: 'Coming soon' },
  },
} as const

export type I18nKey =
  | 'tab.community'
  | 'tab.jobs'
  | 'tab.me'
  | 'me.title'
  | 'me.userNotLoggedIn'
  | 'me.favoritesEntry'
  | 'me.languageEntry'
  | 'me.langChinese'
  | 'me.langEnglish'
  | 'me.comingSoon'
  | 'me.loginSuccess'
  | 'me.phoneAuthFailed'
  | 'me.phoneAuthRequired'
  | 'me.openDetailFailed'
  | 'me.loadFavoritesFailed'
  | 'me.emptyFavorites'
  | 'community.title'
  | 'community.desc'

function getByPath(obj: any, path: string) {
  return path.split('.').reduce((acc, k) => (acc ? acc[k] : undefined), obj)
}

export function t(key: I18nKey, language: AppLanguage): string {
  const item = getByPath(dict, key)
  const value = item?.[language]
  return typeof value === 'string' ? value : key
}

export function normalizeLanguage(input: any): AppLanguage {
  if (input === 'English' || input === '英文' || input === 'en' || input === 'EN') return 'English'
  return 'Chinese'
}
