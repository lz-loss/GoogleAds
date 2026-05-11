const Koa = require('koa');
const Router = require('koa-router');
const views = require('koa-views');
const serve = require('koa-static');
const path = require('path');
const https = require('https');
const fs = require('fs');

const app = new Koa();
const router = new Router();
const transform = require('./transform');

// 配置模板引擎
app.use(views(path.join(__dirname, 'views'), {
  extension: 'ejs'
}));

// 静态资源服务
app.use(serve(path.join(__dirname, 'public')));

async function renderHomePage(ctx) {
  // 调用 transform.js 中的函数，将 Excel 文件转换为 JSON 文件
  await transform.main();

  await ctx.render('index', {});
}

app.use(async (ctx, next) => {
  if ((ctx.method === 'GET' || ctx.method === 'HEAD') && (ctx.path === '/aw/reporteditor' || ctx.path.startsWith('/aw/reporteditor/'))) {
    await renderHomePage(ctx);
    return;
  }

  await next();
});

// 路由配置
router.get('/', renderHomePage);

router.get('/aw/reporteditor/view', renderHomePage);

async function renderGoogleAdsPage(ctx, page) {
  await transform.googleAdsMain();
  await ctx.render('google_ads', { page });
}

router.get('/aw/campaigns', async (ctx) => {
  await renderGoogleAdsPage(ctx, 'campaigns');
});

router.get('/aw/adgroups', async (ctx) => {
  await renderGoogleAdsPage(ctx, 'adgroups');
});

router.get('/aw/adassets', async (ctx) => {
  await renderGoogleAdsPage(ctx, 'adassets');
});

router.get('/adsmanager/reporting/manage', async (ctx) => {
  await ctx.render('manage', {});
});
router.get('/adsmanager/reporting/business_view', async (ctx) => {
  await ctx.render('business_view', {});
});

// 注册路由
app.use(router.routes());
app.use(router.allowedMethods());

// HTTPS 配置
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, 'ssl', 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'ssl', 'cert.pem'))
};

// 启动 HTTPS 服务器
const HTTPS_PORT = process.env.PORT || 443;
https.createServer(sslOptions, app.callback()).listen(HTTPS_PORT, () => {
  console.log(`HTTPS Server is running on https://ads.google.com:${HTTPS_PORT}`);
  console.log(`HTTPS Server is running on https://localhost:${HTTPS_PORT}`);
});
