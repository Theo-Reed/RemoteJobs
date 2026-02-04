export type InternalPhase = 'splash' | 'login' | 'success' | 'login-success' | 'hidden';
export type AuthState = 'idle' | 'loading' | 'success' | 'fail';
export type SuccessMode = 'new' | 'old' | '';

export const TIMINGS = {
  STAY_TIME_NEW: 3000,
  STAY_TIME_OLD: 1300,
  FADE_OUT_DURATION: 1500,
  RETRIAL_CYCLE: 4000,
  MIN_CHECK_INTERVAL: 300
};
