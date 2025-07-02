Page({
  data: {
    // 新增标语数据
    banners: [
        { image: "./biaoyu1.wbep", link: "/pages/task/index" },
        { image: "./biaoyu2.wbep", link: "/pages/bill/index" },
        { image: "./biaoyu3.wbep", link: "/pages/mood/index" },
        { image: "./biaoyu4.wbep", link: "/pages/alarm/index" }
      ],
    tools: [
      { name: "自定义打卡", icon: "./daka.wbep" },
      { name: "记账", icon: "./jizhang.wbep" },
      { name: "每日心情", icon: "./xq.wbep" },
      { name: "番茄钟", icon: "./alarm2.wbep" }
    ]
  },
  // 点击标语跳转
  onBannerTap(e) {
    const link = e.currentTarget.dataset.link;
    wx.navigateTo({ url: link });
  },

  onToolTap(e) {
    const name = e.currentTarget.dataset.name;
    let pageMap = {
      "每日心情": "/pages/mood/index",
      "自定义打卡": "/pages/task/index",
      "记账": "/pages/bill/index",
      "番茄钟": "/pages/alarm/index",
    };

    const target = pageMap[name];

    if (target) {
      wx.navigateTo({
        url: target
      });
    } else {
      wx.showToast({
        title: '页面未开发',
        icon: 'none'
      });
    }
  }
});
