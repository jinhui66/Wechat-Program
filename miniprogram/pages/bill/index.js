Page({
  data: {
    items: [
      { name: '记一笔',   icon: '/images/index/jizhang.webp',      url: '/pages/bill/add/index' },
      { name: '明细列表', icon: '/images/index/list.webp',     url: '/pages/bill/list/index'  },
      { name: '报表统计', icon: '/images/index/stats.webp',    url: '/pages/bill/stats/index' },
      { name: '个人中心', icon: '/images/index/alarm2.webp',  url: '/pages/bill/profile/index'}
    ]
  },
  goToSub(e) {
    wx.navigateTo({ url: e.currentTarget.dataset.url });
  }
});
