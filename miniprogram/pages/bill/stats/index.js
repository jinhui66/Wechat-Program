// pages/bill/stats/index.js
import wxCharts from '/wxcharts/wxcharts.js';

Page({
  data: {
    pieChart: null,
    columnChart: null
  },

  onReady() {
    this.drawCharts();
  },

  drawCharts() {
    const bills = wx.getStorageSync('bills') || [];
    const stats = {};

    bills.forEach(({ category, amount }) => {
      stats[category] = (stats[category] || 0) + amount;
    });

    const categories = Object.keys(stats);
    const amounts = categories.map(cat => stats[cat]);
    const pieSeries = categories.map(cat => ({ name: cat, data: stats[cat] }));

    // 饼图：分类支出占比
    this.data.pieChart = new wxCharts({
      animation: true,
      canvasId: 'pieChart',
      type: 'pie',
      series: pieSeries,
      width: wx.getSystemInfoSync().windowWidth,
      height: 300,
      dataLabel: true
    });

    // 柱状图：分类支出对比
    this.data.columnChart = new wxCharts({
      animation: true,
      canvasId: 'columnChart',
      type: 'column',
      categories,
      series: [{
        name: '支出',
        data: amounts
      }],
      yAxis: { title: '¥', format: val => val.toFixed(2) },
      xAxis: { disableGrid: true },
      width: wx.getSystemInfoSync().windowWidth,
      height: 300
    });
  }
});
