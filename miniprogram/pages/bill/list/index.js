// list.js

// 获取数据库引用
const db = wx.cloud.database();
const _ = db.command; // 引入 command API

Page({
  data: {
    // ... (原有日历相关数据保持不变)
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    selectedDate: new Date().toISOString().slice(0, 10), // 默认选中今天
    daysOfWeek: ['日', '一', '二', '三', '四', '五', '六'],
    calendarDays: [],
    prevMonth: {},
    nextMonth: {},
    prevMonthDays: [],
    nextMonthDays: [],
    windowWidth: 0,
    offsetX: 0,
    isSwiping: false,
    startX: 0,
    transition: 'none',

    // ... (原有选择器数据保持不变)
    dateType: 'day',
    years: [],
    months: Array.from({ length: 12 }, (v, i) => i + 1),
    selectedYearIndex: 0,
    selectedMonthIndex: 0,
    selectedDayIndex: 0,

    // ... (原有筛选数据保持不变)
    transactionType: 'all',

    // 账单数据
    allBills: [],
    filteredBills: [],
    totalAmount: 0,

    // --- 新增数据 ---
    transactionMarkers: {}, // 用于存储日历上每天的收支标记
    expandedBillId: null,   // 用于记录当前展开的账单项的 _id
  },

  onLoad() {
    const { windowWidth } = wx.getWindowInfo();
    this.setData({
      windowWidth,
      offsetX: -windowWidth
    }, () => {
      this.initCalendar();
      this.initDatePicker();
    });
  },

  onShow() {
    this.loadBills(); // 每次页面显示时加载最新账单
  },

  /**
   * 日历相关方法
   */
  initCalendar() {
    const { year, month } = this.data;
    this.setData({
      calendarDays: this.generateMonthDays(year, month),
      prevMonth: this.getAdjacentMonth(-1),
      nextMonth: this.getAdjacentMonth(1),
      prevMonthDays: this.generateMonthDays(this.getAdjacentMonth(-1).year, this.getAdjacentMonth(-1).month, false),
      nextMonthDays: this.generateMonthDays(this.getAdjacentMonth(1).year, this.getAdjacentMonth(1).month, false)
    }, () => {
      this.filterBills();
    });
  },

  // --- 修改: generateMonthDays ---
  // 在生成日期时，附加上收支标记
  generateMonthDays(year, month, isPreview = false) {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    let days = [];

    for (let i = 0; i < startDay; i++) {
      days.push({ number: '' });
    }

    const maxDay = isPreview ? Math.min(7, daysInMonth) : daysInMonth;
    for (let day = 1; day <= maxDay; day++) {
      const dateStr = `${year}-${this.formatNumber(month)}-${this.formatNumber(day)}`;
      const markers = this.data.transactionMarkers[dateStr] || {}; // 获取标记
      days.push({
        number: day,
        date: dateStr,
        isSelected: dateStr === this.data.selectedDate,
        hasIncome: markers.hasIncome || false,   // 附加收入标记
        hasExpense: markers.hasExpense || false, // 附加支出标记
      });
    }
    return days;
  },

  // ... (getAdjacentMonth, prepareAdjacentMonths, handleTouch..., switchTo... 等方法保持不变)
  
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

    newOffset = Math.max(-this.data.windowWidth * 2, Math.min(newOffset, 0));

    this.setData({ offsetX: newOffset });
  },

  handleTouchEnd(e) {
    if (!this.data.isSwiping) return;

    const deltaX = e.changedTouches[0].clientX - this.data.startX;
    const threshold = this.data.windowWidth * 0.3;

    if (deltaX > threshold) {
      this.switchToPrevMonth();
    } else if (deltaX < -threshold) {
      this.switchToNextMonth();
    } else {
      this.resetPosition();
    }

    this.setData({ isSwiping: false });
  },

  switchToPrevMonth() {
    const newMonth = this.getAdjacentMonth(-1);

    this.setData({
      offsetX: 0,
      transition: 'transform 0.3s ease-out'
    });

    setTimeout(() => {
      this.setData({
        year: newMonth.year,
        month: newMonth.month,
        offsetX: -this.data.windowWidth,
        transition: 'none'
      }, () => {
        this.initCalendar();
      });
    }, 300);
  },

  switchToNextMonth() {
    this.setData({
      offsetX: -this.data.windowWidth * 2,
      transition: 'transform 0.3s ease-out'
    });

    setTimeout(() => {
      const newMonth = this.getAdjacentMonth(1);
      this.setData({
        year: newMonth.year,
        month: newMonth.month,
        transition: 'none',
        offsetX: -this.data.windowWidth
      }, () => {
        this.initCalendar();
      });
    }, 300);
  },

  resetPosition() {
    this.setData({
      offsetX: -this.data.windowWidth,
      transition: 'transform 0.3s ease-out'
    });
  },
  
  handleDayTap(e) {
    const date = e.currentTarget.dataset.date;
    if (!date) return;
    this.setData({
      selectedDate: date,
      dateType: 'day'
    }, () => {
      this.initCalendar();
      this.filterBills();
    });
  },

  formatNumber(n) {
    n = n.toString();
    return n[1] ? n : '0' + n;
  },

  /**
   * 年月日选择器相关方法 (保持不变)
   */
  initDatePicker() {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 100 }, (v, i) => currentYear - 50 + i);
    this.setData({
      years,
      selectedYearIndex: years.indexOf(currentYear),
      selectedMonthIndex: this.data.month - 1,
      selectedDayIndex: new Date(this.data.selectedDate).getDate() - 1
    });
  },

  bindYearChange(e) {
    const selectedYear = this.data.years[e.detail.value];
    this.setData({
      selectedYearIndex: e.detail.value,
      year: selectedYear,
      month: 1,
      selectedMonthIndex: 0,
      dateType: 'year',
      selectedDate: `${selectedYear}-01-01`
    }, () => {
      this.initCalendar();
      this.filterBills();
    });
  },

  bindMonthChange(e) {
    const selectedMonth = this.data.months[e.detail.value];
    this.setData({
      selectedMonthIndex: e.detail.value,
      month: selectedMonth,
      dateType: 'month',
      selectedDate: `${this.data.year}-${this.formatNumber(selectedMonth)}-01`
    }, () => {
      this.initCalendar();
      this.filterBills();
    });
  },

  bindDayChange(e) {
    const day = parseInt(e.detail.value) + 1;
    const selectedDate = `${this.data.year}-${this.formatNumber(this.data.month)}-${this.formatNumber(day)}`;
    this.setData({
      selectedDayIndex: e.detail.value,
      selectedDate: selectedDate,
      dateType: 'day'
    }, () => {
      this.initCalendar();
      this.filterBills();
    });
  },

  changeDateType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ dateType: type }, () => {
      const { year, month, selectedDate } = this.data;
      let newSelectedDate = selectedDate;
      if (type === 'year') {
        newSelectedDate = `${year}-01-01`;
      } else if (type === 'month') {
        newSelectedDate = `${year}-${this.formatNumber(month)}-01`;
      }
      this.setData({ selectedDate: newSelectedDate }, () => this.filterBills());
    });
  },

  changeTransactionType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ transactionType: type }, () => this.filterBills());
  },

  /**
   * 账单数据相关方法
   */
  // --- 修改: loadBills ---
  // 加载数据后，调用 processTransactionMarkers 和 initCalendar
  async loadBills() {
    wx.showLoading({ title: '加载中...' });
    try {
      const res = await db.collection('bills').orderBy('createTime', 'desc').get();
      this.setData({ allBills: res.data }, () => {
        this.processTransactionMarkers(); // 1. 生成标记
        this.initCalendar();              // 2. 使用标记重新渲染日历
        this.filterBills();               // 3. 筛选列表
      });
      wx.hideLoading();
    } catch (err) {
      wx.hideLoading();
      console.error('加载账单失败：', err);
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
    }
  },

  // --- 新增: processTransactionMarkers ---
  // 处理所有账单，生成日历标记
  processTransactionMarkers() {
    const { allBills } = this.data;
    const markers = {};
    allBills.forEach(bill => {
      const date = bill.date;
      if (!markers[date]) {
        markers[date] = { hasIncome: false, hasExpense: false };
      }
      if (bill.type === 'income') {
        markers[date].hasIncome = true;
      } else if (bill.type === 'expense') {
        markers[date].hasExpense = true;
      }
    });
    this.setData({ transactionMarkers: markers });
  },

  filterBills() {
    // ... (此方法保持不变)
    const { allBills, dateType, selectedDate, year, month, transactionType } = this.data;
    let filtered = [];
    let total = 0;

    let dateFilteredBills = [];
    if (dateType === 'year') {
      dateFilteredBills = allBills.filter(bill => bill.date.startsWith(`${year}`));
    } else if (dateType === 'month') {
      const monthStr = this.formatNumber(month);
      dateFilteredBills = allBills.filter(bill => bill.date.startsWith(`${year}-${monthStr}`));
    } else {
      dateFilteredBills = allBills.filter(bill => bill.date === selectedDate);
    }

    if (transactionType === 'all') {
      filtered = dateFilteredBills;
    } else {
      filtered = dateFilteredBills.filter(bill => bill.type === transactionType);
    }

    if (transactionType === 'all') {
      let incomeSum = 0;
      let expenseSum = 0;
      filtered.forEach(bill => {
        if (bill.type === 'income') {
          incomeSum += bill.amount;
        } else {
          expenseSum += bill.amount;
        }
      });
      total = incomeSum - expenseSum;
    } else {
      total = filtered.reduce((sum, bill) => sum + bill.amount, 0);
    }

    this.setData({
      filteredBills: filtered,
      totalAmount: total
    });
  },
  
  // --- 新增: handleBillTap ---
  // 处理账单条目的单击事件
  handleBillTap(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({
      // 如果点击的是已经展开的项，则将 expandedBillId 设为 null (折叠)
      // 否则，设置为当前点击项的 id (展开)
      expandedBillId: this.data.expandedBillId === id ? null : id
    });
  },

  onLongPress(e) {
    // ... (此方法保持不变)
    const item = e.currentTarget.dataset.item;
    wx.showActionSheet({
      itemList: ['删除'],
      success: res => {
        if (res.tapIndex === 0) {
          this.deleteBill(item);
        }
      }
    });
  },

  async deleteBill(itemToDelete) {
    // ... (此方法保持不变)
    wx.showModal({
      title: '确认删除',
      content: `删除 ${itemToDelete.category} ¥${itemToDelete.amount}?`,
      success: async res => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });
          try {
            await db.collection('bills').doc(itemToDelete._id).remove();
            this.loadBills(); // 删除后重新加载所有数据
            wx.hideLoading();
            wx.showToast({ title: '已删除', icon: 'success' });
          } catch (err) {
            wx.hideLoading();
            console.error('删除账单失败：', err);
            wx.showToast({ title: '删除失败，请重试', icon: 'none' });
          }
        }
      }
    });
  },

  navigateToAddBill() {
    // ... (此方法保持不变)
    wx.navigateTo({
      url: '/pages/bill/add/index'
    });
  }
});