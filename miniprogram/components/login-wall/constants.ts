export type InternalPhase = 'splash' | 'login' | 'success' | 'login-success' | 'hidden';
export type AuthState = 'idle' | 'loading' | 'success' | 'fail';
export type SuccessMode = 'new' | 'old' | '';

export const TIMINGS = {
  STAY_TIME_NEW: 3000,
  STAY_TIME_OLD: 1800, 
  FADE_OUT_DURATION: 2000, // 恢复到2秒（1.5s动画 + 0.5s冗余），因为现在是三者同时启动淡出
  RETRIAL_CYCLE: 4000,
  MIN_CHECK_INTERVAL: 300
};
