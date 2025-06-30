// pages/calendar/calendar.js
Page({
  data: {
    year: 2025,
    month: 6,
    days: []
  },

  onLoad: function () {
    this.generateDays();
  },

  generateDays: function () {
    const date = new Date(this.data.year, this.data.month - 1, 1);
    const daysInMonth = new Date(this.data.year, this.data.month, 0).getDate();
    const firstDayOfWeek = date.getDay();

    let days = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push('');
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    this.setData({ days });
  }
});