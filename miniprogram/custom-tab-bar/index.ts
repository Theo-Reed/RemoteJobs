Component({
  data: {
    selected: 0,
    color: "#6b7280",
    selectedColor: "#1d4ed8",
    list: [
      {
        pagePath: "/pages/index/index",
        text: "岗位",
        iconPath: "/assets/tabbar/community.png",
        selectedIconPath: "/assets/tabbar/community-active.png"
      },
      {
        pagePath: "/pages/tools/index",
        text: "简历",
        iconPath: "/assets/tabbar/jobs.png",
        selectedIconPath: "/assets/tabbar/jobs-active.png"
      },
      {
        pagePath: "/pages/me/index",
        text: "我",
        iconPath: "/assets/tabbar/me.png",
        selectedIconPath: "/assets/tabbar/me-active.png"
      }
    ]
  },
  lifetimes: {
    attached() {
      // 核心：在组件附着时，立即从全局同步选中状态，消除 0 -> n 的闪烁
      const app = getApp<any>()
      if (app && app.globalData && typeof app.globalData.tabSelected !== 'undefined') {
        this.setData({
          selected: app.globalData.tabSelected
        })
      }
    }
  },
  methods: {
    switchTab(e: any) {
      const data = e.currentTarget.dataset
      const url = data.path
      const index = data.index

      // 1. 先更新全局状态，确保下一页面组件在 attached 时就能拿到正确值
      const app = getApp<any>()
      if (app && app.globalData) {
        app.globalData.tabSelected = index
      }

      // 2. 本地提前响应，让点击反馈更即时
      this.setData({
        selected: index
      })

      // 3. 执行物理跳转
      wx.switchTab({ url })
    }
  }
})
