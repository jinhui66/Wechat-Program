Page({
  data: {
    nickName: '游客',       // 默认昵称
    avatarUrl: '/images/default-avatar.png' // 默认头像（你可以换成自己的默认图）
  },

  onLoad: function () {
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
        console.log('用户拒绝授权，显示默认头像昵称');
      }
    });
  }
});
