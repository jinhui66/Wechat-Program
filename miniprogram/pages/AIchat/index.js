Page({
  data: {
    chatList: [],
    inputValue: '',
    currentChatId: '',
    showChatList: false,
    chatIds: [], // 存所有会话id
    chats: {}   // 聊天内容缓存
  },

  onLoad() {
    let storage = wx.getStorageSync('multi-chat') || { chats: {}, currentChatId: '' };

    if (!storage.currentChatId) {
      const newId = 'chat_' + Date.now();
      storage.currentChatId = newId;
      storage.chats[newId] = [];
      wx.setStorageSync('multi-chat', storage);
    }

    this.setData({
      currentChatId: storage.currentChatId,
      chatList: storage.chats[storage.currentChatId] || [],
      chats: storage.chats,
      chatIds: Object.keys(storage.chats)
    }, this.scrollToBottom);
  },

  toggleChatList() {
    this.setData({ showChatList: !this.data.showChatList });
  },

  closeChatList() {
    this.setData({ showChatList: false });
  },

  switchChat(e) {
    const id = e.currentTarget.dataset.id;
    if (id === this.data.currentChatId) {
      this.closeChatList();
      return;
    }
    this.setData({
      currentChatId: id,
      chatList: this.data.chats[id] || [],
      showChatList: false
    }, this.scrollToBottom);
  },

  onInput(e) {
    this.setData({ inputValue: e.detail.value });
  },

  async onSend() {
    const question = this.data.inputValue.trim();
    if (!question) return;

    const chatList = [...this.data.chatList, {
      role: 'user',
      content: question,
      displayText: question
    }];

    this.setData({ chatList, inputValue: '' }, this.scrollToBottom);
    this.saveCurrentChat(chatList);

    this.typingEffect("正在思考中...", "ai");

    const reply = await this.getAIReply(question);
    this.typingEffect(reply, "ai");
  },

 typingEffect(text, role, autoRemove = false) {
  let index = 0;
  const current = { role, content: text, displayText: '' };
  const chatList = [...this.data.chatList, current];

  this.setData({ chatList }, this.scrollToBottom);

  const timer = setInterval(() => {
    if (index >= text.length) {
      clearInterval(timer);

      if (autoRemove) {
        // 删除刚刚添加的这条消息（最后一条）
        const newList = [...this.data.chatList];
        newList.pop();
        this.setData({ chatList: newList }, this.scrollToBottom);
      } else {
        this.saveCurrentChat(this.data.chatList);
      }

      return;
    }
    current.displayText += text[index++];
    this.setData({ chatList }, this.scrollToBottom);
  }, 30);
},

  scrollToBottom() {
    wx.pageScrollTo({
      scrollTop: 99999,
      duration: 100
    });
  },

  saveCurrentChat(chatList) {
    const storage = wx.getStorageSync('multi-chat') || { chats: {}, currentChatId: '' };
    storage.chats[this.data.currentChatId] = chatList;
    wx.setStorageSync('multi-chat', storage);

    this.setData({
      chats: storage.chats,
      chatIds: Object.keys(storage.chats)
    });
  },

  async getAIReply(text) {
    const messages = [
      { role: 'user', content: text }
      // 如果你有上下文消息，可以传更多
    ];
  
    try {
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: 'https://api.deepseek.com/v1/chat/completions',
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer sk-959b91a2cd594093abfb1b087ce47766' // 替换成你的API Key
          },
          data: {
            model: 'deepseek-chat',
            messages
          },
          success: res => {
            if (res.statusCode === 200) {
              resolve(res.data);
            } else {
              reject(new Error('API 返回状态码非200: ' + res.statusCode));
            }
          },
          fail: err => reject(err)
        });
      });
  
      // 假设API返回格式中，回复文本在 res.choices[0].message.content 里
      const replyText = res.choices && res.choices[0]?.message?.content;
      if (replyText) {
        return replyText;
      } else {
        return 'AI未返回有效内容';
      }
    } catch (error) {
      console.error('调用AI接口失败:', error);
      return '请求AI服务失败，请稍后重试';
    }
  }
});
