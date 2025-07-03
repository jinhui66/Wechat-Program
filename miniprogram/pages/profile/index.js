const getBillByIndex = require('../bill/billFunctions/getBillByIndex.js');
const getBillCount = require('../bill/billFunctions/getBillCount.js');

Page({
  data: {
    nickName: '游客',
    avatarUrl: '/images/index/lion.png',
    moodStats: [],
    monthSummary: '',
    incompleteTasks: [],
    bills: [],               // 新增：账单列表
    quadrantOptions: ['紧急且重要', '不紧急但重要', '紧急但不重要', '不紧急不重要'],
    incomeYear: 0,
    expenseYear: 0,
    incomeMonth: 0,
    expenseMonth: 0,
    incomeToday: 0,
    expenseToday: 0,
  },

  onLoad() {
    this.getUserInfo();
  },

  onShow() {
    this.calculateMoodStats();
    this.loadIncompleteTasks();
    this.loadBills();         // 新增：加载账单数据
  },

  getUserInfo() {
    wx.getUserProfile({
      desc: '用于展示用户头像和昵称',
      success: (res) => {
        const { nickName, avatarUrl } = res.userInfo;
        this.setData({ nickName, avatarUrl });
      },
      fail: () => {
        console.log('用户拒绝授权');
      }
    });
  },
  calculateBillSummary() {
    const bills = this.data.bills;
  
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const todayStr = this.formatDate(now); // yyyy-mm-dd
  
    let incomeYear = 0, expenseYear = 0;
    let incomeMonth = 0, expenseMonth = 0;
    let incomeToday = 0, expenseToday = 0;
  
    bills.forEach(bill => {
      if (!bill.createTime) return;
  
      const date = new Date(bill.date);
      const y = date.getFullYear();
      const m = date.getMonth() + 1;
      const dStr = this.formatDate(date);
  
      // 收入还是支出根据字段判定，bill.type==='income'/'expense'
      
      if (y === year) {
        if (bill.type == "income") incomeYear += bill.amount;
        else expenseYear += -bill.amount;
      }
      if (y === year && m === month) {
        if (bill.type == "income") incomeMonth += bill.amount;
        else expenseMonth += -bill.amount;
      }
      if (dStr === todayStr) {
        if (bill.type == "income") incomeToday += bill.amount;
        else expenseToday += -bill.amount;
      }
    });
  
    this.setData({
      incomeYear,
      expenseYear,
      incomeMonth,
      expenseMonth,
      incomeToday,
      expenseToday,
    });
  },
  
  calculateMoodStats() {
    const dayMoods = wx.getStorageSync('dayMoods') || {};
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const moods = ['😊 开心', '😢 悲伤', '😴 困倦', '😡 生气', '😌 平静'];
    const moodColors = {
      '😊 开心': '#FFD700',
      '😢 悲伤': '#6495ED',
      '😴 困倦': '#9370DB',
      '😡 生气': '#FF6347',
      '😌 平静': '#3CB371'
    };

    let stats = {};
    moods.forEach(mood => stats[mood] = { count: 0, mood });
    let total = 0;

    for (let day = 1; day <= 31; day++) {
      const key = `${year}-${month}-${day}`;
      const mood = dayMoods[key];
      if (moods.includes(mood)) {
        stats[mood].count++;
        total++;
      }
    }

    const moodStats = Object.values(stats).map(item => {
      const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
      return {
        ...item,
        percentage,
        color: moodColors[item.mood]
      };
    });

    let summary = '本月还没有记录心情哦～';
    if (total > 0) {
      const topMood = moodStats.reduce((a, b) => a.count > b.count ? a : b);
      summary = `本月你最常感到${topMood.mood.split(' ')[1]}，共记录了${topMood.count}天。`;
    }

    this.setData({
      moodStats,
      monthSummary: summary
    });
  },

  loadIncompleteTasks() {
    const allTasks = wx.getStorageSync('tasks') || [];
    const today = this.formatDate(new Date());
    const weekday = new Date().getDay();

    const incompleteTasks = allTasks.filter(task => {
      const show =
        (task.repeatType === 0 && task.date === today) ||
        (task.repeatType === 1) ||
        (task.repeatType === 2 && task.weekday === weekday);

      const completedToday = task.completions?.some(c => c.date === today);
      return show && !completedToday;
    });

    this.setData({ incompleteTasks });
  },

  formatDate(date) {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  formatTimestamp(ts) {
    if (!ts) return '';
    const date = new Date(ts);
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  // 新增：加载全部账单数据
  async loadBills() {
    try {
      const count = await getBillCount();
      let bills = [];
  
      for (let i = 0; i < count; i++) {
        const bill = await getBillByIndex(i);
        if (bill) bills.push({
          ...bill,
          formattedDate: this.formatTimestamp(bill.createTime)
        });
      }
  
      this.setData({ bills }, () => {
        this.calculateBillSummary();  // 计算统计数据
      });
  
    } catch (err) {
      console.error('加载账单失败', err);
    }
  },
  

  onShareAppMessage() {
    return {
      title: '这是我的个人空间，欢迎来看看 📘',
      path: '/pages/profile/index',
      imageUrl: '/images/index/lion.png'
    };
  },

  onShareTimeline() {
    return {
      title: '这是我的个人空间，欢迎来看看 📘',
      query: '',
      imageUrl: '/images/index/lion.png'
    };
  }
});
