Page({
  // 页面初始数据
  data: {
    currentYear: 0,           // 当前显示的年
    currentMonth: 0,          // 当前显示的月（0-11）
    calendarDays: [],         // 日历天数数组（用于渲染日历）
    selectedDate: '',         // 当前选中的日期（YYYY-MM-DD格式）
    weekdays: ['日', '一', '二', '三', '四', '五', '六'], // 星期缩写
    allTasks: [],             // 所有任务数据
    filteredTasks: { 1: [], 2: [], 3: [], 4: [] }, // 按象限分类的过滤后任务
    showAddModal: false,      // 是否显示添加任务弹窗
    newTask: {                // 新任务表单数据
      name: '',               // 任务名称
      quadrant: 1,            // 象限（1-4）
      repeatType: 0,          // 重复类型 0:仅这天 1:每天 2:每周
      date: '',               // 任务日期（YYYY-MM-DD）
      weekday: 0              // 周几（0-6）
    },
    quadrantOptions: ['紧急且重要', '不紧急但重要', '紧急但不重要', '不紧急不重要'], // 象限选项
    repeatOptions: ['仅这天', '每天', '每周某天'], // 重复类型选项
    weekdaysCN: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'] // 完整星期名称
  },

  // 页面加载时执行
  onLoad() {
    const now = new Date();  // 获取当前日期
    const year = now.getFullYear();
    const month = now.getMonth();
    const todayStr = this.formatDate(now);  // 格式化当前日期
    
    // 设置初始年月和选中日期，然后生成日历和加载任务
    this.setData({ 
      currentYear: year, 
      currentMonth: month, 
      selectedDate: todayStr 
    }, () => {
      this.generateCalendar(year, month);  // 生成日历数据
      this.loadTasks();                   // 加载任务数据
    });
  },

  // 切换到上个月
  prevMonth() {
    let year = this.data.currentYear;
    let month = this.data.currentMonth - 1;
  
    // 处理跨年情况
    if (month < 0) {
      month = 11;
      year--;
    }
  
    // 更新年月并重新生成日历
    this.setData({ currentYear: year, currentMonth: month }, () => {
      this.generateCalendar(year, month);
    });
  },
  
  // 切换到下个月
  nextMonth() {
    let year = this.data.currentYear;
    let month = this.data.currentMonth + 1;
  
    // 处理跨年情况
    if (month > 11) {
      month = 0;
      year++;
    }
  
    // 更新年月并重新生成日历
    this.setData({ currentYear: year, currentMonth: month }, () => {
      this.generateCalendar(year, month);
    });
  },

  // 象限选择变化
  onQuadrantChange(e) {
    // 将选择的值转为数字并+1（因为quadrant是1-4）
    this.setData({ 'newTask.quadrant': parseInt(e.detail.value) + 1 });
  },

  // 重复类型选择变化
  onRepeatChange(e) {
    this.setData({ 'newTask.repeatType': parseInt(e.detail.value) });
  },

  // 日期选择变化
  onPickDate(e) {
    this.setData({ 'newTask.date': e.detail.value });
  },

  // 星期选择变化
  onPickWeekday(e) {
    this.setData({ 'newTask.weekday': parseInt(e.detail.value) });
  },

  // 格式化日期为YYYY-MM-DD
  formatDate(date) {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0'); // 补零
    const d = date.getDate().toString().padStart(2, '0');         // 补零
    return `${y}-${m}-${d}`;
  },

  // 生成日历数据
  generateCalendar(year, month) {
    const firstDay = new Date(year, month, 1);       // 当月第一天
    const firstWeekDay = firstDay.getDay();          // 第一天是周几（0-6）
    const lastDate = new Date(year, month + 1, 0).getDate(); // 当月最后一天
    const today = this.formatDate(new Date());       // 今天的日期字符串
    const selected = this.data.selectedDate;         // 当前选中的日期

    const days = [];
    // 填充上个月的空格
    for (let i = 0; i < firstWeekDay; i++) {
      days.push({ day: '', date: '', isToday: false, isSelected: false });
    }
    // 填充当月的日期
    for (let d = 1; d <= lastDate; d++) {
      const dateObj = new Date(year, month, d);
      const dateStr = this.formatDate(dateObj);
      days.push({
        day: d,                                      // 日期数字
        date: dateStr,                               // 完整日期字符串
        isToday: dateStr === today,                  // 是否是今天
        isSelected: dateStr === selected             // 是否被选中
      });
    }
    this.setData({ calendarDays: days });  // 更新日历数据
  },

  // 点击日历日期
  onCalendarTap(e) {
    const date = e.currentTarget.dataset.date;
    if (!date) return;  // 空白格不处理
    
    // 更新选中日期并重新生成日历和过滤任务
    this.setData({ selectedDate: date }, () => {
      const { currentYear, currentMonth } = this.data;
      this.generateCalendar(currentYear, currentMonth);
      this.filterTasks();
    });
  },

  // 打开添加任务弹窗
  openAddTaskModal() {
    const weekday = new Date(this.data.selectedDate).getDay(); // 获取选中日期的星期
    
    // 初始化新任务表单
    this.setData({
      showAddModal: true,
      newTask: {
        name: '',
        quadrant: 1,
        repeatType: 0,
        date: this.data.selectedDate,  // 默认选中当前日期
        weekday                        // 默认选中当前星期
      }
    });
  },

  // 从本地存储加载任务
  loadTasks() {
    const tasks = wx.getStorageSync('tasks') || [];  // 获取任务数据，默认为空数组
    this.setData({ allTasks: tasks }, this.filterTasks);  // 更新数据并过滤任务
  },
  
  // 添加新任务
  addTask() {
    const task = {
      ...this.data.newTask,     // 展开表单数据
      id: Date.now(),           // 使用时间戳作为唯一ID
      completions: []           // 初始化完成记录数组
    };
    const allTasks = this.data.allTasks.concat(task);  // 添加新任务
    
    // 更新数据，关闭弹窗，并保存到本地存储
    this.setData({
      allTasks,
      showAddModal: false
    }, () => {
      this.filterTasks();  // 重新过滤任务
      wx.setStorageSync('tasks', allTasks);  // 保存到本地
    });
  },
   
  // 取消添加任务
  cancelAddTask() {
    this.setData({ showAddModal: false });  // 直接关闭弹窗
  },

  // 任务名称输入
  onInputTaskName(e) {
    this.setData({ 'newTask.name': e.detail.value });  // 更新任务名称
  },

  // 切换任务完成状态
  toggleTask(e) {
    const id = e.currentTarget.dataset.id;  // 获取任务ID
    const today = this.data.selectedDate;   // 当前选中日期
    
    // 遍历所有任务，更新指定任务的完成状态
    const allTasks = this.data.allTasks.map(task => {
      if (task.id === id) {
        // 查找今天是否已有完成记录
        const index = task.completions?.findIndex(c => c.date === today) ?? -1;
        
        if (index >= 0) {
          // 如果已有记录，移除（表示未完成）
          task.completions.splice(index, 1);
        } else {
          // 如果没有记录，添加（表示完成）
          task.completions = task.completions || [];  // 确保数组存在
          task.completions.push({ date: today });
        }
      }
      return task;
    });
  
    // 更新数据并保存
    this.setData({ allTasks }, () => {
      this.filterTasks();  // 重新过滤任务
      wx.setStorageSync('tasks', allTasks);  // 保存到本地
    });
  },

  // 过滤任务（按选中日期和象限）
  filterTasks() {
    const today = this.data.selectedDate;  // 当前选中日期
    const weekday = new Date(today).getDay();  // 当前星期（0-6）
    const filtered = { 1: [], 2: [], 3: [], 4: [] };  // 按象限分类的初始化
    
    // 遍历所有任务
    for (const task of this.data.allTasks || []) {
      // 判断任务是否应该在今天显示
      const show =
        (task.repeatType === 0 && task.date === today) ||  // 单次任务且日期匹配
        (task.repeatType === 1) ||                         // 每日任务
        (task.repeatType === 2 && task.weekday === weekday); // 每周任务且星期匹配
      
      if (show) {
        // 检查今天是否已完成
        const isCompleted = task.completions?.some(c => c.date === today) ?? false;
        // 按象限添加到对应数组
        filtered[task.quadrant].push({
          ...task,
          completed: isCompleted  // 动态计算完成状态
        });
      }
    }
    
    this.setData({ filteredTasks: filtered });  // 更新过滤后的任务
  },

  // 回到今天
  goToday() {
    const now = new Date();  // 当前日期
    const year = now.getFullYear();
    const month = now.getMonth();
    const todayStr = this.formatDate(now);
  
    // 更新年月和选中日期，并重新生成日历和过滤任务
    this.setData({
      currentYear: year,
      currentMonth: month,
      selectedDate: todayStr
    }, () => {
      this.generateCalendar(year, month);
      this.filterTasks();
    });
  },

  // 删除任务
  deleteTask(e) {
    const taskId = e.currentTarget.dataset.id;  // 获取任务ID
    
    // 显示确认对话框
    wx.showModal({
      title: '删除任务',
      content: '确定要删除这个任务吗？',
      success: (res) => {
        if (res.confirm) {
          // 过滤掉要删除的任务
          const allTasks = this.data.allTasks.filter(task => task.id !== taskId);
          
          // 更新数据并保存
          this.setData({ allTasks }, () => {
            this.filterTasks();  // 重新过滤任务
            wx.setStorageSync('tasks', allTasks);  // 更新本地存储
            wx.showToast({ title: '已删除', icon: 'success' });  // 显示成功提示
          });
        }
      }
    });
  },
});