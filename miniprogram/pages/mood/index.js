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
    dayMoods: {},

    // 心情总结
    moodStats: [],  // 心情统计数据
    monthSummary: ''// 月度总结文本
  },
  

  goToToday() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    
    // 如果已经是当前月份，只需滚动到中间位置
    if (this.data.year === currentYear && this.data.month === currentMonth) {
      this.resetPosition();
      return;
    }
    
    // 更新到当前月份
    this.setData({
      year: currentYear,
      month: currentMonth,
      offsetX: -this.data.windowWidth,
      transition: 'transform 0.3s ease-out'
    }, () => {
      this.initCalendar();
    });
  },

  onLoad() {
    const { windowWidth } = wx.getSystemInfoSync();
    this.loadMoods();
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
  getMoodClass: function(mood) {
    if(!mood) return '';
    
    const moodMap = {
      '😊 开心': 'mood-happy',
      '😢 悲伤': 'mood-sad',
      '😴 困倦': 'mood-sleepy',
      '😡 生气': 'mood-angry',
      '😌 平静': 'mood-calm'
    };
    
    return moodMap[mood] || '';
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
      mood: this.data.dayMoods[`${year}-${month}-${day}`] || ''
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
    const threshold = this.data.windowWidth * 0.3;
    
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
      transition: 'transform 0.3s ease-out'
    });
    
    // 2. 在下一次渲染周期更新数据和位置
    setTimeout(() => {
      this.setData({
        year: newMonth.year,
        month: newMonth.month,
        offsetX: -this.data.windowWidth, // 新月份居中
        transition: 'none'
      }, () => {
        // 3. 更新日历数据
        this.initCalendar();
      });
    }, 300);
  },
  switchToNextMonth() {
    // 先设置动画滑动到右侧
    this.setData({
      offsetX: -this.data.windowWidth * 2,
      transition: 'transform 0.3s ease-out'
    });
  
    // 等动画完成后更新月份
    setTimeout(() => {
      const newMonth = this.getAdjacentMonth(1);
  
      this.setData({
        year: newMonth.year,
        month: newMonth.month,
        transition: 'none',
        offsetX: -this.data.windowWidth // 重置为中间位置，无动画
      }, () => {
        this.initCalendar();
      });
    }, 300); // 等待动画时间结束
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
  },

  initCalendar() {
    const { year, month } = this.data;
    this.setData({
      calendarDays: this.generateMonthDays(year, month),
      prevMonth: this.getAdjacentMonth(-1),
      nextMonth: this.getAdjacentMonth(1),
      prevMonthDays: this.generateMonthDays(this.getAdjacentMonth(-1).year, this.getAdjacentMonth(-1).month, false),
      nextMonthDays: this.generateMonthDays(this.getAdjacentMonth(1).year, this.getAdjacentMonth(1).month, false)
    }, () => {
      this.loadMoods();
      this.calculateMoodStats(); // 新增统计计算
    });
  },
  
  // 新增方法：计算心情统计
  calculateMoodStats() {
    const { year, month, dayMoods, moods } = this.data;
    const stats = {};
    let total = 0;
    
    // 初始化统计对象
    moods.forEach(mood => {
      if (mood !== '无心情') {
        stats[mood] = { count: 0, mood: mood };
      }
    });
    
    // 统计当月心情
    for (let day = 1; day <= 31; day++) {
      const dateKey = `${year}-${month}-${day}`;
      if (dayMoods[dateKey]) {
        const mood = dayMoods[dateKey];
        if (stats[mood]) {
          stats[mood].count++;
          total++;
        }
      }
    }
    
    // 计算百分比并添加颜色
    const moodColors = {
      '😊 开心': '#FFD700',
      '😢 悲伤': '#6495ED',
      '😴 困倦': '#9370DB',
      '😡 生气': '#FF6347',
      '😌 平静': '#3CB371'
    };
    
    const moodStats = Object.values(stats).map(item => {
      const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
      return {
        ...item,
        percentage: percentage,
        color: moodColors[item.mood] || '#CCCCCC'
      };
    });
    
    // 生成总结文本
    let summary = '';
    if (total === 0) {
      summary = '本月还没有记录心情哦～';
    } else {
      const topMood = moodStats.reduce((prev, current) => 
        (prev.count > current.count) ? prev : current
      );
      summary = `本月你最常感到${topMood.mood.split(' ')[1]}，共记录了${topMood.count}天。`;
    }
    
    this.setData({
      moodStats: moodStats,
      monthSummary: summary
    });
  }
  
});