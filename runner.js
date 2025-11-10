// runner.js
import puppeteer from 'puppeteer';

// 配置（可通过环境变量覆盖）
const INTERVAL_MINUTES = parseInt(process.env.WAKEUP_INTERVAL || '30');
const TARGET_URL = process.env.TARGET_URL || 'https://blank-app-0668-01.streamlit.app/';
const HEADLESS = process.env.HEADLESS !== 'false'; // 默认 true

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  console.log(`启动唤醒服务`);
  console.log(`目标: ${TARGET_URL}`);
  console.log(`间隔: ${INTERVAL_MINUTES} 分钟`);
  console.log(`无头模式: ${HEADLESS ? '是' : '否（会弹出浏览器）'}`);

  const browser = await puppeteer.launch({
    headless: HEADLESS,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  });

  const run = async () => {
    console.log(`\n[${new Date().toLocaleString()}] 开始唤醒`);
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    try {
      await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 180000 });
      console.log('页面已加载');

      const btn = await page.waitForSelector(
	`button[data-testid="wakeup-button-viewer"]`,
        { timeout: 20000 }
      ).catch(() => null);

      if (btn) {
        console.log('检测到应用未唤醒, 点击按钮...');
        await btn.click();
        console.log('等待 20 秒...');
        await delay(20000);
        console.log('唤醒完成');
      } else {
        console.log('未检测到按钮（可能已激活或异常）');
      }

    } catch (err) {
      console.error('错误:', err.message);
    } finally {
      await page.close();
    }
  };

  // 立即运行一次
  await run();

  // 周期运行
  setInterval(run, INTERVAL_MINUTES * 60 * 1000);

  console.log(`服务运行中，每 ${INTERVAL_MINUTES} 分钟执行一次`);
})();
