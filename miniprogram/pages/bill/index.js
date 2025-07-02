Page({
  data: {
    items: [
      { name: '记一笔',   icon: './jizhang.wbep',      url: '/pages/bill/add/index' },
      { name: '明细列表', icon: './list.wbep',     url: '/pages/bill/list/index'  },
      { name: '报表统计', icon: './stats.wbep',    url: '/pages/bill/stats/index' },
      { name: '个人中心', icon: './alarm2.wbep',  url: '/pages/bill/profile/index'}
    ]
  },
  goToSub(e) {
    wx.navigateTo({ url: e.currentTarget.dataset.url });
  }
});
