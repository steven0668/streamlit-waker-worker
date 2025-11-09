// wakeup.js
const puppeteer = require('puppeteer');

const urls = [
  'https://blank-app-0668-01.streamlit.app/',
  // 'https://nathan0668-web.hf.space/',
  // 'https://silasvivid-web.hf.space/'
  // 添加更多链接
];

(async () => {
  const browser = await puppeteer.launch({
    headless: false,        // 调试时看得到浏览器
    defaultViewport: null,
    args: ['--start-maximized'],
  });

  for (const url of urls) {
    console.log(`\n正在唤醒: ${url}`);
    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    );

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      console.log('页面加载完成');

      // 查找按钮
      const buttonSelector = `button`;
      const button = await page.waitForSelector(buttonSelector, { timeout: 10000 }).catch(() => null);

      if (button) {
        console.log('检测到按钮，点击中...');
        await button.click();
        console.log('点击成功，等待 10 秒...');

        // 兼容写法：替代 waitForTimeout
        await new Promise(resolve => setTimeout(resolve, 10000));

        console.log('等待完成！');

        // 截图
        // const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        // const screenshotPath = `screenshot-${timestamp}.jpg`;
        // await page.screenshot({ path: screenshotPath, quality: 80 });
        // console.log(`截图保存: ${screenshotPath}`);
      } else {
        console.log('未检测到按钮，应用可能已激活');
        // await page.screenshot({ path: `active-${Date.now()}.jpg` });
      }

    } catch (error) {
      console.error(`唤醒失败 ${url}:`, error.message);
    } finally {
      await page.close();
      // 间隔 2 秒
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log('\n所有任务完成！');
  await browser.close();
})();
