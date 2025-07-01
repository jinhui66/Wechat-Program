Page({
  data: {
    items: [
      { name: '消费一览', icon: '/images/bill/overview.png', url: '/pages/bill/overview/index' },
      { name: '记一笔',   icon: '/images/bill/add.png',      url: '/pages/bill/add/index'       },
      { name: '明细列表', icon: '/images/bill/list.png',     url: '/pages/bill/list/index'     },
      { name: '报表统计', icon: '/images/bill/stats.png',    url: '/pages/bill/stats/index'    },
      { name: '个人中心', icon: '/images/bill/profile.png',  url: '/pages/bill/profile/index'}
    ]
  },
  goToSub(e) {
    wx.navigateTo({ url: e.currentTarget.dataset.url });
  }
});
