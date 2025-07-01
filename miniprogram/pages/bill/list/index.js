Page({
  data: {
    bills: []
  },
  onShow() {
    const list = wx.getStorageSync('bills') || [];
    this.setData({ bills: list.reverse() });
  },

  getIcon(category) {
    const maps = {
      餐饮: '/assets/icons/food.png',
      交通: '/assets/icons/transport.png',
      购物: '/assets/icons/shop.png',
      其他: '/assets/icons/other.png'
    };
    return maps[category] || maps['其他'];
  },

  onLongPress(e) {
    const idx = e.currentTarget.dataset.index;
    const item = this.data.bills[idx];
    wx.showActionSheet({
      itemList: ['删除'],
      success: res => {
        if (res.tapIndex === 0) {
          this.deleteBill(idx);
        }
      }
    });
  },

  deleteBill(idx) {
    wx.showModal({
      title: '确认删除',
      content: `删除 ${this.data.bills[idx].category} ¥${this.data.bills[idx].amount}?`,
      success: res => {
        if (res.confirm) {
          const newBills = [...this.data.bills];
          newBills.splice(idx,1);
          wx.setStorageSync('bills', newBills.reverse());
          this.setData({ bills: newBills });
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  }
});
