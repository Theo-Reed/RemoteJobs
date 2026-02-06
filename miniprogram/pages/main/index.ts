
import { bootManager } from '../../utils/bootManager';

const app = getApp<IAppOption>();

Page({
  data: {
    activeTab: 1, // Default to Resume (Index 1)
    bootStatus: 'loading',
    user: null as any,
    isLoggedIn: false
  },

  onLoad(options: any) {
    console.log('[Main] onLoad', options);
    
    // 1. Initial Sync
    this.syncState();

    // 2. Listen for boot changes
    bootManager.onStatusChange((status) => {
      this.syncState();
    });
  },

  syncState() {
    const app = getApp<IAppOption>();
    const user = app.globalData.user;
    const bootStatus = bootManager.getStatus();
    
    // 兼容多种字段名，确保登录态正确判断
    const hasPhone = !!(user && (user.phone || user.phoneNumber));
    const isLoggedIn = !!(hasPhone && bootStatus === 'success');
    
    console.log('[Main] syncState:', {
        hasPhone,
        bootStatus,
        isLoggedIn,
        userId: user?._id
    });
    
    this.setData({ 
        bootStatus,
        user,
        activeTab: (app.globalData.tabSelected !== undefined && app.globalData.tabSelected !== null) ? app.globalData.tabSelected : 1,
        isLoggedIn
    });
  },

  onShow() {
    this.syncState();
  },

  onLoginSuccess(e: any) {
    console.log('[Main] Login Success event caught');
    this.syncState();
  },

  onTabChange(e: any) {
    const index = e.detail?.index ?? parseInt(e.currentTarget.dataset.index);
    if (isNaN(index)) return;
    if (this.data.activeTab === index) return;
    
    console.log('[Main] Tab switched to:', index);
    this.setData({ activeTab: index });
    app.globalData.tabSelected = index;
    if (wx.vibrateShort) wx.vibrateShort({ type: 'light' });
  },

  onShareAppMessage() {
    return {
      title: '丈月尺 - 远程办公岗位',
      path: '/pages/main/index'
    }
  }
})
