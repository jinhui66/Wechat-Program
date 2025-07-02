Page({
  data: {
    nickName: '游客',
    avatarUrl: '/images/index/lion.png'
  },

  onLoad: function () {
    this.getUserInfo();
  },

  getUserInfo: function () {
    wx.getUserProfile({
      desc: '用于展示用户头像和昵称',
      success: (res) => {
        const { nickName, avatarUrl } = res.userInfo;
        this.setData({
          nickName,
          avatarUrl
        });
      },
      fail: () => {
        console.log('用户拒绝授权');
      }
    });
  },

  // ✅ 加上这个函数，处理普通分享（转发给好友）
  onShareAppMessage() {
    return {
      title: '这是我的个人空间，欢迎来看看 📘',
      path: '/pages/profile/index',
      imageUrl: '/images/index/lion.png'
    };
  },

  // ✅ 如果你还想支持分享到朋友圈，也可以保留这个
  onShareTimeline() {
    return {
      title: '这是我的个人空间，欢迎来看看 📘',
      query: '',
      imageUrl: '/images/index/lion.png'
    };
  }
});
