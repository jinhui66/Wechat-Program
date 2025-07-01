Page({
  data: {
    currentYear: 0,
    currentMonth: 0,
    calendarDays: [],
    selectedDate: '',
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    allTasks: [],
    filteredTasks: { 1: [], 2: [], 3: [], 4: [] },
    showAddModal: false,
    newTask: {
      name: '',
      quadrant: 1,
      repeatType: 0, // 0: 仅这天，1: 每天，2: 每周
      date: '',
      weekday: 0
    },
    quadrantOptions: ['紧急且重要', '不紧急但重要', '紧急但不重要', '不紧急不重要'],
    repeatOptions: ['仅这天', '每天', '每周某天'],
    weekdaysCN: ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  },

  onLoad() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const todayStr = this.formatDate(now);
    this.setData({ currentYear: year, currentMonth: month, selectedDate: todayStr }, () => {
      this.generateCalendar(year, month);
      this.loadTasks();
    });
  },

  prevMonth() {
    let year = this.data.currentYear;
    let month = this.data.currentMonth - 1;
  
    if (month < 0) {
      month = 11;
      year--;
    }
  
    this.setData({ currentYear: year, currentMonth: month }, () => {
      this.generateCalendar(year, month);
    });
  },
  
  nextMonth() {
    let year = this.data.currentYear;
    let month = this.data.currentMonth + 1;
  
    if (month > 11) {
      month = 0;
      year++;
    }
  
    this.setData({ currentYear: year, currentMonth: month }, () => {
      this.generateCalendar(year, month);
    });
  },

  onQuadrantChange(e) {
    this.setData({ 'newTask.quadrant': parseInt(e.detail.value) + 1 });
  },

  onRepeatChange(e) {
    this.setData({ 'newTask.repeatType': parseInt(e.detail.value) });
  },

  onPickDate(e) {
    this.setData({ 'newTask.date': e.detail.value });
  },

  onPickWeekday(e) {
    this.setData({ 'newTask.weekday': parseInt(e.detail.value) });
  },

  formatDate(date) {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  generateCalendar(year, month) {
    const firstDay = new Date(year, month, 1);
    const firstWeekDay = firstDay.getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const today = this.formatDate(new Date());
    const selected = this.data.selectedDate;

    const days = [];
    for (let i = 0; i < firstWeekDay; i++) {
      days.push({ day: '', date: '', isToday: false, isSelected: false });
    }
    for (let d = 1; d <= lastDate; d++) {
      const dateObj = new Date(year, month, d);
      const dateStr = this.formatDate(dateObj);
      days.push({
        day: d,
        date: dateStr,
        isToday: dateStr === today,
        isSelected: dateStr === selected
      });
    }
    this.setData({ calendarDays: days });
  },

  onCalendarTap(e) {
    const date = e.currentTarget.dataset.date;
    if (!date) return;
    this.setData({ selectedDate: date }, () => {
      const { currentYear, currentMonth } = this.data;
      this.generateCalendar(currentYear, currentMonth);
      this.filterTasks();
    });
  },

  openAddTaskModal() {
    const weekday = new Date(this.data.selectedDate).getDay();
    this.setData({
      showAddModal: true,
      newTask: {
        name: '',
        quadrant: 1,
        repeatType: 0,
        date: this.data.selectedDate,
        weekday
      }
    });
  },

  loadTasks() {
    const tasks = wx.getStorageSync('tasks') || [];
    this.setData({ allTasks: tasks }, this.filterTasks);
  },
  
  addTask() {
    const task = {
      ...this.data.newTask,
      id: Date.now(),
      // 移除 completed: false
      completions: [] // 新增完成记录数组
    };
    const allTasks = this.data.allTasks.concat(task);
    this.setData({
      allTasks,
      showAddModal: false
    }, () => {
      this.filterTasks();
      wx.setStorageSync('tasks', allTasks);
    });
  },
   
  cancelAddTask() {
    this.setData({ showAddModal: false });
  },


  onInputTaskName(e) {
    this.setData({ 'newTask.name': e.detail.value });
  },

  
  toggleTask(e) {
    const id = e.currentTarget.dataset.id;
    const today = this.data.selectedDate;
    
    const allTasks = this.data.allTasks.map(task => {
      if (task.id === id) {
        // 查找今天是否已有完成记录
        const index = task.completions?.findIndex(c => c.date === today) ?? -1;
        
        if (index >= 0) {
          // 如果已有记录，移除（表示未完成）
          task.completions.splice(index, 1);
        } else {
          // 如果没有记录，添加（表示完成）
          task.completions = task.completions || [];
          task.completions.push({ date: today });
        }
      }
      return task;
    });
  
    this.setData({ allTasks }, () => {
      this.filterTasks();
      wx.setStorageSync('tasks', allTasks);
    });
  },

  filterTasks() {
    const today = this.data.selectedDate;
    const weekday = new Date(today).getDay();
    const filtered = { 1: [], 2: [], 3: [], 4: [] };
    
    for (const task of this.data.allTasks || []) {
      const show =
        (task.repeatType === 0 && task.date === today) ||
        (task.repeatType === 1) ||
        (task.repeatType === 2 && task.weekday === weekday);
      
      if (show) {
        // 检查今天是否完成
        const isCompleted = task.completions?.some(c => c.date === today) ?? false;
        filtered[task.quadrant].push({
          ...task,
          completed: isCompleted // 动态计算完成状态
        });
      }
    }
    
    this.setData({ filteredTasks: filtered });
  },

  goToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const todayStr = this.formatDate(now);
  
    this.setData({
      currentYear: year,
      currentMonth: month,
      selectedDate: todayStr
    }, () => {
      this.generateCalendar(year, month);
      this.filterTasks();
    });
  },

  deleteTask(e) {
    const taskId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '删除任务',
      content: '确定要删除这个任务吗？',
      success: (res) => {
        if (res.confirm) {
          const allTasks = this.data.allTasks.filter(task => task.id !== taskId);
          this.setData({ allTasks }, () => {
            this.filterTasks(); // 重新过滤任务
            wx.setStorageSync('tasks', allTasks); // 更新本地存储
            wx.showToast({ title: '已删除', icon: 'success' });
          });
        }
      }
    });
  },
});