Page({
    data: {
      currentTime: '25:00',
      workTime: 25,
      restTime: 5,
      isWorking: false,
      isResting: false,
      btnText: '开始专注',
      statusText: '准备开始',
      timer: null,
      remainingSeconds: 0
    },
  
    onLoad() {
      this.initTimer(this.data.workTime * 60);
    },
  
    initTimer(seconds) {
      const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
      const secs = (seconds % 60).toString().padStart(2, '0');
      this.setData({
        currentTime: `${mins}:${secs}`,
        remainingSeconds: seconds
      });
    },
  
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
        this.setData({ restTime: this.data.restTime - 1 });
      }
    },
  
    increaseRestTime() {
      if (this.data.restTime < 30 && !this.data.isWorking) {
        this.setData({ restTime: this.data.restTime + 1 });
      }
    },
  
    toggleTimer() {
      if (this.data.isWorking || this.data.isResting) {
        this.pauseTimer();
      } else {
        // 继续时从 remainingSeconds 开始，而不是 workTime * 60
        if (this.data.remainingSeconds <= 0) {
          this.startWork(); // 如果时间为0，重新开始
        } else {
          this.resumeTimer(); // 否则从剩余时间继续
        }
      }
    },
  
    // 新增：从剩余时间继续
    resumeTimer() {
      this.clearTimer();
      const seconds = this.data.remainingSeconds;
      this.setData({
        isWorking: !this.data.isResting, // 恢复之前的状态
        isResting: this.data.isResting,
        btnText: '暂停',
        statusText: this.data.isResting ? '休息中' : '专注中'
      });
      this.startCountdown(seconds);
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
      // 注意：这里不修改 remainingSeconds，保留暂停时的值
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
      this.setData({ currentTime: `${mins}:${secs}` });
    },
  
    timeUp() {
      this.clearTimer();
      wx.vibrateShort();
      if (this.data.isWorking) {
        wx.showToast({ title: '专注结束，开始休息', icon: 'none' });
        this.startRest();
      } else {
        wx.showToast({ title: '休息结束', icon: 'none' });
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
  
    onUnload() {
      this.clearTimer();
    }
  });