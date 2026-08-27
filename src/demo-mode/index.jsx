// demo-mode: iframe 内原型与外部 demo.html 的通信层

// 监听 hash 变化，向父窗口发送消息
const onHashChange = () => {
  const hash = window.location.hash.slice(1).split('/')[0];
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'page-change', hash }, '*');
  }
};

window.addEventListener('hashchange', onHashChange);

// 监听父窗口跳转指令
window.addEventListener('message', (e) => {
  if (e.data.type === 'navigate') {
    window.location.hash = e.data.hash;
  }
});

// 初始发送当前页面
onHashChange();