// ====== 配置区 ======
// 1. 你的 Streamlit 链接
const URLS = [
  "https://blank-app-0668-01.streamlit.app/"
  // 在这里继续添加链接
];

// 2. 设置你的访问密码（建议 16 位以上，字母+数字+符号）
const ACCESS_KEY = "Fba888.";  // ← 改成你自己的！

// ====== 核心函数 ======
async function runWakeUp(env) {
  const results = await Promise.allSettled(
    URLS.map(url => wakeApp(url.trim(), env.BROWSER))
  );

  const logs = results.map((r, i) => {
    const status = r.status === 'fulfilled' ? '成功' : '失败';
    const msg = r.status === 'fulfilled' ? r.value : r.reason;
    return `${status} ${URLS[i]} → ${msg}`;
  });

  logs.forEach(log => console.log(log));
  return logs.join('\n');
}

async function wakeApp(url, browserBinding) {
  const browser = await browserBinding.launch();
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    const button = await page.waitForSelector(
      'button:has-text("Yes, get this app back up!")',
      { timeout: 8000 }
    ).catch(() => null);

    if (button) {
      await button.click();
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 12000 }).catch(() => {});
      await browser.close();
      return '已唤醒';
    } else {
      await browser.close();
      return '已活跃';
    }
  } catch (e) {
    await browser.close();
    throw e.message || '访问失败';
  }
}

// ====== 导出双触发 ======
export default {
  // 1. 定时运行（每 5 分钟）
  async scheduled(event, env, ctx) {
    await runWakeUp(env);
  },

  // 2. 浏览器访问（需密码）
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 检查密码
    const providedKey = url.searchParams.get('key');
    if (providedKey !== ACCESS_KEY) {
      return new Response('Forbidden: Invalid or missing key', { 
        status: 403,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    const startTime = Date.now();
    const logOutput = await runWakeUp(env);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    return new Response(`
      <!DOCTYPE html>
      <html><head>
        <meta charset="utf-8">
        <title>Streamlit 唤醒器（已保护）</title>
        <style>
          body {font-family:system-ui,sans-serif;margin:2rem;background:#f4f4f4}
          .container {max-width:800px;margin:auto;background:white;padding:2rem;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1)}
          h1 {color:#ff6b35}
          pre {background:#f0f0f0;padding:1rem;border-radius:8px;overflow-x:auto}
          .footer {margin-top:2rem;font-size:0.9em;color:#666}
          button {background:#ff6b35;color:white;border:none;padding:0.8rem 1.5rem;border-radius:8px;font-size:1rem;cursor:pointer}
          button:hover {background:#e55a2b}
          .locked {color:#d00; font-weight:bold}
        </style>
      </head><body>
        <div class="container">
          <h1>Streamlit 唤醒器 <span class="locked">[已保护]</span></h1>
          <p><strong>执行时间：</strong> ${new Date().toLocaleString()}</p>
          <p><strong>耗时：</strong> ${duration} 秒</p>
          <pre>${logOutput}</pre>
          <p>
            <button onclick="location.href='?key=${ACCESS_KEY}'">重新运行一次</button>
          </p>
          <div class="footer">
            每 5 分钟自动运行 · 浏览器访问需 key 参数
          </div>
        </div>
      </body></html>
    `, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
};