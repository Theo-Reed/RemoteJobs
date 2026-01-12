Component({
  properties: {
    title: { 
      type: String, 
      value: ''
    },
    type: { type: String, value: 'loading' }, // 'loading', 'success', 'error', 'none'
    mask: { type: Boolean, value: false },
    visible: { 
      type: Boolean, 
      value: false,
      observer(newVal) {
        if (newVal) {
          if (this._hideTimer) {
            clearTimeout(this._hideTimer);
            this._hideTimer = null;
          }
          this.setData({ 
            innerVisible: true,
            displayVisible: true
          });
        } else {
          // 延迟开始隐藏动画，防止在 loading -> success 切换时的瞬时闪烁
          this._hideTimer = setTimeout(() => {
            this.setData({ displayVisible: false });
            // 给消失动画留出时间
            setTimeout(() => {
              if (!this.data.visible) {
                this.setData({ innerVisible: false });
              }
            }, 300);
            this._hideTimer = null;
          }, 50);
        }
      }
    }
  },
  data: {
    innerVisible: false,
    displayVisible: false
  },
  methods: {
  }
})
