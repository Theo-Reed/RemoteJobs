// miniprogram/pages/community/index.ts

import { normalizeLanguage, t } from '../../utils/i18n'

Page({
  data: {
    ui: {
      title: '社区',
      desc: '敬请期待',
    },
  },

  onShow() {
    const app = getApp<IAppOption>() as any
    const lang = normalizeLanguage(app?.globalData?.language)

    const ui = {
      title: t('community.title', lang),
      desc: t('community.desc', lang),
    }

    this.setData({ ui })

    try {
      wx.setNavigationBarTitle({ title: t('community.title', lang) })
    } catch {
      // ignore
    }
  },
})
