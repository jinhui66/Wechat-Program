Page({
  data: {
    tools: [
      { name: "课程表", icon: "/images/index/course.jpg" },
      { name: "打卡组", icon: "/images/index/lion.png" },
      { name: "勋章挑战", icon: "/images/index/lion.png" },
      { name: "记账", icon: "/images/index/lion.png" },
      { name: "YoYo商店", icon: "/images/index/lion.png" },
      { name: "睡眠舱", icon: "/images/index/lion.png" },
      { name: "闹钟提醒", icon: "/images/index/alarm.jpg" },
      { name: "待办清单", icon: "/images/index/lion.png" },
      { name: "每日心情", icon: "/images/index/mood.png" },
      { name: "小组件", icon: "/images/index/lion.png" },
      { name: "小憩区", icon: "/images/index/lion.png" },
      { name: "电波室", icon: "/images/index/lion.png" },
    ]
  },

  onToolTap(e) {
    const name = e.currentTarget.dataset.name;
    let pageMap = {
      "课程表": "/pages/course/index",
      "打卡组": "/pages/punch/index",
      "勋章挑战": "/pages/badge/index",
      "记账": "/pages/bill/index",
      "YoYo商店": "/pages/store/index",
      "睡眠舱": "/pages/sleep/index",
      "闹钟提醒": "/pages/alarm/index",
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
