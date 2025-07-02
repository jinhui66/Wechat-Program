// add.js
const { expenseCategories, incomeCategories } = require('../../bill/add/categories/categories.js');

Page({
  data: {
    amount: '',
    accountType: 'expense', // 'expense' or 'income'
    categories: expenseCategories, // Default to expense categories
    category: expenseCategories[0], // Default selected category
    note: '',
    date: new Date().toISOString().slice(0, 10)
  },

  onLoad() {
    // Set initial category based on default accountType
    this.setData({
      category: this.data.categories[0]
    });
  },

  bindAmount(e) {
    this.setData({ amount: e.detail.value });
  },

  bindAccountType(e) {
    const type = e.currentTarget.dataset.type;
    const newCategories = type === 'expense' ? expenseCategories : incomeCategories;
    this.setData({
      accountType: type,
      categories: newCategories,
      category: newCategories[0] // Reset selected category when type changes
    });
  },

  bindCategory(e) {
    const idx = e.detail.value;
    const cat = this.data.categories[idx];
    this.setData({ category: cat });
  },

  bindNote(e) {
    this.setData({ note: e.detail.value });
  },

  bindDate(e) {
    this.setData({ date: e.detail.value });
  },

  save() {
    const { amount, category, note, date, accountType } = this.data;

    if (!amount || parseFloat(amount) <= 0) {
      wx.showToast({ title: '请输入有效金额', icon: 'none' });
      return;
    }

    const list = wx.getStorageSync('bills') || [];
    // Store the accountType along with other bill details
    list.push({
      amount: parseFloat(amount),
      category,
      note,
      date,
      type: accountType // 'expense' or 'income'
    });
    wx.setStorageSync('bills', list);
    wx.showToast({ title: '保存成功' });
    wx.navigateBack();
  }
});