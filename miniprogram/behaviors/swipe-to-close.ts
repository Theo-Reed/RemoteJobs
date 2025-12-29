// miniprogram/behaviors/swipe-to-close.ts
// Behavior for swipe-to-close gesture on drawer components

module.exports = Behavior({
  lifetimes: {
    created() {
      // Store scroll position state
      ;(this as any)._scrollViewAtTop = true
    },
  },

  data: {
    // Swipe gesture state
    swipeStartX: 0,
    swipeStartY: 0,
    swipeCurrentX: 0,
    isSwiping: false,
    drawerTranslateX: 0, // Current translateX value for drawer
  },

  methods: {
    // Swipe gesture handlers
    onScrollViewScroll(e: any) {
      // Track scroll position to prevent swipe-to-close when scrolling
      const scrollTop = e.detail?.scrollTop || 0
      ;(this as any)._scrollViewAtTop = scrollTop <= 10
    },

    onTouchStart(e: any) {
      if (!this.data.show) return
      
      const touch = e.touches?.[0]
      if (!touch) return

      const startX = touch.clientX
      const startY = touch.clientY

      this.setData({
        swipeStartX: startX,
        swipeStartY: startY,
        swipeCurrentX: startX,
        isSwiping: false,
      })
    },

    onTouchMove(e: any) {
      if (!this.data.show) return

      const touch = e.touches?.[0]
      if (!touch) return

      const currentX = touch.clientX
      const currentY = touch.clientY
      const startX = this.data.swipeStartX
      const startY = this.data.swipeStartY

      const deltaX = currentX - startX
      const deltaY = currentY - startY

      // Only handle right swipe (positive deltaX)
      if (deltaX <= 0) {
        // If user swipes left or not swiping right, don't handle
        if (this.data.isSwiping) {
          // Reset if we were swiping
          this.setData({
            isSwiping: false,
            drawerTranslateX: 0,
          })
        }
        return
      }

      // Check if this is primarily a horizontal swipe
      const absDeltaX = Math.abs(deltaX)
      const absDeltaY = Math.abs(deltaY)
      
      // If vertical movement is much larger, it's probably a scroll
      // But if we're already swiping, continue swiping to avoid jitter
      if (!this.data.isSwiping && absDeltaY > absDeltaX * 0.7 && absDeltaY > 10) {
        // This looks like a scroll, don't interfere
        return
      }

      // Check if scroll-view is at top
      // If not at top and there's vertical movement, it's probably a scroll
      // But if we're already swiping, continue swiping to avoid jitter
      if (!this.data.isSwiping && !(this as any)._scrollViewAtTop && absDeltaY > 5) {
        // User is scrolling, not swiping to close
        return
      }

      // This is a right swipe, handle it
      if (!this.data.isSwiping && absDeltaX > 10) {
        // Start swiping - disable scroll during swipe
        this.setData({ isSwiping: true })
      }

      if (this.data.isSwiping) {
        // Update drawer position - follow finger exactly
        const systemInfo = wx.getSystemInfoSync()
        const maxTranslate = systemInfo.windowWidth // Max translate is full screen width
        const translateX = Math.min(deltaX, maxTranslate)
        
        // Use requestAnimationFrame for smooth updates, but in WeChat MiniProgram
        // we need to use setData directly. The key is to update immediately without delay.
        this.setData({
          swipeCurrentX: currentX,
          drawerTranslateX: translateX,
        })
      }
    },

    onTouchEnd(_e: any) {
      if (!this.data.show || !this.data.isSwiping) {
        this.setData({
          swipeStartX: 0,
          swipeStartY: 0,
          swipeCurrentX: 0,
          isSwiping: false,
        })
        return
      }

      const systemInfo = wx.getSystemInfoSync()
      const screenWidth = systemInfo.windowWidth
      const threshold = screenWidth * 0.3 // Close if swiped more than 30% of screen width
      const currentTranslate = this.data.drawerTranslateX

      if (currentTranslate >= threshold) {
        // Swiped enough, close the drawer
        this.setData({
          drawerTranslateX: 0,
          isSwiping: false,
        })
        // Call onClose method (should be implemented by component)
        if (typeof (this as any).onClose === 'function') {
          ;(this as any).onClose()
        }
      } else {
        // Not enough, spring back
        this.setData({
          drawerTranslateX: 0,
          isSwiping: false,
        })
      }
    },
  },
})

