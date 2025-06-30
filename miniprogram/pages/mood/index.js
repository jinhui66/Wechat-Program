Page({
  data: {
    year: 0,
    month: 0,
    calendarDays: [],
    daysOfWeek: ['日', '一', '二', '三', '四', '五', '六']
  },

  onLoad() {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // JavaScript 的月份从0开始计算，所以需要加1

    this.setData({ year, month });
    this.generateCalendar(year, month);
  },

  generateCalendar(year, month) {
    const firstDay = new Date(year, month - 1, 1); // 当月第一天
    const lastDateOfTheMonth = new Date(year, month, 0).getDate(); // 当月最后一天的日期
    const startDay = firstDay.getDay(); // 当月第一天是星期几
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    let calendarDays = [];

    // 填充上个月末尾的空白天数
    for (let i = 0; i < startDay; i++) {
      calendarDays.push({ number: '', isToday: false });
    }

    // 添加本月的每一天
    for (let day = 1; day <= lastDateOfTheMonth; day++) {
      const isToday = year === currentYear && month === currentMonth && day === currentDay;

      calendarDays.push({
        number: day,
        isToday: isToday
      });
    }

    this.setData({ calendarDays });
  },

  // 简化农历转换函数（仅供演示）
  getLunar(year, month, day) {
    const lunarDays = [
      '初一', '初二', '初三', '初四', '初五', '初六',
      '初七', '初八', '初九', '初十', '十一', '十二',
      '十三', '十四', '十五', '十六', '十七', '十八',
      '十九', '二十', '廿一', '廿二', '廿三', '廿四',
      '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
    ];
    return lunarDays[(day + 5) % 30];
  }
});