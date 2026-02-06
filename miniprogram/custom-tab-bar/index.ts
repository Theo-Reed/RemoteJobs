Component({
  data: {
    selected: 0,
    color: "#6b7280",
    selectedColor: "#1d4ed8",
    list: [
      {
        pagePath: "/pages/jobs/index",
        text: "岗位",
        iconPath: "/assets/tabbar/jobs.png",
        selectedIconPath: "/assets/tabbar/jobs-active.png"
      },
      {
        pagePath: "/pages/resume/index",
        text: "简历",
        iconPath: "/assets/tabbar/resume.png",
        selectedIconPath: "/assets/tabbar/resume-active.png"
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
      // 核心：在组件附着时，立即同步状态。
      // 优先从当前路由判断，因为 globalData 可能在某些极端场景下还未更新
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const app = getApp<any>();

      if (currentPage) {
        const route = currentPage.route.startsWith('/') ? currentPage.route : `/${currentPage.route}`;
        const index = this.data.list.findIndex(item => item.pagePath === route);
        
        if (index !== -1) {
          this.setData({ selected: index });
          // 同时校准全局状态
          if (app && app.globalData) app.globalData.tabSelected = index;
          return;
        }
      }

      // 如果路由获取失败，回退到全局状态同步
      if (app && app.globalData && typeof app.globalData.tabSelected === 'number') {
        this.setData({
          selected: app.globalData.tabSelected
        })
      }
    }
  },
  methods: {
    switchTab(e: any) {
      const data = e.currentTarget.dataset
      const index = data.index

      // 1. 先更新全局状态
      const app = getApp<any>()
      if (app && app.globalData) {
        app.globalData.tabSelected = index
      }

      // 2. 本地提前响应
      this.setData({
        selected: index
      })

      // 3. 触发事件让父页面 (main/index) 响应
      this.triggerEvent('change', { index })
    }
  }
})
