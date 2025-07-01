Page({
  data: {
    schoolName: '杭州电子科技大学',
    semester: '个人课表',

    currentWeekIndex: 0,
    weeks: [
      { id: 1, name: '第1周' }, { id: 2, name: '第2周' }, { id: 3, name: '第3周' },
      { id: 4, name: '第4周' }, { id: 5, name: '第5周' }, { id: 6, name: '第6周' },
      { id: 7, name: '第7周' }, { id: 8, name: '第8周' }
    ],

    weekDays: [
      { id: 1, name: '周一' }, { id: 2, name: '周二' }, { id: 3, name: '周三' },
      { id: 4, name: '周四' }, { id: 5, name: '周五' }, { id: 6, name: '周六' },
      { id: 7, name: '周日' }
    ],

    classTimes: Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `第${i + 1}节` })),

    colors: [
      { value: '#FF9E9E' }, { value: '#FFD6A5' }, { value: '#B5EAEA' },
      { value: '#C7CEEA' }, { value: '#FFE156' }
    ],

    courses: [],      // 所有拆分成单节的课程条目
    coursesMap: {},   // week -> day -> time -> course 映射

    showEditModal: false,
    editMode: 'add',
    currentCourse: {},

    selectedWeekRange: [1, 1],
    selectedClassRange: [1, 1],
    dayIndex: 0,
  },

  onLoad() {
    this.loadCourses();
    this.setData({
      currentWeek: this.data.weeks[this.data.currentWeekIndex].id
    });
  },

  loadCourses() {
    const courses = wx.getStorageSync('courses') || [];
    this.setData({ courses }, () => {
      this.refreshCoursesMap();
    });
  },

  saveCourses() {
    wx.setStorageSync('courses', this.data.courses);
  },

  refreshCoursesMap() {
    const map = {};
    this.data.courses.forEach(c => {
      const w = c.week;
      const d = c.day;
      const t = c.time;
      if (!map[w]) map[w] = {};
      if (!map[w][d]) map[w][d] = {};
      map[w][d][t] = c;
    });
    this.setData({ coursesMap: map });
  },

  getCourse(week, day, time) {
    return this.data.coursesMap?.[week]?.[day]?.[time] || null;
  },

  changeWeek(e) {
    this.setData({
      currentWeekIndex: e.detail.value,
      currentWeek: this.data.weeks[e.detail.value].id
    });
  },

  addCourse() {
    this.setData({
      showEditModal: true,
      editMode: 'add',
      currentCourse: {
        name: '',
        location: '',
        color: this.data.colors[0].value,
        weekRange: [1, 1],
        day: this.data.weekDays[0].id,
        classRange: [1, 1]
      },
      selectedWeekRange: [1, 1],
      selectedClassRange: [1, 1],
      dayIndex: 0
    });
  },

  hideEditModal() {
    this.setData({ showEditModal: false });
  },

  onCourseNameChange(e) {
    this.setData({
      'currentCourse.name': e.detail.value
    });
  },

  onLocationChange(e) {
    this.setData({
      'currentCourse.location': e.detail.value
    });
  },

  onDayChange(e) {
    const index = e.detail.value;
    this.setData({
      dayIndex: index,
      'currentCourse.day': this.data.weekDays[index].id
    });
  },

  selectColor(e) {
    const index = e.currentTarget.dataset.index;
    const newColor = this.data.colors[index].value;
    if (this.data.currentCourse.color !== newColor) {
      this.setData({
        'currentCourse.color': newColor
      });
    }
  },

  onWeekStartChange(e) {
    const val = parseInt(e.detail.value) + 1;
    const [_, end] = this.data.selectedWeekRange;
    if (val > end) {
      wx.showToast({ title: '开始周不能大于结束周', icon: 'none' });
      return;
    }
    this.setData({
      selectedWeekRange: [val, end],
      'currentCourse.weekRange': [val, end]
    });
  },

  onWeekEndChange(e) {
    const val = parseInt(e.detail.value) + 1;
    const [start, _] = this.data.selectedWeekRange;
    if (val < start) {
      wx.showToast({ title: '结束周不能小于开始周', icon: 'none' });
      return;
    }
    this.setData({
      selectedWeekRange: [start, val],
      'currentCourse.weekRange': [start, val]
    });
  },

  onClassStartChange(e) {
    const val = parseInt(e.detail.value) + 1;
    const [_, end] = this.data.selectedClassRange;
    if (val > end) {
      wx.showToast({ title: '开始节次不能大于结束节次', icon: 'none' });
      return;
    }
    this.setData({
      selectedClassRange: [val, end],
      'currentCourse.classRange': [val, end]
    });
  },

  onClassEndChange(e) {
    const val = parseInt(e.detail.value) + 1;
    const [start, _] = this.data.selectedClassRange;
    if (val < start) {
      wx.showToast({ title: '结束节次不能小于开始节次', icon: 'none' });
      return;
    }
    this.setData({
      selectedClassRange: [start, val],
      'currentCourse.classRange': [start, val]
    });
  },

  confirmCourseAction() {
    const { editMode, currentCourse } = this.data;

    if (!currentCourse.name || currentCourse.name.trim() === '') {
      wx.showToast({ title: '课程名不能为空', icon: 'none' });
      return;
    }

    const weekStart = currentCourse.weekRange ? currentCourse.weekRange[0] : currentCourse.week;
    const weekEnd = currentCourse.weekRange ? currentCourse.weekRange[1] : currentCourse.week;
    const classStart = currentCourse.classRange ? currentCourse.classRange[0] : currentCourse.time;
    const classEnd = currentCourse.classRange ? currentCourse.classRange[1] : currentCourse.time;

    // 过滤掉时间重叠的课程（同一天同节次同周）
    const newCourses = this.data.courses.filter(c =>
      !(
        c.day === currentCourse.day &&
        ((c.weekRange && weekStart <= c.weekRange[1] && weekEnd >= c.weekRange[0]) ||
          (!c.weekRange && c.week >= weekStart && c.week <= weekEnd)) &&
        ((c.classRange && classStart <= c.classRange[1] && classEnd >= c.classRange[0]) ||
          (!c.classRange && c.time >= classStart && c.time <= classEnd))
      )
    );

    // 拆分为单节课程条目
    for (let week = weekStart; week <= weekEnd; week++) {
      for (let time = classStart; time <= classEnd; time++) {
        newCourses.push({
          ...currentCourse,
          week,
          time,
          weekRange: weekStart === weekEnd ? undefined : [weekStart, weekEnd],
          classRange: classStart === classEnd ? undefined : [classStart, classEnd]
        });
      }
    }

    this.setData({
      courses: newCourses,
      showEditModal: false
    }, () => {
      this.refreshCoursesMap();
      this.saveCourses();
      wx.showToast({
        title: editMode === 'add' ? '添加成功' : '保存成功',
        icon: 'success'
      });
    });
  },

  getDayName(day) {
    return this.data.weekDays.find(d => d.id === day)?.name || '';
  },

  getClassTimeName(time) {
    return this.data.classTimes.find(c => c.id === time)?.name || '';
  }
});