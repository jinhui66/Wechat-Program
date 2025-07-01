Page({
  data: {
    todayTotal: 0,
    monthTotal: 0
  },
  onShow() {
    this.loadData();
  },
  loadData() {
    const list = wx.getStorageSync('bills') || [];
    const now = new Date();
    const today = now.toISOString().slice(0,10);
    const month = today.slice(0,7);
    let tTotal = 0, mTotal = 0;
    list.forEach(item => {
      if (item.date === today) tTotal += item.amount;
      if (item.date.startsWith(month)) mTotal += item.amount;
    });
    this.setData({ todayTotal: tTotal, monthTotal: mTotal });
  },
  goAdd() {
    wx.navigateTo( {url: '/pages/bill/add/index'} );
  },
});
