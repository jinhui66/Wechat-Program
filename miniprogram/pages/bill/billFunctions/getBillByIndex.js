// getBillByIndex.js
const db = wx.cloud.database();

/**
 * 根据序号获取对应账单记录（按创建时间降序）
 * @param {number} index - 要获取的账单在排序后的列表中的序号（从0开始）
 * @returns {Promise<Object|null>} - 对应的账单记录（JSON 格式），若不存在则返回 null
 */
async function getBillByIndex(index) {
  if (typeof index !== 'number' || index < 0) {
    throw new Error('索引必须是非负整数');
  }

  try {
    const res = await db.collection('bills')
      .orderBy('createTime', 'desc')
      .skip(index)
      .limit(1)
      .get();

    if (res.data.length === 0) {
      return null; // 未找到记录
    }

    return res.data[0];
  } catch (error) {
    console.error('获取账单失败:', error);
    throw new Error('数据库查询失败');
  }
}

module.exports = getBillByIndex;
