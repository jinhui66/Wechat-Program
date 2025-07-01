// pages/alarm/index.js
Page({
    data: {
      // 时间设置
      workTime: 25,         // 默认专注时长（分钟）
      restTime: 5,          // 默认休息时长（分钟）
      currentTime: '25:00', // 当前显示时间
      remainingSeconds: 0,  // 剩余秒数（内部计算用）
      
      // 状态控制
      isWorking: false,     // 是否专注中
      isResting: false,     // 是否休息中
      btnText: '开始专注',  // 主按钮文字
      timer: null,          // 计时器对象
      
      // 样式控制
      statusText: '准备开始' // 状态提示文本
    },
  
    // 页面加载初始化
    onLoad() {
      this.initTimer(this.data.workTime * 60);
    },
  
    // 初始化时间显示
    initTimer(seconds) {
      const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
      const secs = (seconds % 60).toString().padStart(2, '0');
      this.setData({
        currentTime: `${mins}:${secs}`,
        remainingSeconds: seconds
      });
    },
  
    // ======================
    // 时间调整方法
    // ======================
    decreaseWorkTime() {
      if (this.data.workTime > 1 && !this.data.isWorking) {
        this.setData({ 
          workTime: this.data.workTime - 1 
        }, () => {
          this.initTimer(this.data.workTime * 60);
        });
      }
    },
  
    increaseWorkTime() {
      if (this.data.workTime < 60 && !this.data.isWorking) {
        this.setData({ 
          workTime: this.data.workTime + 1 
        }, () => {
          this.initTimer(this.data.workTime * 60);
        });
      }
    },
  
    decreaseRestTime() {
      if (this.data.restTime > 1 && !this.data.isWorking) {
        this.setData({ 
          restTime: this.data.restTime - 1 
        });
      }
    },
  
    increaseRestTime() {
      if (this.data.restTime < 30 && !this.data.isWorking) {
        this.setData({ 
          restTime: this.data.restTime + 1 
        });
      }
    },
  
    // ======================
    // 计时器控制
    // ======================
    toggleTimer() {
      if (this.data.isWorking || this.data.isResting) {
        this.pauseTimer();
      } else {
        this.startWork();
      }
    },
  
    startWork() {
      this.clearTimer();
      const seconds = this.data.workTime * 60;
      
      this.setData({
        isWorking: true,
        isResting: false,
        btnText: '暂停',
        statusText: '专注中',
        remainingSeconds: seconds
      });
      
      this.startCountdown(seconds);
    },
  
    startRest() {
      this.clearTimer();
      const seconds = this.data.restTime * 60;
      
      this.setData({
        isWorking: false,
        isResting: true,
        btnText: '暂停',
        statusText: '休息中',
        remainingSeconds: seconds
      });
      
      this.startCountdown(seconds);
    },
  
    pauseTimer() {
      this.clearTimer();
      this.setData({
        isWorking: false,
        isResting: false,
        btnText: '继续专注',
        statusText: '已暂停'
      });
    },
  
    startCountdown(seconds) {
      this.updateTimeDisplay(seconds);
      
      this.data.timer = setInterval(() => {
        let remaining = this.data.remainingSeconds - 1;
        
        if (remaining <= 0) {
          this.timeUp();
          return;
        }
  
        this.setData({ remainingSeconds: remaining });
        this.updateTimeDisplay(remaining);
      }, 1000);
    },
  
    updateTimeDisplay(seconds) {
      const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
      const secs = (seconds % 60).toString().padStart(2, '0');
      this.setData({
        currentTime: `${mins}:${secs}`
      });
    },
  
    timeUp() {
      this.clearTimer();
      wx.vibrateShort(); // 震动反馈
      
      if (this.data.isWorking) {
        wx.showToast({
          title: '专注结束，开始休息',
          icon: 'success'
        });
        this.startRest();
      } else {
        wx.showToast({
          title: '休息结束，准备专注',
          icon: 'success'
        });
        this.setData({
          isResting: false,
          btnText: '开始专注',
          statusText: '准备开始'
        });
        this.initTimer(this.data.workTime * 60);
      }
    },
  
    clearTimer() {
      if (this.data.timer) {
        clearInterval(this.data.timer);
        this.setData({ timer: null });
      }
    },
  
    // 页面卸载时清理
    onUnload() {
      this.clearTimer();
    },
    
    // 返回按钮处理
    navigateBack() {
      wx.navigateBack();
    }
  });