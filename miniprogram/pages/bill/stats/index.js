// pages/bill/stats/index.js
const wxCharts = require('/wxcharts/wxcharts.js'); // 确保路径正确

// 获取数据库引用
const db = wx.cloud.database();
const _ = db.command; // 引入 command API

Page({
  // 将 pieChart 和 columnChart 定义在 data 外部，作为页面实例的属性
  // 这样它们在整个页面生命周期内都可以被访问和销毁，而不会被 data 刷新时清除
  pieChart: null,
  columnChart: null,

  data: {
    transactionType: 'expense', // 默认显示支出统计，可切换 'expense', 'income'
  },

  onReady() {
    this.drawCharts();
  },

  onShow() {
    // 每次页面显示时重新绘制图表，确保数据最新
    this.drawCharts();
  },

  // 切换统计类型 (支出/收入)
  changeTransactionType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      transactionType: type
    }, () => {
      this.drawCharts(); // 切换类型后重新绘制图表
    });
  },

  async drawCharts() {
    wx.showLoading({
      title: '加载统计数据...',
    });
    try {
      // 从云数据库获取所有账单
      const res = await db.collection('bills').get();
      const bills = res.data; // 获取到的账单数据

      const { transactionType } = this.data;
      // 根据 transactionType 筛选账单
      const filteredBills = bills.filter(bill => bill.type === transactionType);

      const stats = {};
      filteredBills.forEach(({ category, amount }) => {
        stats[category] = (stats[category] || 0) + amount;
      });

      const categories = Object.keys(stats);
      const amounts = categories.map(cat => stats[cat]);
      const pieSeries = categories.map(cat => ({ name: cat, data: stats[cat] }));

      // --- 核心修改部分 ---
      // 在创建新图表前，先销毁旧的图表实例
      if (this.pieChart && typeof this.pieChart.destroy === 'function') {
        this.pieChart.destroy();
        this.pieChart = null; // 销毁后将引用设为 null
      }
      if (this.columnChart && typeof this.columnChart.destroy === 'function') {
        this.columnChart.destroy();
        this.columnChart = null; // 销毁后将引用设为 null
      }
      // --- 核心修改部分结束 ---

      // 饼图：分类占比
      this.pieChart = new wxCharts({
        animation: true,
        canvasId: 'pieChart',
        type: 'pie',
        // 处理无数据情况：如果没有数据，显示一个默认的“暂无数据”饼图
        series: pieSeries.length > 0 ? pieSeries : [{ name: '暂无数据', data: 1, color: '#ccc' }],
        width: wx.getWindowInfo().windowWidth,
        height: 300,
        dataLabel: true
      });

      // 柱状图：分类对比
      this.columnChart = new wxCharts({
        animation: true,
        canvasId: 'columnChart',
        type: 'column',
        // 处理无数据情况
        categories: categories.length > 0 ? categories : ['暂无数据'],
        series: [{
          name: transactionType === 'expense' ? '支出' : '收入',
          data: amounts.length > 0 ? amounts : [0]
        }],
        yAxis: { title: '¥', format: val => val.toFixed(2) },
        xAxis: { disableGrid: true },
        width: wx.getWindowInfo().windowWidth,
        height: 300
      });

      wx.hideLoading();
    } catch (err) {
      wx.hideLoading();
      console.error('加载统计数据失败：', err);
      // 为了调试方便，可以在这里输出更详细的错误信息
      wx.showToast({ title: '加载统计数据失败，请重试', icon: 'none' });
    }
  },

  // 页面卸载时也销毁图表，避免内存泄漏
  onUnload() {
    if (this.pieChart && typeof this.pieChart.destroy === 'function') {
      this.pieChart.destroy();
      this.pieChart = null;
    }
    if (this.columnChart && typeof this.columnChart.destroy === 'function') {
      this.columnChart.destroy();
      this.columnChart = null;
    }
  }
});