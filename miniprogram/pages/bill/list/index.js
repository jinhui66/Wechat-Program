// list.js
// 获取数据库引用
const db = wx.cloud.database();
const _ = db.command; // 引入 command API

Page({
  data: {
    // 日历相关数据
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

    // 年月日选择器数据
    dateType: 'day', // 'year', 'month', 'day'
    years: [],
    months: Array.from({ length: 12 }, (v, i) => i + 1), // 1-12月
    selectedYearIndex: 0,
    selectedMonthIndex: 0,
    selectedDayIndex: 0,

    // 收入/支出/全部 筛选
    transactionType: 'all', // 'all', 'expense', 'income'

    // 账单数据
    allBills: [], // 存储所有账单
    filteredBills: [], // 存储筛选后的账单
    totalAmount: 0, // 当前显示账单的总金额
  },

  onLoad() {
    const { windowWidth } = wx.getSystemInfoSync();
    this.setData({
      windowWidth,
      offsetX: -windowWidth // 初始定位到当前月份
    }, () => {
      this.initCalendar();
      this.initDatePicker();
    });
  },

  onShow() {
    this.loadBills(); // 每次页面显示时加载最新账单
  },

  /**
   * 日历相关方法 (保持不变，或根据需要优化)
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
      this.filterBills(); // 日历初始化完成后，根据当前选中日期更新筛选和总金额
    });
  },

  generateMonthDays(year, month, isPreview = false) {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    let days = [];

    // 填充空白格
    for (let i = 0; i < startDay; i++) {
      days.push({ number: '' });
    }

    // 填充日期
    const maxDay = isPreview ? Math.min(7, daysInMonth) : daysInMonth;
    for (let day = 1; day <= maxDay; day++) {
      const dateStr = `${year}-${this.formatNumber(month)}-${this.formatNumber(day)}`;
      days.push({
        number: day,
        date: dateStr,
        isSelected: dateStr === this.data.selectedDate // 添加选中状态
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
      dateType: 'day' // 点击日期后，切换到按天筛选
    }, () => {
      this.initCalendar(); // 刷新日历以显示选中状态
      this.filterBills(); // 重新筛选账单
    });
  },

  // 格式化数字，用于日期补零
  formatNumber(n) {
    n = n.toString();
    return n[1] ? n : '0' + n;
  },

  /**
   * 年月日选择器相关方法
   */
  initDatePicker() {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 100 }, (v, i) => currentYear - 50 + i); // 假设从当前年份前后50年
    this.setData({
      years,
      selectedYearIndex: years.indexOf(currentYear),
      selectedMonthIndex: this.data.month - 1, // 月份是从0开始的索引
      selectedDayIndex: new Date(this.data.selectedDate).getDate() - 1 // 日期也是从0开始的索引
    });
  },

  // 选择年份
  bindYearChange(e) {
    const selectedYear = this.data.years[e.detail.value];
    this.setData({
      selectedYearIndex: e.detail.value,
      year: selectedYear,
      month: 1, // 选择年份后，月份重置为1月
      selectedMonthIndex: 0,
      dateType: 'year', // 切换到按年筛选
      selectedDate: `${selectedYear}-01-01` // 更新selectedDate，触发日历刷新和筛选
    }, () => {
      this.initCalendar();
      this.filterBills();
    });
  },

  // 选择月份
  bindMonthChange(e) {
    const selectedMonth = this.data.months[e.detail.value];
    this.setData({
      selectedMonthIndex: e.detail.value,
      month: selectedMonth,
      dateType: 'month', // 切换到按月筛选
      selectedDate: `${this.data.year}-${this.formatNumber(selectedMonth)}-01` // 更新selectedDate
    }, () => {
      this.initCalendar();
      this.filterBills();
    });
  },

  // 选择日期（用于 picker 筛选日期，与日历点击日期不同）
  bindDayChange(e) {
    const day = parseInt(e.detail.value) + 1; // picker value is 0-indexed
    const selectedDate = `${this.data.year}-${this.formatNumber(this.data.month)}-${this.formatNumber(day)}`;
    this.setData({
      selectedDayIndex: e.detail.value,
      selectedDate: selectedDate,
      dateType: 'day' // 切换到按天筛选
    }, () => {
      this.initCalendar(); // 刷新日历，确保选中状态正确显示
      this.filterBills(); // 重新筛选账单
    });
  },

  // 选择筛选类型 (年/月/日)
  changeDateType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      dateType: type
    }, () => {
      // 切换类型时，确保 selectedDate 对应当前类型
      const { year, month, selectedDate } = this.data;
      let newSelectedDate = selectedDate;
      if (type === 'year') {
        newSelectedDate = `${year}-01-01`;
      } else if (type === 'month') {
        newSelectedDate = `${year}-${this.formatNumber(month)}-01`;
      }
      this.setData({ selectedDate: newSelectedDate }, () => {
        this.filterBills();
      });
    });
  },

  // 切换收入/支出/全部筛选
  changeTransactionType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      transactionType: type
    }, () => {
      this.filterBills(); // 重新筛选账单
    });
  },

  /**
   * 账单数据相关方法
   */
  async loadBills() {
    wx.showLoading({
      title: '加载中...',
    });
    try {
      // 从云数据库获取所有账单，并按创建时间倒序排列
      const res = await db.collection('bills').orderBy('createTime', 'desc').get();
      this.setData({ allBills: res.data }, () => {
        this.filterBills(); // 加载所有账单后进行筛选
      });
      wx.hideLoading();
    } catch (err) {
      wx.hideLoading();
      console.error('加载账单失败：', err);
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
    }
  },

  filterBills() {
    const { allBills, dateType, selectedDate, year, month, transactionType } = this.data;
    let filtered = [];
    let total = 0;

    // 1. 根据日期类型筛选
    let dateFilteredBills = [];
    if (dateType === 'year') {
      dateFilteredBills = allBills.filter(bill => {
        return bill.date.startsWith(`${year}`);
      });
    } else if (dateType === 'month') {
      const monthStr = this.formatNumber(month);
      dateFilteredBills = allBills.filter(bill => {
        return bill.date.startsWith(`${year}-${monthStr}`);
      });
    } else {
      dateFilteredBills = allBills.filter(bill => bill.date === selectedDate);
    }

    // 2. 根据交易类型筛选
    if (transactionType === 'all') {
      filtered = dateFilteredBills;
    } else {
      filtered = dateFilteredBills.filter(bill => bill.type === transactionType);
    }

    // 3. 计算总金额
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
      total = incomeSum - expenseSum; // 显示净额
    } else if (transactionType === 'expense') {
      total = filtered.reduce((sum, bill) => sum + bill.amount, 0);
    } else if (transactionType === 'income') {
      total = filtered.reduce((sum, bill) => sum + bill.amount, 0);
    }

    this.setData({
      filteredBills: filtered,
      totalAmount: total
    });
  },

  getIcon(category, type) {
    const expenseMaps = {
      餐饮: '/assets/icons/food.webp',
      交通: '/assets/icons/transport.webp',
      购物: '/assets/icons/shop.webp',
      娱乐: '/assets/icons/entertainment.webp',
      住房: '/assets/icons/housing.webp',
      通讯: '/assets/icons/communication.webp',
      医疗: '/assets/icons/medical.webp',
      教育: '/assets/icons/education.webp',
      日常用品: '/assets/icons/daily_necessities.webp',
      其他支出: '/assets/icons/other.webp'
    };
    const incomeMaps = {
      工资: '/assets/icons/salary.webp',
      兼职: '/assets/icons/part_time.webp',
      理财: '/assets/icons/investment.webp',
      红包: '/assets/icons/red_packet.webp',
      其他收入: '/assets/icons/other_income.webp'
    };

    if (type === 'income') {
      return incomeMaps[category] || incomeMaps['其他收入'];
    } else {
      return expenseMaps[category] || expenseMaps['其他支出'];
    }
  },

  onLongPress(e) {
    const item = e.currentTarget.dataset.item; // 直接获取整个 item
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
    wx.showModal({
      title: '确认删除',
      content: `删除 ${itemToDelete.category} ¥${itemToDelete.amount}?`,
      success: async res => { // 使用 async 处理回调函数
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });
          try {
            // 根据 _id 删除云数据库中的记录
            await db.collection('bills').doc(itemToDelete._id).remove();

            // 删除成功后，重新加载账单数据并筛选
            this.loadBills();
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

  // 跳转到添加账单页面
  navigateToAddBill() {
    wx.navigateTo({
      url: '/pages/bill/add/index'
    });
  }
});