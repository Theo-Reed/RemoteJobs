import { callApi } from '../../utils/request';
import { getPhoneNumberFromAuth } from '../../utils/phoneAuth';
const lottie = require('../../utils/lottie');

import { StatusCode } from '../../utils/statusCodes';

Component({
  properties: {
    visible: {
      type: Boolean,
      value: true, 
      observer(newVal) {
        console.log('[LoginWall] Visible property changed:', newVal);
        if (newVal) {
          wx.hideTabBar({ animated: false } as any).catch(() => {});
          this.startFlow();
        } else {
           const app = getApp<any>();
           // Security check: only allow hiding if bootStatus is success
           if (app.globalData.bootStatus !== 'success') {
               console.error('[LoginWall] BYPASS REJECTED. bootStatus is:', app.globalData.bootStatus);
               this.setData({ visible: true });
               return;
           }
          this.setData({ internalPhase: 'hidden', _flowStarted: false });
          wx.showTabBar({ animated: true } as any).catch(() => {});
        }
      }
    }
  },

  lifetimes: {
    attached() {
      // 只要组件挂载，第一件事就是隐藏 TabBar，防止闪烁
      wx.hideTabBar({ animated: false } as any).catch(() => {});
      
      // Removed initLottie() since we switched to SVG for better reliability and fidelity

      if (this.data.visible) {
        this.startFlow();
      }
    },
    detached() {
      // Cleanup
    }
  },

  data: {
    internalPhase: 'splash', // 'splash' | 'login' | 'hidden'
    bootStatus: 'loading',
    errorMsg: '',
    errorDesc: '',
    _flowStarted: false,
    
    // Auth Animation States
    authState: 'idle' as 'idle' | 'loading' | 'success' | 'fail',
    authButtonText: '一键授权手机号登录'
  },

  methods: {
    _lottieAni: null as any,
    _authMinTimerPromise: null as Promise<void> | null,

    async startFlow() {
      if (this.data._flowStarted) return;
      this.setData({ _flowStarted: true });

      const app = getApp<any>();
      console.log('[LoginWall] Flow started. Current bootStatus:', app.globalData.bootStatus);
      
      // Start in Splash Mode
      this.setData({ internalPhase: 'splash' });
      
      const checkState = () => {
        const { bootStatus } = app.globalData;
        
        if (this.data.bootStatus !== bootStatus) {
            this.setData({ bootStatus });
        }

        // If loading, keep checking
        if (bootStatus === 'loading') {
          setTimeout(checkState, 300);
          return;
        }

        console.log('[LoginWall] Finalizing state. Status:', bootStatus);

        if (bootStatus === 'success') {
          // Success: Fade out splash background -> Reveal App
          setTimeout(() => {
             this.setData({ internalPhase: 'hidden', _flowStarted: false });
             this.triggerEvent('loginSuccess', app.globalData.user);
          }, 600);
        } 
        else if (bootStatus === 'no-network' || bootStatus === 'server-down' || bootStatus === 'error') {
          // ⚠️ Network/Server Error: Stay in splash phase and keep star centered
          this.setData({ internalPhase: 'splash' });
          console.log(`[LoginWall] ${bootStatus} detected. Retrying in 4s (animation cycle)...`);
          
          // Wait for one full animation cycle (4s) before retrying the request
          setTimeout(() => {
            // Only retry if we are still in a failure state
            const currentStatus = getApp<any>().globalData.bootStatus;
            if (currentStatus === 'no-network' || currentStatus === 'server-down' || currentStatus === 'error') {
              app.refreshUser().then(() => {
                checkState();
              }).catch(() => {
                checkState();
              });
            } else {
              checkState();
            }
          }, 4000);
        }
        else {
          // Unauthorized or New User: Star flies to Login Card
          this.setData({ internalPhase: 'login' });
        }
      };

      // Ensure splash shows for at least 1.5s to appreciate the globe animation
      setTimeout(checkState, 1500);
    },

    retry() {
      const app = getApp<any>();
      this.setData({ internalPhase: 'splash' });
      app.refreshUser().then(() => {
        this.startFlow();
      }).catch(() => {
        this.startFlow();
      });
    },
    preventTouch() {
      // 阻止触摸穿透
      return;
    },

    async onGetPhoneNumber(e: any) {
      const { detail } = e;
      const app = getApp<any>();

      if (!detail.code) {
        console.log('[LoginWall] User cancelled phone auth');
        // 用户取消授权，不执行任何动画改变
        return;
      }

      // 1. 开始动画：元素淡出，星星移位
      this.setData({ authState: 'loading' });

      // 2. 启动最低 2.5 秒的定时器
      const minTimerPromise = new Promise(resolve => setTimeout(resolve, 2500));

      try {
        const openid = wx.getStorageSync('user_openid');
        
        // 3. 并行执行业务逻辑
        const apiCall = callApi('getPhoneNumber', { code: detail.code, openid });
        
        // 等待业务完成
        const res: any = await apiCall;
        
        // 等待最低计时器完成
        await minTimerPromise;

        if (res && res.success && res.data && res.data.token) {
          // 登录成功
          wx.setStorageSync('token', res.data.token);
          app.globalData.user = res.data.user;
          app.globalData.bootStatus = 'success';

          this.setData({ authState: 'success' });

          // 整个淡出
          setTimeout(() => {
             this.setData({ internalPhase: 'hidden', visible: false, _flowStarted: false });
             this.triggerEvent('loginSuccess', app.globalData.user);
          }, 600);
        } else {
           throw new Error(res?.message || '登录失败');
        }

      } catch (err: any) {
        console.error('[LoginWall] Auth error:', err);
        
        // 等待最低计时器完成（防止接口报错太快动画没走完）
        await minTimerPromise;

        // 1. 首先改变按钮文字 (此时内容仍处于淡出隐藏状态，用户看不见文字改变，从而实现“无感”和“不闪烁”)
        this.setData({ 
            authButtonText: '请重新授权手机号'
        });

        // 2. 略微延迟，确保上一步的数据驱动渲染已生效（虽然 setData 是原子的，但为了极致保险）
        // 然后触发 authState 回位，内容会淡入，星星会移回原位
        setTimeout(() => {
            this.setData({ authState: 'idle' });
        }, 150);
      }
    }
  }
});
