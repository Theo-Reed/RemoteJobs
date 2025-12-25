// miniprogram/components/drawer/index.ts

// NOTE: Some IDE toolchains warn about string literals containing both ASCII and non-ASCII.
// It's harmless (these are just data labels), so we silence it by not using literal unions here.

import { normalizeLanguage, t } from '../../utils/i18n'

type DrawerValue = { salary: string; experience: string }

// loosen key types to avoid mixed ASCII/non-ASCII literal warnings from tooling
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type SalaryKey = string
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type ExpKey = string

const SALARY_KEYS: SalaryKey[] = ['全部', '3K以下', '3-5K', '5-10K', '10-20K', '20-50K', '50K以上']
const EXP_KEYS: ExpKey[] = ['全部', '在校生', '应届生', '1年以内', '1-3年', '3-5年', '5-10年', '10年以上']

const EN_SALARY: Record<string, string> = {
  '全部': 'All',
  '3K以下': '< 3K',
  '3-5K': '3–5K',
  '5-10K': '5–10K',
  '10-20K': '10–20K',
  '20-50K': '20–50K',
  '50K以上': '50K+',
}

const EN_EXP: Record<string, string> = {
  '全部': 'All',
  '在校生': 'Student',
  '应届生': 'Graduate',
  '1年以内': '< 1y',
  '1-3年': '1–3y',
  '3-5年': '3–5y',
  '5-10年': '5–10y',
  '10年以上': '10y+',
}

Component({
  properties: {
    show: { type: Boolean, value: false },
    value: {
      type: Object,
      value: { salary: '全部', experience: '全部' },
    },
  },

  data: {
    tempValue: { salary: '全部', experience: '全部' } as DrawerValue,

    // internal keys (Chinese)
    salaryOptions: SALARY_KEYS,
    experienceOptions: EXP_KEYS,

    // display labels
    displaySalaryOptions: [] as string[],
    displayExperienceOptions: [] as string[],

    ui: {
      salaryTitle: '薪资',
      experienceTitle: '经验',
      clear: '清除',
      confirm: '确定',
    } as Record<string, string>,
  },

  observers: {
    show(open) {
      if (open) {
        this.syncLanguageFromApp()

        const v = (this.properties && (this.properties.value as any)) || { salary: '全部', experience: '全部' }
        this.setData({
          tempValue: {
            salary: v.salary || '全部',
            experience: v.experience || '全部',
          },
        })
      }
    },
    value(v) {
      if (this.properties && this.properties.show) {
        const next = (v as any) || { salary: '全部', experience: '全部' }
        this.setData({
          tempValue: {
            salary: next.salary || '全部',
            experience: next.experience || '全部',
          },
        })
      }
    },
  },

  lifetimes: {
    attached() {
      const app = getApp<IAppOption>() as any
      const listener = () => {
        // update only when mounted; safe even if hidden
        this.syncLanguageFromApp()
      }
      ;(this as any)._langListener = listener
      if (app?.onLanguageChange) app.onLanguageChange(listener)

      // initialize display values
      this.syncLanguageFromApp()
    },

    detached() {
      const app = getApp<IAppOption>() as any
      const listener = (this as any)._langListener
      if (listener && app?.offLanguageChange) app.offLanguageChange(listener)
      ;(this as any)._langListener = null
    },
  },

  methods: {
    syncLanguageFromApp() {
      const app = getApp<IAppOption>() as any
      const lang = normalizeLanguage(app?.globalData?.language)

      const displaySalaryOptions = (this.data.salaryOptions as SalaryKey[]).map((k) => (lang === 'English' ? EN_SALARY[k] : k))
      const displayExperienceOptions = (this.data.experienceOptions as ExpKey[]).map((k) => (lang === 'English' ? EN_EXP[k] : k))

      this.setData({
        displaySalaryOptions,
        displayExperienceOptions,
        ui: {
          salaryTitle: t('drawer.salary', lang),
          experienceTitle: t('drawer.experience', lang),
          clear: t('drawer.clear', lang),
          confirm: t('drawer.confirm', lang),
        },
      })
    },

    stopPropagation() {},

    onClose() {
      this.triggerEvent('close')
    },

    onPickSalary(e: any) {
      const value = (e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.value) || '全部'
      this.setData({ tempValue: { ...this.data.tempValue, salary: value } })
    },

    onPickExperience(e: any) {
      const value = (e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.value) || '全部'
      this.setData({ tempValue: { ...this.data.tempValue, experience: value } })
    },

    onReset() {
      const value = { salary: '全部', experience: '全部' }
      this.setData({ tempValue: value })
      this.triggerEvent('reset', { value })
    },

    onConfirm() {
      this.triggerEvent('confirm', { value: { ...this.data.tempValue } })
    },
  },
})
