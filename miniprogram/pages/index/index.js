Page({
  data: {
    // 新增标语数据
    banners: [
        { image: "/images/index/biaoyu1.jpg", link: "/pages/task/index" },
        { image: "/images/index/biaoyu2.jpg", link: "/pages/bill/index" },
        { image: "/images/index/biaoyu3.jpg", link: "/pages/mood/index" },
        { image: "/images/index/biaoyu4.jpg", link: "/pages/alarm/index" }
      ],
    tools: [
      { name: "自定义打卡", icon: "/images/index/daka.png" },
      { name: "记账", icon: "/images/index/jizhang.png" },
      { name: "每日心情", icon: "/images/index/xq.png" },
      { name: "番茄钟", icon: "/images/index/alarm2.png" },
      { name: "课程表", icon: "/images/index/class.png" },
      { name: "勋章挑战", icon: "/images/index/lion.png" },
      { name: "YoYo商店", icon: "/images/index/lion.png" },
      { name: "睡眠舱", icon: "/images/index/lion.png" },
      { name: "待办清单", icon: "/images/index/lion.png" },
      { name: "小组件", icon: "/images/index/lion.png" },
      { name: "小憩区", icon: "/images/index/lion.png" },
      { name: "电波室", icon: "/images/index/lion.png" },
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
      "课程表": "/pages/course/index",
      "自定义打卡": "/pages/task/index",
      "勋章挑战": "/pages/badge/index",
      "记账": "/pages/bill/index",
      "YoYo商店": "/pages/store/index",
      "睡眠舱": "/pages/sleep/index",
      "番茄钟": "/pages/alarm/index",
      "待办清单": "/pages/todo/index",
      "每日心情": "/pages/mood/index",
      "小组件": "/pages/widget/index",
      "小憩区": "/pages/rest/index",
      "电波室": "/pages/wave/index"
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
