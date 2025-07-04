// 获取数据库引用
Page({
  // 页面初始数据
  data: {
    chatList: [],           // 当前聊天会话的消息列表
    inputValue: '',         // 用户输入框的值
    currentChatId: '',      // 当前会话ID
    showChatList: false,    // 是否显示会话列表侧边栏
    chatIds: [],           // 所有会话ID数组
    chats: {},             // 所有聊天内容的缓存对象（按会话ID存储）
    systemPrompt: '你是一个智能助手，请用中文回答用户的问题' // 默认系统提示词
  },

  // 页面显示时触发
  onShow() {
    // 从本地缓存获取任务和心情数据
    const tasks = wx.getStorageSync('tasks') || [];
    const daymoods = wx.getStorageSync('dayMoods') || {};
    
    // 生成心情提示词和任务提示词
    const moodPrompt = this.listRawMoods(daymoods);
    const taskPrompt = this.listRawTasks(tasks);
    
    // 合并提示词并更新到data中
    this.setData({systemPrompt: taskPrompt+moodPrompt});
  },

  // 页面加载时触发
  async onLoad() {
    // 从本地缓存获取多会话数据，如果没有则初始化
    let storage = wx.getStorageSync('multi-chat') || { 
      chats: {},           // 所有聊天会话内容
      currentChatId: '',   // 当前活跃的会话ID
      systemPrompts: {}    // 每个会话的系统提示词
    };
    
    // 获取格式化后的账单数据作为提示词
    const billsPrompts = await this.getFormattedBills();
    console.log("Bills",billsPrompts);
    
    // 从本地缓存获取任务数据
    const tasks = wx.getStorageSync('tasks') || [];
    console.log('[DEBUG] 当前任务数据:', tasks);
  
    // 生成任务提示词和心情提示词
    const taskPrompt = this.listRawTasks(tasks);
    const daymoods = wx.getStorageSync('dayMoods') || {};
    const moodPrompt = this.listRawMoods(daymoods);
    
    // 合并所有提示词，如果为空则使用默认系统提示词
    const finalPrompt = taskPrompt+moodPrompt+billsPrompts || this.data.systemPrompt;
  
    // 如果没有当前会话ID，则创建新会话
    if (!storage.currentChatId) {
      // 使用时间戳生成唯一会话ID
      const newId = 'chat_' + Date.now();
      storage.currentChatId = newId;
      storage.chats[newId] = [];  // 初始化空消息数组
      storage.systemPrompts[newId] = finalPrompt; // 使用生成的提示词
      console.log('[DEBUG] 创建新会话，ID:', newId);
    } else {
      // 已有会话时，强制更新当前会话的系统提示词
      storage.systemPrompts[storage.currentChatId] = finalPrompt;
      console.log('[DEBUG] 更新已有会话的系统提示词');
    }
  
    // 保存更新后的数据到本地缓存
    wx.setStorageSync('multi-chat', storage);
  
    // 更新页面数据
    this.setData({
      currentChatId: storage.currentChatId,       // 当前会话ID
      chatList: storage.chats[storage.currentChatId] || [],  // 当前会话消息列表
      chats: storage.chats,                      // 所有会话数据
      chatIds: Object.keys(storage.chats),       // 所有会话ID数组
      systemPrompt: finalPrompt                  // 系统提示词
    }, this.scrollToBottom);                     // 设置完成后滚动到底部
  },

  // 获取并格式化账单数据
  async getFormattedBills() {
    try {
      // 获取云数据库引用
      const db = wx.cloud.database();
      // 查询账单数据，按日期和创建时间降序排列
      const res = await db.collection('bills')
                        .orderBy('date', 'desc')
                        .orderBy('createTime', 'desc')
                        .get();
      
      // 如果没有账单数据，返回提示
      if (!res.data || res.data.length === 0) {
        return "当前没有账单记录";
      }
  
      // 格式化每条账单记录为字符串
      return res.data.map(bill => {
        const date = bill.date || '日期未知';                 // 日期
        const type = bill.type === 'income' ? '收入' : '支出'; // 类型
        const category = bill.category || '未分类';           // 分类
        const amount = bill.amount?.toFixed(2) || '0.00';    // 金额
        const note = bill.note ? ` [备注：${bill.note}]` : ''; // 备注
        
        // 格式化输出示例：2025-07-03 支出 餐饮 ¥75.00 [备注：555]
        return `${date} ${type} ${category} ¥${amount}${note}`;
      }).join('\n');  // 用换行符连接所有账单记录
  
    } catch (error) {
      console.error('获取账单失败:', error);
      return `获取账单失败: ${error.errMsg || error.message}`;
    }
  },

  // 格式化心情数据为提示词
  listRawMoods(moodData) {
    // 如果没有心情数据，返回提示
    if (!moodData || Object.keys(moodData).length === 0) {
      return "当前无心情数据";
    }
  
    let output = "心情记录（原始数据）:\n\n";
    
    // 按日期排序后列出心情记录
    Object.keys(moodData)
      .sort((a, b) => new Date(a) - new Date(b))  // 按日期升序排序
      .forEach(date => {
        output += `${date}: ${moodData[date]}\n`;  // 格式：日期: 心情
      });
  
    return output;
  },

  // 格式化任务数据为提示词
  listRawTasks(tasks) {
    // 如果没有任务数据，返回提示
    if (!tasks || tasks.length === 0) return "当前无任务数据";
  
    let output = "任务列表（原始数据）:\n\n";
    
    // 遍历所有任务，格式化输出
    tasks.forEach((task, index) => {
      output += `任务 ${index + 1}:\n` +
        `- 名称: ${task.name || "空"}\n` +                  // 任务名称
        `- 是否完成: ${task.completed ? "✓" : "✗"}\n` +     // 完成状态
        `- 截止日期: ${task.date || "无"}\n` +              // 截止日期
        `- 象限: ${task.quadrant} ` +                       // 象限数字
          `(${this.getQuadrantName(task.quadrant)})\n` +    // 象限描述
        `- 重复类型: ${task.repeatType} ` +                 // 重复类型数字
          `(${this.getRepeatTypeName(task.repeatType)})\n` + // 重复类型描述
        `- ID: ${task.id}\n\n`;                             // 任务ID
    });
  
    return output;
  },
  
  // 辅助函数：将象限数字转换为文字描述
  getQuadrantName(quadrant) {
    const names = ["紧急重要", "不紧急重要", "紧急不重要", "不紧急不重要"];
    return names[quadrant - 1] || "未知象限";  // 数组索引从0开始，quadrant从1开始
  },
  
  // 辅助函数：将重复类型数字转换为文字描述
  getRepeatTypeName(type) {
    const names = ["一次性", "每日", "每周"];
    return names[type] || "未知类型";  // 直接使用type作为索引
  },

  // 切换会话列表侧边栏的显示状态
  toggleChatList() {
    this.setData({ showChatList: !this.data.showChatList });
  },

  // 关闭会话列表侧边栏
  closeChatList() {
    this.setData({ showChatList: false });
  },

  // 切换当前会话
  switchChat(e) {
    const id = e.currentTarget.dataset.id;  // 获取点击的会话ID
    
    // 如果点击的是当前会话，只关闭侧边栏
    if (id === this.data.currentChatId) {
      this.closeChatList();
      return;
    }
    
    // 从本地缓存获取会话数据
    const storage = wx.getStorageSync('multi-chat') || { chats: {}, currentChatId: '', systemPrompts: {} };
    
    // 更新页面数据
    this.setData({
      currentChatId: id,  // 设置新的当前会话ID
      chatList: this.data.chats[id] || [],  // 加载该会话的消息列表
      showChatList: false,  // 关闭侧边栏
      systemPrompt: storage.systemPrompts[id] || this.data.systemPrompt  // 加载该会话的系统提示词
    }, this.scrollToBottom);  // 滚动到底部
  },

  // 输入框内容变化时触发
  onInput(e) {
    this.setData({ inputValue: e.detail.value });  // 更新输入框的值
  },

  // 系统提示词输入框内容变化时触发
  onSystemPromptInput(e) {
    this.setData({ systemPrompt: e.detail.value });  // 更新系统提示词
  },

  // 保存系统提示词
  saveSystemPrompt() {
    // 从本地缓存获取会话数据
    const storage = wx.getStorageSync('multi-chat') || { chats: {}, currentChatId: '', systemPrompts: {} };
    
    // 如果systemPrompts不存在则初始化
    if (!storage.systemPrompts) {
      storage.systemPrompts = {};
    }
    
    // 保存当前会话的系统提示词
    storage.systemPrompts[this.data.currentChatId] = this.data.systemPrompt;
    
    // 更新本地缓存
    wx.setStorageSync('multi-chat', storage);
    
    // 显示保存成功的提示
    wx.showToast({
      title: '系统提示已保存',
      icon: 'success'
    });
  },

  // 发送消息
  async onSend() {
    const question = this.data.inputValue.trim();  // 获取并清理输入内容
    if (!question) return;  // 如果内容为空则直接返回

    // 将用户消息添加到聊天列表
    const chatList = [...this.data.chatList, {
      role: 'user',          // 消息角色：用户
      content: question,     // 原始内容
      displayText: question  // 显示内容（用于打字机效果）
    }];

    // 更新聊天列表并清空输入框
    this.setData({ chatList, inputValue: '' }, this.scrollToBottom);
    
    // 保存当前会话
    this.saveCurrentChat(chatList);

    // 显示"正在思考"的提示
    this.typingEffect("正在思考中...", "ai");

    // 获取AI回复
    const reply = await this.getAIReply(question);
    
    // 使用打字机效果显示AI回复
    this.typingEffect(reply, "ai");
  },

  // 打字机效果显示消息
  typingEffect(text, role, autoRemove = false) {
    let index = 0;  // 当前显示到的字符索引
    
    // 创建新消息对象
    const current = { 
      role,          // 消息角色
      content: text, // 完整内容
      displayText: '' // 当前显示的内容
    };
    
    // 将新消息添加到聊天列表
    const chatList = [...this.data.chatList, current];
    this.setData({ chatList }, this.scrollToBottom);

    // 设置定时器逐步显示文字
    const timer = setInterval(() => {
      if (index >= text.length) {
        clearInterval(timer);  // 文字显示完成后清除定时器

        if (autoRemove) {
          // 如果是自动移除的消息，则删除最后一条
          const newList = [...this.data.chatList];
          newList.pop();
          this.setData({ chatList: newList }, this.scrollToBottom);
        } else {
          // 否则保存当前会话
          this.saveCurrentChat(this.data.chatList);
        }

        return;
      }
      
      // 逐步增加显示的文字
      current.displayText += text[index++];
      this.setData({ chatList }, this.scrollToBottom);
    }, 30);  // 每30毫秒显示一个字符
  },

  // 滚动到聊天底部
  scrollToBottom() {
    wx.pageScrollTo({
      scrollTop: 99999,  // 设置一个足够大的值确保滚动到底部
      duration: 100       // 滚动动画时间100毫秒
    });
  },

  // 保存当前会话
  saveCurrentChat(chatList) {
    // 从本地缓存获取会话数据
    const storage = wx.getStorageSync('multi-chat') || { 
      chats: {}, 
      currentChatId: '', 
      systemPrompts: {} 
    };
    
    // 更新当前会话的消息列表
    storage.chats[this.data.currentChatId] = chatList;
    storage.currentChatId = this.data.currentChatId;
    
    // 保存到本地缓存
    wx.setStorageSync('multi-chat', storage);

    // 更新页面数据
    this.setData({
      chats: storage.chats,                     // 所有会话数据
      chatIds: Object.keys(storage.chats)      // 所有会话ID
    });
  },

  // 获取AI回复
  async getAIReply(text) {
    // 构建消息历史，包括系统提示
    const messages = [
      { role: 'system', content: this.data.systemPrompt }  // 系统提示词
    ];
    
    // 添加历史消息（只保留最近的10条以避免token超限）
    const historyMessages = this.data.chatList.slice(-10).map(item => ({
      role: item.role === 'user' ? 'user' : 'assistant',  // 统一角色名称
      content: item.content                              // 消息内容
    }));
    
    messages.push(...historyMessages);  // 添加历史消息
    
    // 添加当前用户消息
    messages.push({ role: 'user', content: text });
  
    try {
      console.log(messages);  // 打印发送的消息结构，用于调试
      
      // 使用Promise封装wx.request，方便使用await
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: 'https://api.deepseek.com/v1/chat/completions',  // AI API地址
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer sk-959b91a2cd594093abfb1b087ce47766' // API Key
          },
          data: {
            model: 'deepseek-chat',  // 使用的模型
            messages,                // 消息历史
            temperature: 0.7,       // 创造性参数
            max_tokens: 2000        // 最大token数
          },
          success: res => {
            if (res.statusCode === 200) {
              resolve(res.data);    // 请求成功时解析数据
            } else {
              reject(new Error('API 返回状态码非200: ' + res.statusCode));
            }
          },
          fail: err => reject(err)  // 请求失败时拒绝
        });
      });
  
      // 从API响应中提取回复文本
      const replyText = res.choices && res.choices[0]?.message?.content;
      if (replyText) {
        return replyText;  // 返回AI回复
      } else {
        return 'AI未返回有效内容';  // 处理空回复
      }
    } catch (error) {
      console.error('调用AI接口失败:', error);
      return '请求AI服务失败，请稍后重试';  // 错误处理
    }
  },
  
  // 新建聊天会话
  createNewChat() {
    const newId = 'chat_' + Date.now();  // 使用时间戳生成唯一ID
    
    // 从本地缓存获取会话数据
    const storage = wx.getStorageSync('multi-chat') || { 
      chats: {}, 
      currentChatId: '', 
      systemPrompts: {} 
    };
    
    // 设置新会话为当前会话
    storage.currentChatId = newId;
    storage.chats[newId] = [];  // 初始化空消息列表
    storage.systemPrompts[newId] = this.data.systemPrompt;  // 使用当前系统提示词
    
    // 保存到本地缓存
    wx.setStorageSync('multi-chat', storage);
    
    // 更新页面数据
    this.setData({
      currentChatId: newId,      // 设置新会话ID
      chatList: [],             // 清空消息列表
      chats: storage.chats,     // 更新所有会话数据
      chatIds: Object.keys(storage.chats),  // 更新会话ID列表
      showChatList: false,      // 关闭侧边栏
      systemPrompt: storage.systemPrompts[newId]  // 设置系统提示词
    });
  }
});