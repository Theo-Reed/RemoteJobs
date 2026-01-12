import { normalizeLanguage, t } from '../../utils/i18n'
import { ui } from '../../utils/ui'

Page({
  data: {
    resumes: [] as any[],
    loading: true,
    page: 1,
    hasMore: true,
    ui: {} as any,
  },

  watcher: null as any,

  onLoad() {
    this.syncLanguage()
    this.fetchResumes()
    this.initWatcher()
  },

  syncLanguage() {
    const app = getApp<IAppOption>() as any
    const lang = normalizeLanguage(app?.globalData?.language)
    this.setData({
      ui: {
        assetCount: t('resume.assetCount', lang),
        syncingAssets: t('resume.syncingAssets', lang),
        statusApplied: t('resume.statusApplied', lang),
        statusFailed: t('resume.statusFailed', lang),
        generalResume: t('resume.generalResume', lang),
        view: t('resume.view', lang),
        loadFailed: t('jobs.loadFailed', lang),
        totalPrefix: t('resume.totalPrefix', lang),
        emptyTitle: t('resume.emptyTitle', lang),
        emptySubtitle: t('resume.emptySubtitle', lang),
        goJobs: t('resume.goJobs', lang),
      }
    })
  },

  onUnload() {
    if (this.watcher) {
      this.watcher.close()
    }
  },

  onPullDownRefresh() {
    this.setData({ page: 1, hasMore: true }, () => {
      this.fetchResumes().then(() => {
        wx.stopPullDownRefresh()
      })
    })
  },

  initWatcher() {
    const db = wx.cloud.database()
    this.watcher = db.collection('generated_resumes')
      .orderBy('createTime', 'desc')
      .watch({
        onChange: (snapshot) => {
          console.log('[Watcher] snapshot:', snapshot)
          if (snapshot.docs) {
            this.processResumes(snapshot.docs)
          }
        },
        onError: (err) => {
          console.error('[Watcher] error:', err)
        }
      })
  },

  async fetchResumes() {
    this.setData({ loading: true })
    const db = wx.cloud.database()
    
    try {
      const res = await db.collection('generated_resumes')
        .orderBy('createTime', 'desc')
        .get()

      this.processResumes(res.data)
      this.setData({ loading: false })
    } catch (err) {
      console.error('获取简历列表失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  processResumes(data: any[]) {
    const formattedResumes = data.map((item: any) => {
      const date = item.createTime ? new Date(item.createTime) : new Date()
      return {
        ...item,
        formattedDate: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
      }
    })

    this.setData({
      resumes: formattedResumes
    })
  },

  async onPreviewResume(e: any) {
    const item = e.currentTarget.dataset.item
    const app = getApp<IAppOption>() as any
    const lang = normalizeLanguage(app?.globalData?.language)
    
    // 如果还在生成中，不处理预览
    if (item.status === 'processing') {
      ui.showError(t('resume.aiProcessing', lang))
      return
    }

    if (item.status === 'failed') {
      wx.showModal({
        title: t('resume.generateFailed', lang),
        content: item.errorMessage || t('resume.tryAgain', lang),
        showCancel: false
      })
      return
    }

    if (!item.fileId) return

    ui.showLoading('正在获取文件...')

    try {
      // 1. 从云存储下载
      const downloadRes = await wx.cloud.downloadFile({
        fileID: item.fileId
      })

      // 2. 预览
      wx.openDocument({
        filePath: downloadRes.tempFilePath,
        showMenu: true,
        success: () => {
          ui.hideLoading()
        },
        fail: (err) => {
          ui.hideLoading()
          ui.showError('无法打开该文档')
        }
      })
    } catch (err) {
      ui.hideLoading()
      ui.showError('下载失败')
    }
  },

  goJobsList() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})

