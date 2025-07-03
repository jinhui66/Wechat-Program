Page({
  data: {
    nickName: '游客',
    avatarUrl: '/images/index/lion.png',
    moodStats: [],
    monthSummary: '',
    incompleteTasks: [],
    quadrantOptions: ['紧急且重要', '不紧急但重要', '紧急但不重要', '不紧急不重要']
  },

  onLoad() {
    this.getUserInfo();
  },

  onShow() {
    this.calculateMoodStats();
    this.loadIncompleteTasks();
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
