// runner.js
import puppeteer from 'puppeteer';

// 配置（支持多个 URL）
const INTERVAL_MINUTES = parseInt(process.env.WAKEUP_INTERVAL || '30');
const TARGET_URLS_RAW = process.env.TARGET_URLS || '';
const HEADLESS = process.env.HEADLESS !== 'false'; // 默认 true

// 解析多个 URL（逗号分隔，支持空格）
const TARGET_URLS = TARGET_URLS_RAW
  .split(',')
  .map(url => url.trim())
  .filter(url => url.startsWith('http'))
  .filter(Boolean);

if (TARGET_URLS.length === 0) {
  console.error('错误: 未配置有效的 TARGET_URLS');
  process.exit(1);
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  console.log(`启动多目标唤醒服务`);
  console.log(`目标数量: ${TARGET_URLS.length}`);
  console.log(`目标列表:`);
  TARGET_URLS.forEach((url, i) => console.log(`  [${i + 1}] ${url}`));
  console.log(`唤醒间隔: ${INTERVAL_MINUTES} 分钟`);
  console.log(`无头模式: ${HEADLESS ? '是' : '否'}`);

  const browser = await puppeteer.launch({
    headless: HEADLESS,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-features=IsolateOrigins,site-per-process',
    ],
  });

  const wakeupOne = async (url) => {
    const startTime = Date.now();
    console.log(`\n[${new Date().toLocaleString()}] 唤醒 → ${url}`);
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 180000 });
      console.log('  页面已加载');

      // 注意：这里用你之前问的正确选择器
      const btn = await page.waitForSelector(
        `button[data-testid="wakeup-button-owner"]`,
        { timeout: 20000 }
      ).catch(() => null);

      if (btn) {
        console.log('  检测到“唤醒”按钮，点击中...');
        await btn.click();
        await delay(20000); // 等待应用启动
        console.log('  唤醒成功');
      } else {
        console.log('  未找到按钮（可能已激活）');
      }
    } catch (err) {
      console.error(`  失败: ${err.message}`);
    } finally {
      await page.close();
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`  耗时: ${duration}s`);
    }
  };

  // 唤醒所有目标（串行，避免资源爆炸）
  const runAll = async () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`开始第 ${new Date().toLocaleString()} 的唤醒轮次`);
    console.log(`${'='.repeat(60)}`);

    for (const url of TARGET_URLS) {
      await wakeupOne(url);
      // 可选：每个站点之间稍作延迟，避免被风控
      await delay(5000);
    }
  };

  // 立即执行一次
  await runAll();

  // 定时执行
  setInterval(runAll, INTERVAL_MINUTES * 60 * 1000);

  console.log(`\n服务已启动，每 ${INTERVAL_MINUTES} 分钟唤醒 ${TARGET_URLS.length} 个应用`);
})();
