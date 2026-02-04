import { callApi } from '../../utils/request';
import { getPhoneNumberFromAuth } from '../../utils/phoneAuth';

import { StatusCode } from '../../utils/statusCodes';

Component({
  properties: {
    visible: {
      type: Boolean,
      value: true, 
      observer(newVal) {
        console.log('[LoginWall] Visible property changed:', newVal);
        if (newVal) {
          this.startFlow();
        } else {
           // 如果已经在跑淡出流程，由内部逻辑控制 _shouldShow 的关闭
           if (this.data._flowStarted) {
               console.log('[LoginWall] Animation in progress, observer will not close _shouldShow');
               return;
           }
           this.setData({ _shouldShow: false });
        }
      }
    }
  },

  observers: {
    'internalPhase': function(phase) {
      if (phase === 'hidden') {
        // [Custom TabBar] Layer is already there, no need to show
      } else {
        // [Custom TabBar] Layer management via z-index
      }
    }
  },

  lifetimes: {
    attached() {
      // 检查当前是否已登录，如果已登录（Splash非必需），则直接跳过动画
      // 这能避免 Tab 切换时（如果页面被重建）导致 Splash 重复出现
      const app = getApp<any>();
      const { user, bootStatus } = app.globalData;
      if (user && user.phoneNumber && bootStatus === 'success') {
          console.log('[LoginWall] User already logged in on attach, skipping splash.');
          this.setData({ 
              internalPhase: 'hidden', 
              _shouldShow: false,
              authState: 'success'
          });
          return;
      }

      // 强制启动流程，确保 Splash 动画至少展示一次
      this.startFlow();
    },
    detached() {
      // Cleanup
    }
  },

  data: {
    internalPhase: 'splash' as 'splash' | 'login' | 'success' | 'login-success' | 'hidden',
    bootStatus: 'loading',
    errorMsg: '',
    errorDesc: '',
    _flowStarted: false,
    _shouldShow: false, // 真正控制 DOM 显示的开关
    
    // Auth Animation States
    authState: 'idle' as 'idle' | 'loading' | 'success' | 'fail',
    authButtonText: '一键授权手机号登录',
    successMode: '' as 'new' | 'old' | '' // Track if it was a registration or login for CSS persistence
  },

  methods: {
    _authMinTimerPromise: null as Promise<void> | null,

    async startFlow() {
      if (this.data._flowStarted) return;
      
      const app = getApp<any>();
      const hasShownSplash = app.globalData._splashAnimated;

      console.log('[LoginWall] startFlow', { hasShownSplash });

      this.setData({ 
        _flowStarted: true,
        _shouldShow: true,
        internalPhase: hasShownSplash ? 'login' : 'splash'
      });

      // 只要展示过一次，之后就不再展示 splash 阶段
      if (!hasShownSplash) {
        app.globalData._splashAnimated = true;
      }

      const checkState = () => {
        const _app = getApp<any>();
        const { bootStatus } = _app.globalData;
        
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
          console.log('[LoginWall] SUCCESS state detected (Passive)');
          
          // 如果已经是登录状态（如 Token 有效），则直接隐藏，不需要任何 Success 动画
          this.setData({ internalPhase: 'hidden' });
          
          // 动画彻底结束后（1.5s），清理流程状态
          setTimeout(() => {
            this.setData({ _flowStarted: false, _shouldShow: false });
            this.triggerEvent('loginSuccess', _app.globalData.user);
          }, 1500);
        } 
        else if (bootStatus === 'no-network' || bootStatus === 'server-down' || bootStatus === 'error') {
          // ⚠️ Network/Server Error: Stay in current phase
          console.log(`[LoginWall] ${bootStatus} detected. Retrying in 4s (animation cycle)...`);
          
          // Wait for one full animation cycle (4s) before retrying the request
          setTimeout(() => {
            // Only retry if we are still in a failure state
            const currentStatus = _app.globalData.bootStatus;
            if (currentStatus === 'no-network' || currentStatus === 'server-down' || currentStatus === 'error') {
              _app.refreshUser().then(() => {
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

      // 立即检查状态，不需要人为等待，因为我们有整体 10s 的淡出
      checkState();
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

      // 1. 开始 Loading：卡片内容淡出，星星移至中心偏上 (s-loading 样式)
      this.setData({ authState: 'loading' });

      try {
        const openid = wx.getStorageSync('user_openid');
        const apiCall = callApi('getPhoneNumber', { code: detail.code, openid });
        
        const res: any = await apiCall;

        if (res && res.success && res.data && res.data.token) {
          // 登录成功业务
          wx.setStorageSync('token', res.data.token);
          app.globalData.user = res.data.user;
          app.globalData.bootStatus = 'success';

          const isNewUser = !!res.data.isNewUser;
          console.log('[LoginWall] Auth Success. New User:', isNewUser);

          // 根据是否为新用户，展示不同的成功动画
          this.setData({ 
            authState: 'success',
            successMode: isNewUser ? 'new' : 'old',
            internalPhase: isNewUser ? 'success' : 'login-success' 
          });

          const stayTime = isNewUser ? 3000 : 1300;

          // 3. 停留高潮展示时间
          setTimeout(() => {
             // 4. 触发最终物理淡出
             this.setData({ internalPhase: 'hidden' });
             
             // 5. 1.5s 后彻底释放占位 (对应 CSS transition)
             setTimeout(() => {
                this.setData({ _flowStarted: false, _shouldShow: false });
                this.triggerEvent('loginSuccess', app.globalData.user);
             }, 1500);
          }, stayTime); 
        } else {
           throw new Error(res?.message || '登录失败');
        }

      } catch (err: any) {
        console.error('[LoginWall] Auth error:', err);
        
        // 1. 立即把文字设置好，内容还没淡入用户看不见，实现“无感”
        this.setData({ 
            authButtonText: '再次尝试授权手机号'
        });

        // 2. 延迟回滚状态，让星星自动回到 s-login 预置位，并重新淡入其它元素
        setTimeout(() => {
            this.setData({ authState: 'idle' });
        }, 100);
      }
    }
  }
});
