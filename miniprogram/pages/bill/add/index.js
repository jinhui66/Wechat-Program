Page({
  data: {
    amount: '',
    categories: ['餐饮','交通','购物','其他'],
    category: '其他',
    note: '',
    date: new Date().toISOString().slice(0,10)
  },
  bindAmount(e) { this.setData({ amount: e.detail.value }); },
  bindCategory(e) {
    const idx = e.detail.value;
    const cat = this.data.categories[idx];
    this.setData({ category: cat });
  },
  bindNote(e) { this.setData({ note: e.detail.value }); },
  bindDate(e) { this.setData({ date: e.detail.value }); },
  save() {
    const { amount, category, note, date } = this.data;
    if (!amount || parseFloat(amount) <= 0) {
      wx.showToast({ title: '请输入有效金额', icon: 'none' });
      return;
    }
    const list = wx.getStorageSync('bills') || [];
    list.push({ amount: parseFloat(amount), category, note, date });
    wx.setStorageSync('bills', list);
    wx.showToast({ title: '保存成功' });
    wx.navigateBack();
  }
});
