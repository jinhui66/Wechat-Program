Page({
  data: {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    daysOfWeek: ['日', '一', '二', '三', '四', '五', '六'],
    moods: ['😊 开心', '😢 悲伤', '😴 困倦', '😡 生气', '😌 平静', '无心情'],
    
    // 滑动相关
    windowWidth: 375,
    offsetX: -375,
    isSwiping: false,
    startX: 0,
    transition: 'none',
    
    // 日历数据
    calendarDays: [],
    prevMonth: {},
    nextMonth: {},
    prevMonthDays: [],
    nextMonthDays: [],
    
    // 心情选择
    showMoodDialog: false,
    selectedDate: null,
    dayMoods: {}
  },

  onLoad() {
    const { windowWidth } = wx.getSystemInfoSync();
    this.setData({ 
      windowWidth,
      offsetX: -windowWidth 
    }, () => {
      this.initCalendar();
    });
  },

  initCalendar() {
    const { year, month } = this.data;
    this.setData({
      calendarDays: this.generateMonthDays(year, month),
      prevMonth: this.getAdjacentMonth(-1),
      nextMonth: this.getAdjacentMonth(1),
      prevMonthDays: this.generateMonthDays(this.getAdjacentMonth(-1).year, this.getAdjacentMonth(-1).month, false),
      nextMonthDays: this.generateMonthDays(this.getAdjacentMonth(1).year, this.getAdjacentMonth(1).month, false)
    });
    this.loadMoods();
  },

  generateMonthDays(year, month, isPreview = false) {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const today = new Date();
    
    let days = [];
    
    // 填充空白格
    for (let i = 0; i < startDay; i++) {
      days.push({ number: '' });
    }
    
    // 填充日期
    const maxDay = isPreview ? Math.min(7, daysInMonth) : daysInMonth;
    for (let day = 1; day <= maxDay; day++) {
      const isToday = !isPreview && 
                     year === today.getFullYear() && 
                     month === today.getMonth() + 1 && 
                     day === today.getDate();
      
      days.push({
        number: day,
        isToday,
        date: `${year}-${month}-${day}`,
        mood: isPreview ? '' : (this.data.dayMoods[`${year}-${month}-${day}`] || '')
      });
    }
    
    return days;
  },

  getAdjacentMonth(step) {
    let { year, month } = this.data;
    month += step;
    
    if (month > 12) {
      month = 1;
      year++;
    } else if (month < 1) {
      month = 12;
      year--;
    }
    
    return { year, month };
  },

  prepareAdjacentMonths() {
    this.setData({
      prevMonth: this.getAdjacentMonth(-1),
      nextMonth: this.getAdjacentMonth(1),
      prevMonthDays: this.generateMonthDays(this.getAdjacentMonth(-1).year, this.getAdjacentMonth(-1).month, false),
      nextMonthDays: this.generateMonthDays(this.getAdjacentMonth(1).year, this.getAdjacentMonth(1).month, false)
    });
  },

  // 修改后的触摸事件处理
  handleTouchStart(e) {
    this.setData({
      startX: e.touches[0].clientX,
      isSwiping: true,
      transition: 'none'
    });
  },

  handleTouchMove(e) {
    if (!this.data.isSwiping) return;
    
    const deltaX = e.touches[0].clientX - this.data.startX;
    let newOffset = -this.data.windowWidth + deltaX;
    
    // 边界检查
    newOffset = Math.max(-this.data.windowWidth * 2, Math.min(newOffset, 0));
    
    this.setData({ offsetX: newOffset });
  },

  // 修改后的触摸结束处理
  handleTouchEnd(e) {
    if (!this.data.isSwiping) return;
    
    const deltaX = e.changedTouches[0].clientX - this.data.startX;
    const threshold = this.data.windowWidth * 0.4;
    
    if (deltaX > threshold) {
      // 向右滑动，切换到上个月
      this.switchToPrevMonth();
    } else if (deltaX < -threshold) {
      // 向左滑动，切换到下个月
      this.switchToNextMonth();
    } else {
      // 未达到阈值，回弹到当前月份
      this.resetPosition();
    }
    
    this.setData({ isSwiping: false });
  },
  switchToPrevMonth() {
    const newMonth = this.getAdjacentMonth(-1);
    
    // 1. 先无动画切换到目标位置
    this.setData({
      offsetX: 0, // 直接定位到上个月视图
      transition: 'none'
    });
    
    // 2. 在下一次渲染周期更新数据和位置
    setTimeout(() => {
      this.setData({
        year: newMonth.year,
        month: newMonth.month,
        offsetX: -this.data.windowWidth, // 新月份居中
        transition: 'transform 0.3s ease-out'
      }, () => {
        // 3. 更新日历数据
        this.initCalendar();
      });
    }, 20);
  },

  switchToNextMonth() {
    const newMonth = this.getAdjacentMonth(1);
    
    // 1. 先无动画切换到目标位置
    this.setData({
      offsetX: -this.data.windowWidth * 2, // 直接定位到下个月视图
      transition: 'none'
    });
    
    // 2. 在下一次渲染周期更新数据和位置
    setTimeout(() => {
      this.setData({
        year: newMonth.year,
        month: newMonth.month,
        offsetX: -this.data.windowWidth, // 新月份居中
        transition: 'transform 0.3s ease-out'
      }, () => {
        // 3. 更新日历数据
        this.initCalendar();
      });
    }, 20);
  },


  resetPosition() {
    this.setData({
      offsetX: -this.data.windowWidth,
      transition: 'transform 0.3s ease-out'
    });
  },

  // 心情选择功能保持不变
  handleDayTap(e) {
    const date = e.currentTarget.dataset.date;
    if (!date) return;
    
    this.setData({
      showMoodDialog: true,
      selectedDate: date
    });
  },

  selectMood(e) {
    const index = e.currentTarget.dataset.index;
    const mood = this.data.moods[index];
    const { selectedDate } = this.data;
    
    const newDayMoods = { ...this.data.dayMoods };
    
    if (mood === '无心情') {
      delete newDayMoods[selectedDate];
    } else {
      newDayMoods[selectedDate] = mood;
    }
    
    this.setData({
      dayMoods: newDayMoods,
      showMoodDialog: false
    }, () => {
      this.saveMoods();
      this.initCalendar();
    });
  },

  loadMoods() {
    const moods = wx.getStorageSync('dayMoods') || {};
    this.setData({ dayMoods: moods });
  },

  saveMoods() {
    wx.setStorageSync('dayMoods', this.data.dayMoods);
  }
});