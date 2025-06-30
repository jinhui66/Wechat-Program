Page({
  data: {
    schoolName: '杭州电子科技大学',
    semester: '个人课表',
    showActionModal: false,
    showEditModal: false,
    showDeleteOptions: false,
    showWeekRangePicker: false,
    showClassRangePicker: false,
    editMode: 'add',
    currentCourse: {},
    highlightedCourse: null,

    weekRange: Array.from({ length: 20 }, (_, i) => i + 1),
    selectedWeekRange: [1, 1],
    tempWeekRange: [1, 1],

    selectedClassRange: [1, 1],
    tempClassRange: [1, 1],

    currentWeekIndex: 0,
    dayIndex: 0,
    weeks: [
      { id: 1, name: '第1周' },
      { id: 2, name: '第2周' },
      { id: 3, name: '第3周' },
      { id: 4, name: '第4周' },
      { id: 5, name: '第5周' },
      { id: 6, name: '第6周' },
      { id: 7, name: '第7周' },
      { id: 8, name: '第8周' },
    ],
    weekDays: [
      { id: 1, name: '周一' },
      { id: 2, name: '周二' },
      { id: 3, name: '周三' },
      { id: 4, name: '周四' },
      { id: 5, name: '周五' },
      { id: 6, name: '周六' },
      { id: 7, name: '周日' },
    ],
    classTimes: [
      { id: 1, name: '第1节' },
      { id: 2, name: '第2节' },
      { id: 3, name: '第3节' },
      { id: 4, name: '第4节' },
      { id: 5, name: '第5节' },
      { id: 6, name: '第6节' },
      { id: 7, name: '第7节' },
      { id: 8, name: '第8节' },
      { id: 9, name: '第9节' },
      { id: 10, name: '第10节' },
      { id: 11, name: '第11节' },
      { id: 12, name: '第12节' },
    ],
    colors: [
      { value: '#FF9E9E' },
      { value: '#FFD6A5' },
      // 你可以继续补充颜色
    ],
    morningClasses: Array(4).fill(null),   // 上午4节课（这里调整成4节）
    afternoonClasses: Array(4).fill(null), // 下午4节课
    eveningClasses: Array(4).fill(null),   // 晚上4节课（晚上从第9节开始）
    courses: [],
    coursesMap: {},

    deleteOptions: []
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
      const week = c.week;
      const day = c.day;
      const time = c.time;
      if (!map[week]) map[week] = {};
      if (!map[week][day]) map[week][day] = {};
      map[week][day][time] = c;
    });
    this.setData({ coursesMap: map });
  },

  getCourse(week, day, time) {
    return this.data.coursesMap?.[week]?.[day]?.[time] || null;
  },

  showActionSheet() {
    this.setData({ showActionModal: true });
  },

  hideActionModal() {
    this.setData({ showActionModal: false });
  },

  hideEditModal() {
    this.setData({
      showEditModal: false,
      highlightedCourse: null
    });
  },

  hideDeleteOptions() {
    this.setData({ showDeleteOptions: false });
  },

  addCourse() {
    this.setData({
      showActionModal: false,
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

  prepareEditCourse() {
    const course = this.data.currentCourse;
    this.setData({
      showActionModal: false,
      showEditModal: true,
      editMode: 'edit',
      selectedWeekRange: course.weekRange || [course.week, course.week],
      selectedClassRange: course.classRange || [course.time, course.time],
      dayIndex: this.data.weekDays.findIndex(d => d.id === course.day)
    });
  },

  prepareDeleteCourse() {
    const course = this.data.currentCourse;

    if (!course.name) {
      wx.showToast({ title: '课程名为空', icon: 'none' });
      return;
    }

    wx.showActionSheet({
      itemList: ['删除所有同名课程', '仅删除当前课程'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.deleteByCourseName(course.name);
        } else if (res.tapIndex === 1) {
          if (course.weekRange && course.classRange) {
            this.setData({
              showDeleteOptions: true,
              deleteOptions: this.getDeleteOptions(course)
            });
          } else {
            this.showDeleteConfirm(course);
          }
        }
      }
    });
  },

  getDeleteOptions(course) {
    const options = [];
    const [weekStart, weekEnd] = course.weekRange;
    const [classStart, classEnd] = course.classRange;

    for (let week = weekStart; week <= weekEnd; week++) {
      for (let time = classStart; time <= classEnd; time++) {
        options.push({
          week,
          time,
          label: `第${week}周 ${this.getDayName(course.day)} ${this.getClassTimeName(time)}`
        });
      }
    }
    return options;
  },

  showDeleteConfirm(course) {
    wx.showModal({
      title: '确认删除',
      content: `确定要删除 ${course.name} (${this.getDayName(course.day)} ${this.getClassTimeName(course.time || course.classRange[0])}) 吗？`,
      success: (res) => {
        if (res.confirm) {
          this.executeDelete(course);
        }
      }
    });
  },
  executeDelete(course) {
    const newCourses = this.data.courses.filter(c => {
      // 保留不符合删除条件的课程，删除符合的
      return !(
        c.name === course.name &&
        c.day === course.day &&
        c.week === course.week &&
        c.time === course.time
      );
    });
  
    this.setData({
      courses: newCourses,
      showActionModal: false,
      showDeleteOptions: false,
      highlightedCourse: null
    }, () => {
      wx.showToast({ title: '删除成功', icon: 'success' });
      this.saveCourses();
      this.refreshCoursesMap();
    });
  },

  deleteByCourseName(name) {
    const newCourses = this.data.courses.filter(c => c.name !== name);
    this.setData({
      courses: newCourses,
      showActionModal: false,
      highlightedCourse: null
    }, () => {
      wx.showToast({ title: '删除成功', icon: 'success' });
      this.saveCourses();
      this.refreshCoursesMap();
    });
  },
    

  deleteSpecificCourse(e) {
    const { week, time } = e.currentTarget.dataset;
    const course = {
      ...this.data.currentCourse,
      week,
      time
    };
    this.showDeleteConfirm(course);
  },

  handleCourseCellTap(e) {
    const { week, day, time } = e.currentTarget.dataset;
    const course = this.getCourse(week, day, time);
    this.setData({
      currentCourse: course || {},
      showActionModal: !!course
    });
  },

  handleCourseLongPress(e) {
    const { week, day, time } = e.currentTarget.dataset;
    const course = this.getCourse(week, day, time);
    if (course) {
      this.setData({
        currentCourse: course,
        showActionModal: true
      });
    }
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


  openWeekRangePicker() {
    this.setData({
      showWeekRangePicker: true,
      tempWeekRange: [...this.data.selectedWeekRange]
    });
  },

  updateWeekRangeStart(e) {
    const start = parseInt(e.detail.value) + 1;
    const tempWeekRange = [...this.data.tempWeekRange];
    tempWeekRange[0] = start;
    if (start > tempWeekRange[1]) {
      tempWeekRange[1] = start;
    }
    this.setData({ tempWeekRange });
  },

  updateWeekRangeEnd(e) {
    const end = parseInt(e.detail.value) + 1;
    const tempWeekRange = [...this.data.tempWeekRange];
    tempWeekRange[1] = end;
    if (end < tempWeekRange[0]) {
      tempWeekRange[0] = end;
    }
    this.setData({ tempWeekRange });
  },

  confirmWeekRange() {
    this.setData({
      selectedWeekRange: this.data.tempWeekRange,
      showWeekRangePicker: false,
      'currentCourse.weekRange': this.data.tempWeekRange
    });
  },

  cancelWeekRange() {
    this.setData({
      showWeekRangePicker: false
    });
  },

  openClassRangePicker() {
    this.setData({
      showClassRangePicker: true,
      tempClassRange: [...this.data.selectedClassRange]
    });
  },

  updateClassRangeStart(e) {
    const start = parseInt(e.detail.value) + 1;
    const tempClassRange = [...this.data.tempClassRange];
    tempClassRange[0] = start;
    if (start > tempClassRange[1]) {
      tempClassRange[1] = start;
    }
    this.setData({ tempClassRange });
  },

  updateClassRangeEnd(e) {
    const end = parseInt(e.detail.value) + 1;
    const tempClassRange = [...this.data.tempClassRange];
    tempClassRange[1] = end;
    if (end < tempClassRange[0]) {
      tempClassRange[0] = end;
    }
    this.setData({ tempClassRange });
  },

  confirmClassRange() {
    this.setData({
      selectedClassRange: this.data.tempClassRange,
      showClassRangePicker: false,
      'currentCourse.classRange': this.data.tempClassRange
    });
  },

  cancelClassRange() {
    this.setData({
      showClassRangePicker: false
    });
  },

  confirmCourseAction() {
    const { editMode, currentCourse } = this.data;

    if (editMode === 'delete') {
      this.prepareDeleteCourse();
      return;
    }

    const weekStart = currentCourse.weekRange ? currentCourse.weekRange[0] : currentCourse.week;
    const weekEnd = currentCourse.weekRange ? currentCourse.weekRange[1] : currentCourse.week;
    const classStart = currentCourse.classRange ? currentCourse.classRange[0] : currentCourse.time;
    const classEnd = currentCourse.classRange ? currentCourse.classRange[1] : currentCourse.time;

    const newCourses = this.data.courses.filter(c =>
      !(
        c.day === currentCourse.day &&
        ((c.weekRange && weekStart <= c.weekRange[1] && weekEnd >= c.weekRange[0]) ||
          (!c.weekRange && c.week >= weekStart && c.week <= weekEnd)) &&
        ((c.classRange && classStart <= c.classRange[1] && classEnd >= c.classRange[0]) ||
          (!c.classRange && c.time >= classStart && c.time <= classEnd))
      )
    );

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
      showEditModal: false,
      highlightedCourse: {
        day: currentCourse.day,
        time: classStart,
        week: weekStart
      }
    }, () => {
      this.refreshCoursesMap();
      wx.showToast({
        title: editMode === 'add' ? '添加成功' : '修改成功',
        icon: 'success'
      });
      this.saveCourses();
      this.scrollToCourse(currentCourse.day, classStart);
    });
  },

  scrollToCourse(day, time) {
    const timeSection = time <= 4 ? 'morning' :
      time <= 8 ? 'afternoon' : 'evening';
    const timeIndex = time <= 4 ? time - 1 :
      time <= 8 ? time - 5 : time - 9;

    setTimeout(() => {
      const query = wx.createSelectorQuery();
      query.select(`.${timeSection}-classes .time-row:nth-child(${timeIndex + 1})`).boundingClientRect();
      query.select('.schedule-container').boundingClientRect();
      query.exec((res) => {
        if (res[0] && res[1]) {
          wx.pageScrollTo({
            scrollTop: res[0].top - res[1].top,
            duration: 300
          });
        }
      });
    }, 100);
  },

  changeWeek(e) {
    this.setData({
      currentWeekIndex: e.detail.value,
      currentWeek: this.data.weeks[e.detail.value].id,
      highlightedCourse: null
    });
  },

  getDayName(day) {
    return this.data.weekDays.find(d => d.id === day)?.name || '';
  },

  getClassTimeName(time) {
    return this.data.classTimes.find(c => c.id === time)?.name || '';
  }
});
