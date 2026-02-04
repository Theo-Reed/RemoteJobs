import { TIMINGS, SuccessMode, InternalPhase } from './constants';

export interface CeremonyResult {
  mode: SuccessMode;
  phase: InternalPhase;
  stayTime: number;
}

/**
 * 获取基于用户类型的仪式配置
 * 实现了新老用户的逻辑物理隔离
 */
export function getCeremonyConfig(isNewUser: boolean): CeremonyResult {
  if (isNewUser) {
    return {
      mode: 'new',
      phase: 'success',
      stayTime: TIMINGS.STAY_TIME_NEW
    };
  }

  return {
    mode: 'old',
    phase: 'login-success',
    stayTime: TIMINGS.STAY_TIME_OLD
  };
}

/**
 * 封装淡出逻辑
 */
export function executeFadeOut(component: any, callback: Function) {
  // 1. 触发最终物理淡出
  component.setData({ internalPhase: 'hidden' });
  
  // 2. 彻底释放占位 (对应 CSS transition)
  setTimeout(() => {
    component.setData({ 
      _flowStarted: false, 
      _shouldShow: false 
    });
    callback();
  }, TIMINGS.FADE_OUT_DURATION);
}
