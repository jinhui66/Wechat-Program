Page({
  data: {
    // 新增标语数据
    banners: [
        { image: "/images/index/biaoyu1.webp", link: "/pages/task/index" },
        { image: "/images/index/biaoyu2.webp", link: "/pages/bill/index" },
        { image: "/images/index/biaoyu3.webp", link: "/pages/mood/index" },
        { image: "/images/index/biaoyu4.webp", link: "/pages/alarm/index" }
      ],
    tools: [
      { name: "自定义打卡", icon: "/images/index/daka.webp" },
      { name: "记账", icon: "/images/index/jizhang.webp" },
      { name: "每日心情", icon: "/images/index/xq.webp" },
      { name: "番茄钟", icon: "/images/index/alarm2.webp" },
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
      "自定义打卡": "/pages/task/index",
      "记账": "/pages/bill/index",
      "番茄钟": "/pages/alarm/index",
      "每日心情": "/pages/mood/index"
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
