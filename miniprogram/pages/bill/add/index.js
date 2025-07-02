// add.js
const { expenseCategories, incomeCategories } = require('../../bill/add/categories/categories.js');

// 获取数据库引用
const db = wx.cloud.database();
const _ = db.command; // 引入 command API，用于复杂的查询操作


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

  async save() { // 使用 async/await 处理异步操作
    const { amount, category, note, date, accountType } = this.data;

    if (!amount || parseFloat(amount) <= 0) {
      wx.showToast({ title: '请输入有效金额', icon: 'none' });
      return;
    }

    wx.showLoading({
      title: '保存中...',
    });

    try {
      // 将账单数据添加到云数据库
      await db.collection('bills').add({
        data: {
          amount: parseFloat(amount),
          category,
          note,
          date,
          type: accountType, // 'expense' or 'income'
          createTime: db.serverDate() // 记录创建时间，方便排序和查询
        }
      });
      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
      wx.navigateBack();
    } catch (err) {
      wx.hideLoading();
      console.error('添加账单失败：', err);
      wx.showToast({ title: '保存失败，请重试', icon: 'none' });
    }
  }
});