// utils/getBillCount.js
const db = wx.cloud.database();

/**
 * 获取当前用户账单总数
 * @returns {Promise<number>} - 账单数量
 */
async function getBillCount() {
  // 默认 count() 方法仅统计当前用户有权限的记录
  const res = await db.collection('bills').count();
  return res.total;
}

module.exports = getBillCount;
