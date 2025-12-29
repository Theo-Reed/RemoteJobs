// miniprogram/components/article-detail/index.ts
const swipeToCloseBehavior = require('../../behaviors/swipe-to-close')

Component({
  behaviors: [swipeToCloseBehavior],

  properties: {
    show: {
      type: Boolean,
      value: false,
    },
    articleId: {
      type: String,
      value: '',
    },
  },

  data: {
    article: null as any,
    htmlNodes: [] as any[],
    loading: false,
  },

  observers: {
    'show, articleId'(show: boolean, articleId: string) {
      if (show && articleId) {
        this.fetchArticleDetails(articleId)
      } else if (!show) {
        // Reset when closing
        this.setData({
          article: null,
          htmlNodes: [],
          loading: false,
        })
      }
    },
  },

  methods: {
    open(articleId: string) {
      if (!articleId) return
      // Keep API consistent with existing observer setup.
      this.setData({
        articleId,
        show: true,
      })
    },

    onClose() {
      this.triggerEvent('close')
    },

    async fetchArticleDetails(id: string) {
      this.setData({
        loading: true,
        article: null,
      })
      try {
        const db = wx.cloud.database()
        const res = await db.collection('articles').doc(id).get()
        
        if (!res.data) {
          wx.showToast({ title: '内容不存在', icon: 'none' })
          this.setData({ loading: false })
          return
        }

        const article = res.data

        // Process richText field
        // rich-text component supports both HTML string and nodes array
        let htmlNodes: any = null
        if (article.richText) {
          // If richText exists, use it directly (can be string or array)
          htmlNodes = article.richText
        } else {
          // Fallback: build HTML from title and description
          let html = ''
          if (article.title) {
            html += `<h3 style="margin:0 0 8px 0;font-size:40rpx;font-weight:600;color:#111827;">${article.title}</h3>`
          }
          if (article.description) {
            html += `<div style="margin:0 0 16px 0;font-size:28rpx;color:#374151;line-height:1.6;">${article.description}</div>`
          }
          htmlNodes = html || null
        }

        this.setData({
          article,
          htmlNodes,
          loading: false,
        })
      } catch (err) {
        console.error('[article-detail] fetchArticleDetails failed', err)
        wx.showToast({ title: '加载失败', icon: 'none' })
        this.setData({ loading: false })
      }
    },
  },
})

