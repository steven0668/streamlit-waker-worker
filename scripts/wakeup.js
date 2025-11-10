// runner-once.js
import puppeteer from 'puppeteer';

// 配置
const TARGET_URLS_RAW = process.env.TARGET_URLS || '';
const HEADLESS = process.env.HEADLESS !== 'false'; // 默认 true
const CLICK_DELAY_MS = parseInt(process.env.CLICK_DELAY || '20000'); // 点击后等待
const PAGE_TIMEOUT_MS = 180000;
const SELECTOR_TIMEOUT_MS = 20000;

// 解析 URL
const TARGET_URLS = TARGET_URLS_RAW
  .split(',')
  .map(u => u.trim())
  .filter(u => u.startsWith('http'));

if (TARGET_URLS.length === 0) {
  console.error('错误: 未提供有效的 TARGET_URLS');
  console.log('用法示例:');
  console.log('  TARGET_URLS="https://app1...,https://app2..." node runner-once.js');
  process.exit(1);
}

const delay = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log(`\n一次性唤醒服务启动`);
  console.log(`目标数量: ${TARGET_URLS.length}`);
  console.log(`无头模式: ${HEADLESS ? '是' : '否'}`);
  console.log(`点击后等待: ${CLICK_DELAY_MS / 1000}s\n`);

  const browser = await puppeteer.launch({
    headless: HEADLESS,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-features=IsolateOrigins,site-per-process',
    ],
  });

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < TARGET_URLS.length; i++) {
    const url = TARGET_URLS[i];
    const start = Date.now();
    console.log(`\n[${i + 1}/${TARGET_URLS.length}] 唤醒 → ${url}`);

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    let success = false;
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: PAGE_TIMEOUT_MS });
      console.log('  页面加载成功');

      const btn = await page.waitForSelector(
        `button[data-testid="wakeup-button-owner"]`,
        { timeout: SELECTOR_TIMEOUT_MS }
      ).catch(() => null);

      if (btn) {
        console.log('  检测到唤醒按钮 → 点击');
        await btn.click();
        await delay(CLICK_DELAY_MS);
        console.log(`  等待 ${CLICK_DELAY_MS / 1000}s 完成`);
        success = true;
      } else {
        console.log('  未找到按钮（可能已激活）');
        success = true; // 视作成功（已唤醒）
      }
    } catch (err) {
      console.error(`  失败: ${err.message}`);
      failCount++;
    } finally {
      await page.close();
      const duration = ((Date.now() - start) / 1000).toFixed(1);
      console.log(`  耗时: ${duration}s ${success ? '成功' : '失败'}`);
      if (success) successCount++;
    }

    // 每个站点间稍作休息
    if (i < TARGET_URLS.length - 1) await delay(3000);
  }

  await browser.close();

  // 总结
  console.log('\n' + '='.repeat(50));
  console.log(`一次性唤醒完成`);
  console.log(`成功: ${successCount} | 失败: ${failCount} | 总计: ${TARGET_URLS.length}`);
  console.log(`结束时间: ${new Date().toLocaleString()}`);
  console.log('='.repeat(50));

  process.exit(failCount > 0 ? 1 : 0); // 非零退出码表示有失败
})();
