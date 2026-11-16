// build.py 가 만든 career.html 을 A4 PDF 로 만든다 (글꼴은 Google Fonts 의 나눔명조·나눔고딕을 내장)
//   python3 tools/career_pdf/build.py tools/career_pdf && node tools/career_pdf/render.js tools/career_pdf
const path = require('path');
const { chromium } = require('playwright');
(async () => {
  const dir = path.resolve(process.argv[2] || __dirname);
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + dir + '/career.html', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: dir + '/김진용_경력기술서.pdf', printBackground: true, preferCSSPageSize: true });
  await b.close();
  console.log('saved', dir + '/김진용_경력기술서.pdf');
})();
