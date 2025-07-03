const db = wx.cloud.database();
const _ = db.command; // 引入 command API，用于复杂的查询操作



Page({
  data: {
    items: [
      { name: '记一笔',   icon: '/images/index/jizhang.webp',      url: '/pages/bill/add/index' },
      { name: '明细列表', icon: '/images/index/list.webp',    url: '/pages/bill/list/index'  },
      { name: '报表统计', icon: '/images/index/stats.webp',   url: '/pages/bill/stats/index' },
    ]
  },

  goToSub(e) {
    wx.navigateTo({ url: e.currentTarget.dataset.url });
  },

  // 长按事件处理函数
  handleLongPress(e) {
    wx.showActionSheet({
      itemList: ['清空所有账单'],
      itemColor: '#e64340', // 将文字颜色设为红色
      success: (res) => {
        // 用户点击了“清空所有账单”选项
        if (res.tapIndex === 0) {
          this.confirmClearAll();
        }
      }
    });
  },

  // 弹出二次确认对话框
  confirmClearAll() {
    wx.showModal({
      title: '危险操作',
      content: '此操作将永久删除所有账单数据，且无法恢复。您确定要继续吗？',
      confirmText: '确定清空',
      confirmColor: '#e64340', // 将“确定”按钮设为红色
      success: (res) => {
        // 用户在二次确认中点击了“确定”
        if (res.confirm) {
          this.clearAllBills();  // 直接清空账单
        }
      }
    });
  },

// 直接操作数据库清空账单
clearAllBills() {
  wx.showLoading({
    title: '正在清空...',
    mask: true // 显示透明蒙层，防止触摸穿透
  });

  db.collection('bills').get().then(res => {
    const bills = res.data;

    // 如果没有账单，则直接返回
    if (bills.length === 0) {
      wx.hideLoading();
      wx.showToast({
        title: '没有账单可以清空',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    const batchSize = 20; // 每次删除 20 条账单，避免一次性删除过多
    const batchCount = Math.ceil(bills.length / batchSize);
    const batchTasks = [];

    for (let i = 0; i < batchCount; i++) {
      // 获取当前批次的 _id 列表
      const batchIds = bills.slice(i * batchSize, (i + 1) * batchSize).map(item => item._id);

      // 批量删除文档
      const batch = db.collection('bills').where({
        _id: _.in(batchIds) // 确保删除操作基于有效的 _id 列表
      }).remove();
      batchTasks.push(batch);
    }

    // 执行所有批量删除任务
    Promise.all(batchTasks).then(() => {
      wx.hideLoading();
      console.log('清空成功');
      wx.showToast({
        title: '已清空所有账单',
        icon: 'success',
        duration: 2000
      });
    }).catch(err => {
      wx.hideLoading();
      console.error('清空失败', err);
      wx.showToast({
        title: '清空失败，请重试',
        icon: 'none',
        duration: 2000
      });
    });
  }).catch(err => {
    wx.hideLoading();
    console.error('获取账单失败', err);
    wx.showToast({
      title: '获取账单失败，请重试',
      icon: 'none',
      duration: 2000
    });
  });
}

});
