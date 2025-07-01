Page({
  clearAll() {
    wx.showModal({
      title: '确认', content: '清空所有账单？',
      success(res) {
        if (res.confirm) {
          wx.clearStorageSync();
          wx.showToast({ title: '已清空' });
        }
      }
    });
  }
});