// app.ts
import { normalizeLanguage, type AppLanguage, t } from './utils/i18n'

App<IAppOption>({
  globalData: {
    user: null as any,
    language: 'Chinese' as AppLanguage,
  },
  async onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      return
    }

    wx.cloud.init({
      env: require('./env.js').cloudEnv,
      traceUser: true,
    })

    await this.refreshUser().catch((err: any) => {
      console.warn('[app] initUser failed', err)
    })

    this.applyLanguage()
  },

  applyLanguage() {
    const lang = ((this as any).globalData.language || 'Chinese') as AppLanguage

    // Tabbar text
    try {
      wx.setTabBarItem({ index: 0, text: t('tab.community', lang) })
      wx.setTabBarItem({ index: 1, text: t('tab.jobs', lang) })
      wx.setTabBarItem({ index: 2, text: t('tab.me', lang) })
    } catch {
      // ignore
    }

    // Current page nav title (best-effort)
    const pages = getCurrentPages()
    const current = pages?.[pages.length - 1] as any
    const route = current?.route || ''
    try {
      if (route === 'pages/me/index') wx.setNavigationBarTitle({ title: t('me.title', lang) })
      if (route === 'pages/community/index') wx.setNavigationBarTitle({ title: t('community.title', lang) })
    } catch {
      // ignore
    }
  },

  async setLanguage(language: AppLanguage) {
    ;(this as any).globalData.language = language
    this.applyLanguage()

    try {
      const res: any = await wx.cloud.callFunction({
        name: 'updateUserLanguage',
        data: { language },
      })
      const updatedUser = res?.result?.user
      if (updatedUser) {
        ;(this as any).globalData.user = updatedUser
      }
    } catch (err) {
      console.warn('[app] updateUserLanguage failed', err)
    }
  },

  async refreshUser() {
    const res: any = await wx.cloud.callFunction({
      name: 'initUser',
      data: {},
    })

    const openid = res?.result?.openid
    const user = (res?.result?.user || null) as any

    const merged = user ? { ...user, openid } : (openid ? { openid } : null)
    ;(this as any).globalData.user = merged

    const lang = normalizeLanguage(merged?.language)
    ;(this as any).globalData.language = lang

    return merged
  },
})
