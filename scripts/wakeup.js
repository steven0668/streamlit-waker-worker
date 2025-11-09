// scripts/wakeup.js
const puppeteer = require('puppeteer');

const urls = [
  'https://blank-app-0668-01.streamlit.app/',
  // 'https://another-app.streamlit.app/',
  // 'https://third-app.streamlit.app/',
];

async function wakeupApp(url) {
  console.log(`正在唤醒: ${url}`);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
  );

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    const buttonSelector = 'button:has-text("Yes, get this app back up!")';
    const button = await page.waitForSelector(buttonSelector, { timeout: 10000 }).catch(() => null);

    if (button) {
      console.log('检测到睡眠按钮，点击唤醒...');
      await button.click();
      console.log('点击成功，等待 10 秒让应用恢复...');
      await page.waitForTimeout(10000);
      console.log('唤醒完成！');
    } else {
      console.log('未检测到睡眠按钮，应用可能已激活');
    }

    // 可选：截图留证
    // await page.screenshot({ path: `screenshot-${Date.now()}.jpg` });

  } catch (error) {
    console.error(`唤醒失败 ${url}:`, error.message);
  } finally {
    await browser.close();
  }
}

(async () => {
  for (const url of urls) {
    await wakeupApp(url);
    await new Promise(r => setTimeout(r, 2000)); // 间隔 2 秒防请求过快
  }
  console.log('所有应用唤醒任务完成');
})();
