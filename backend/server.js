const http = require("http");
const { URL } = require("url");
const { readStore, updateStore } = require("./lib/store");

const PORT = process.env.PORT || 8787;
const EASTMONEY_QUOTE_URL = "https://push2.eastmoney.com/api/qt/stock/get";
const SINA_QUOTE_URL = "https://hq.sinajs.cn/list=";

const quoteBook = {
  "000001": { code: "000001.SZ", name: "平安银行", price: 11.24, atr: 0.31, change: -0.62 },
  "000333": { code: "000333.SZ", name: "美的集团", price: 64.88, atr: 1.42, change: 0.96 },
  "000617": { code: "000617.SZ", name: "中油资本", price: 7.38, atr: 0.18, change: 1.24 },
  "000858": { code: "000858.SZ", name: "五粮液", price: 133.64, atr: 3.26, change: -0.48 },
  "001289": { code: "001289.SZ", name: "龙源电力", price: 18.34, atr: 0.62, change: 0.71 },
  "002142": { code: "002142.SZ", name: "宁波银行", price: 23.41, atr: 0.53, change: 0.31 },
  "002230": { code: "002230.SZ", name: "科大讯飞", price: 45.62, atr: 1.78, change: 2.14 },
  "002436": { code: "002436.SZ", name: "兴森科技", price: 36.82, atr: 1.74, change: -1.08 },
  "002460": { code: "002460.SZ", name: "赣锋锂业", price: 33.75, atr: 1.15, change: -0.94 },
  "002533": { code: "002533.SZ", name: "金杯电工", price: 11.67, atr: 0.42, change: -0.26 },
  "300059": { code: "300059.SZ", name: "东方财富", price: 13.26, atr: 0.37, change: 0.84 },
  "300308": { code: "300308.SZ", name: "中际旭创", price: 145.8, atr: 5.4, change: 1.73 },
  "300750": { code: "300750.SZ", name: "宁德时代", price: 212.8, atr: 6.8, change: 1.16 },
  "300760": { code: "300760.SZ", name: "迈瑞医疗", price: 287.45, atr: 7.32, change: -0.41 },
  "600000": { code: "600000.SH", name: "浦发银行", price: 8.56, atr: 0.17, change: 0.23 },
  "600036": { code: "600036.SH", name: "招商银行", price: 43.18, atr: 0.96, change: 0.68 },
  "600519": { code: "600519.SH", name: "贵州茅台", price: 1478.2, atr: 35.4, change: 0.55 },
  "600809": { code: "600809.SH", name: "山西汾酒", price: 218.7, atr: 5.62, change: -0.38 },
  "601012": { code: "601012.SH", name: "隆基绿能", price: 16.92, atr: 0.51, change: -0.71 },
  "601318": { code: "601318.SH", name: "中国平安", price: 53.27, atr: 1.03, change: 0.42 },
  "601398": { code: "601398.SH", name: "工商银行", price: 6.91, atr: 0.12, change: 0.15 },
  "601899": { code: "601899.SH", name: "紫金矿业", price: 18.43, atr: 0.47, change: 1.38 },
  "603259": { code: "603259.SH", name: "药明康德", price: 45.37, atr: 1.56, change: -0.83 },
  "688041": { code: "688041.SH", name: "海光信息", price: 128.64, atr: 4.15, change: 2.02 }
};

const legacyNameMap = {
  "Xingsen Technology": "兴森科技",
  "Golden Cup Electric": "金杯电工",
  CATL: "宁德时代",
  "Ping An Bank": "平安银行",
  "Midea Group": "美的集团",
  "East Money": "东方财富",
  "China Merchants Bank": "招商银行",
  "Kweichow Moutai": "贵州茅台",
  "Ping An Insurance": "中国平安",
  "Zijin Mining": "紫金矿业"
};

function json(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(payload));
}

function normalizeDigits(rawCode) {
  return String(rawCode || "").replace(/\D/g, "").slice(0, 6);
}

function normalizeCode(rawCode) {
  const digits = normalizeDigits(rawCode);
  if (digits.length !== 6) return null;
  const suffix = digits.startsWith("6") || digits.startsWith("688") ? "SH" : "SZ";
  return `${digits}.${suffix}`;
}

function isFallbackName(name) {
  return !name || /Simulated Quote|模拟行情|待行情源返回/.test(String(name));
}

function normalizeStoredItem(item, kind) {
  const digits = normalizeDigits(item?.code);
  const known = quoteBook[digits];
  const normalized = {
    ...item,
    id: item?.id || `${kind}-${digits || Date.now()}`,
    code: normalizeCode(digits) || item?.code,
    name: legacyNameMap[item?.name] || item?.name || known?.name || "待行情源返回名称"
  };

  if (known && isFallbackName(normalized.name)) {
    normalized.name = known.name;
  }

  if (known && (!Number.isFinite(Number(normalized.price)) || Number(normalized.price) <= 0 || /Simulated Quote/.test(String(item?.name)))) {
    normalized.price = known.price;
    normalized.atr = known.atr;
    normalized.change = known.change;
  }

  return normalized;
}

function dedupeStoredItems(items, kind) {
  const seen = new Set();
  return (items || [])
    .map((item) => normalizeStoredItem(item, kind))
    .filter((item) => {
      const digits = normalizeDigits(item.code);
      if (digits.length !== 6 || seen.has(digits)) return false;
      seen.add(digits);
      return true;
    });
}

function toSecid(rawCode) {
  const digits = normalizeDigits(rawCode);
  if (digits.length !== 6) return null;
  return digits.startsWith("6") || digits.startsWith("688") ? `1.${digits}` : `0.${digits}`;
}

function fallbackQuote(rawCode) {
  const digits = normalizeDigits(rawCode);
  if (digits.length !== 6) return null;
  if (quoteBook[digits]) {
    return {
      ...quoteBook[digits],
      source: "fallback"
    };
  }
  const seed = digits.split("").reduce((sum, char) => sum + Number(char), 0);
  const price = Number((8 + (seed % 42) + (seed % 10) / 10).toFixed(2));
  return {
    code: normalizeCode(digits),
    name: "待行情源返回名称",
    price,
    atr: Number(Math.max(price * 0.035, 0.12).toFixed(2)),
    change: 0,
    source: "fallback"
  };
}

function toSinaSymbol(rawCode) {
  const digits = normalizeDigits(rawCode);
  if (digits.length !== 6) return null;
  const prefix = digits.startsWith("6") || digits.startsWith("688") ? "sh" : "sz";
  return `${prefix}${digits}`;
}

async function fetchEastmoneyQuoteBySecid(secid, fallbackCode) {
  const params = new URLSearchParams({
    secid,
    fields: "f43,f57,f58,f169,f170"
  });
  const response = await fetch(`${EASTMONEY_QUOTE_URL}?${params.toString()}`, {
    headers: {
      "User-Agent": "stock-discipline-assistant/1.0"
    }
  });
  if (!response.ok) {
    throw new Error(`Quote HTTP ${response.status}`);
  }
  const payload = await response.json();
  const data = payload?.data;
  if (!data || !data.f43) {
    throw new Error("Quote payload missing");
  }
  const price = Number(data.f43) / 100;
  return {
    code: fallbackCode || normalizeCode(String(data.f57 || "").slice(0, 6)),
    name: data.f58 || "待行情源返回名称",
    price,
    atr: Number(Math.max(price * 0.035, 0.12).toFixed(2)),
    change: Number((Number(data.f170 || 0) / 100).toFixed(2)),
    source: "eastmoney"
  };
}

function decodeSinaText(buffer) {
  try {
    return new TextDecoder("gb18030").decode(buffer);
  } catch {
    return new TextDecoder("gbk").decode(buffer);
  }
}

async function fetchSinaQuote(rawCode) {
  const digits = normalizeDigits(rawCode);
  const symbol = toSinaSymbol(digits);
  if (!symbol) throw new Error("Invalid Sina symbol");
  const response = await fetch(`${SINA_QUOTE_URL}${symbol}`, {
    headers: {
      Referer: "https://finance.sina.com.cn",
      "User-Agent": "Mozilla/5.0 stock-discipline-assistant/1.0"
    }
  });
  if (!response.ok) throw new Error(`Sina HTTP ${response.status}`);
  const text = decodeSinaText(await response.arrayBuffer());
  const match = text.match(/="([^"]*)"/);
  if (!match || !match[1]) throw new Error("Sina payload missing");
  const parts = match[1].split(",");
  const name = parts[0];
  const open = Number(parts[1]);
  const prevClose = Number(parts[2]);
  const current = Number(parts[3]);
  if (!name || !(current > 0)) throw new Error("Sina quote invalid");
  const change = prevClose > 0 ? Number((((current - prevClose) / prevClose) * 100).toFixed(2)) : 0;
  return {
    code: normalizeCode(digits),
    name,
    price: current,
    atr: Number(Math.max(current * 0.035, 0.12).toFixed(2)),
    change,
    open,
    source: "sina"
  };
}

async function fetchSinaIndex(symbol, code, name) {
  const response = await fetch(`${SINA_QUOTE_URL}${symbol}`, {
    headers: {
      Referer: "https://finance.sina.com.cn",
      "User-Agent": "Mozilla/5.0 stock-discipline-assistant/1.0"
    }
  });
  if (!response.ok) throw new Error(`Sina index HTTP ${response.status}`);
  const text = decodeSinaText(await response.arrayBuffer());
  const match = text.match(/="([^"]*)"/);
  if (!match || !match[1]) throw new Error("Sina index payload missing");
  const parts = match[1].split(",");
  const current = Number(parts[1]);
  const change = Number(parts[3]);
  if (!(current > 0)) throw new Error("Sina index invalid");
  return {
    code,
    name: name || parts[0] || code,
    price: current,
    change: Number(change.toFixed(2)),
    source: "sina"
  };
}

async function hs300Snapshot() {
  try {
    const quote = await fetchEastmoneyQuoteBySecid("1.000300", "000300.SH");
    return {
      code: "000300.SH",
      name: "沪深300",
      price: quote.price,
      change: quote.change,
      source: quote.source
    };
  } catch {
    try {
      return await fetchSinaIndex("sh000300", "000300.SH", "沪深300");
    } catch {
      return {
        code: "000300.SH",
        name: "沪深300",
        price: 3512.63,
        change: 0.18,
        source: "fallback"
      };
    }
  }
}

async function quoteForCode(rawCode) {
  const digits = normalizeDigits(rawCode);
  if (digits.length !== 6) return null;
  try {
    return await fetchEastmoneyQuoteBySecid(toSecid(digits), normalizeCode(digits));
  } catch (eastmoneyError) {
    try {
      return await fetchSinaQuote(digits);
    } catch {
      return fallbackQuote(digits);
    }
  }
}

async function marketSnapshot() {
  return {
    hs300: await hs300Snapshot()
  };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) reject(new Error("Body too large"));
    });
    req.on("end", () => {
      if (!data) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function recordEvent(store, name, payload) {
  if (!Array.isArray(store.events)) {
    store.events = [];
  }
  store.events.unshift({
    id: makeId("event"),
    name,
    payload,
    createdAt: new Date().toISOString()
  });
  store.events = store.events.slice(0, 300);
  return store;
}

function ensureStoreLists(store) {
  if (!Array.isArray(store.positions)) store.positions = [];
  if (!Array.isArray(store.watchlist)) store.watchlist = [];
  if (!Array.isArray(store.feedback)) store.feedback = [];
  if (!Array.isArray(store.events)) store.events = [];
  return store;
}

async function hydratePositions(items) {
  const next = [];
  for (const item of dedupeStoredItems(items, "pos")) {
    const live = await quoteForCode(item.code);
    const fallback = quoteBook[normalizeDigits(item.code)];
    next.push({
      ...item,
      code: live?.code || item.code,
      name: live?.name || item.name || fallback?.name || "待行情源返回名称",
      price: live?.price ?? item.price ?? fallback?.price ?? 0,
      atr: live?.atr ?? item.atr ?? fallback?.atr ?? 0.6,
      change: live?.change ?? item.change ?? fallback?.change ?? 0
    });
  }
  return next;
}

async function hydrateWatchlist(items) {
  const next = [];
  for (const item of dedupeStoredItems(items, "watch")) {
    const live = await quoteForCode(item.code);
    const fallback = quoteBook[normalizeDigits(item.code)];
    next.push({
      ...item,
      code: live?.code || item.code,
      name: live?.name || item.name || fallback?.name || "待行情源返回名称",
      price: live?.price ?? item.price ?? fallback?.price ?? 0,
      change: live?.change ?? item.change ?? fallback?.change ?? 0
    });
  }
  return next;
}

async function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "OPTIONS") {
    json(res, 204, {});
    return;
  }

  if (req.method === "GET" && url.pathname === "/health") {
    json(res, 200, { ok: true, service: "stock-discipline-assistant-backend" });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/version") {
    const store = readStore();
    json(res, 200, { version: store.version });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/market") {
    json(res, 200, await marketSnapshot());
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/state") {
    const store = readStore();
    const [positions, watchlist, market] = await Promise.all([
      hydratePositions(store.positions || []),
      hydrateWatchlist(store.watchlist || []),
      marketSnapshot()
    ]);
    json(res, 200, {
      ...store,
      positions,
      watchlist,
      market
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/quotes") {
    const codes = (url.searchParams.get("codes") || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const quotes = [];
    for (const code of codes) {
      const quote = await quoteForCode(code);
      if (quote) quotes.push(quote);
    }
    json(res, 200, { quotes });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/positions") {
    const body = await readBody(req);
    const quote = await quoteForCode(body.code);
    if (!quote || quote.price == null) {
      json(res, 400, { error: "暂时无法获取该股票行情" });
      return;
    }
    const store = updateStore((current) => {
      ensureStoreLists(current);
      const nextItem = {
        id: makeId("pos"),
        code: quote.code,
        name: quote.name,
        cost: Number(body.cost || 0),
        price: quote.price,
        days: Number(body.days || 0),
        atr: quote.atr,
        peak: Number(Math.max(quote.price, Number(body.cost || 0) * 1.03).toFixed(2)),
        change: quote.change
      };
      const digits = normalizeDigits(quote.code);
      const existing = current.positions.find((item) => normalizeDigits(item.code) === digits);
      if (existing) {
        Object.assign(existing, nextItem, { id: existing.id });
      } else {
        current.positions.unshift(nextItem);
      }
      return recordEvent(current, "position_add_success", { code: quote.code });
    });
    json(res, 201, { positions: await hydratePositions(store.positions) });
    return;
  }

  if (req.method === "DELETE" && url.pathname.startsWith("/api/positions/")) {
    const id = url.pathname.split("/").pop();
    const store = updateStore((current) => {
      ensureStoreLists(current);
      current.positions = current.positions.filter((item) => item.id !== id);
      return recordEvent(current, "position_remove", { id });
    });
    json(res, 200, { positions: await hydratePositions(store.positions) });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/watchlist") {
    const body = await readBody(req);
    const quote = await quoteForCode(body.code);
    if (!quote || quote.price == null) {
      json(res, 400, { error: "暂时无法获取该股票行情" });
      return;
    }
    const store = updateStore((current) => {
      ensureStoreLists(current);
      const nextItem = {
        id: makeId("watch"),
        code: quote.code,
        name: quote.name,
        price: quote.price,
        trigger: Number(body.trigger || 0),
        change: quote.change
      };
      const digits = normalizeDigits(quote.code);
      const existing = current.watchlist.find((item) => normalizeDigits(item.code) === digits);
      if (existing) {
        Object.assign(existing, nextItem, { id: existing.id });
      } else {
        current.watchlist.unshift(nextItem);
      }
      return recordEvent(current, "watch_add_success", { code: quote.code });
    });
    json(res, 201, { watchlist: await hydrateWatchlist(store.watchlist) });
    return;
  }

  if (req.method === "DELETE" && url.pathname.startsWith("/api/watchlist/")) {
    const id = url.pathname.split("/").pop();
    const store = updateStore((current) => {
      ensureStoreLists(current);
      current.watchlist = current.watchlist.filter((item) => item.id !== id);
      return recordEvent(current, "watch_remove", { id });
    });
    json(res, 200, { watchlist: await hydrateWatchlist(store.watchlist) });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/feedback") {
    const body = await readBody(req);
    const message = String(body.message || "").trim();
    if (!message) {
      json(res, 400, { error: "反馈内容不能为空" });
      return;
    }
    const store = updateStore((current) => {
      ensureStoreLists(current);
      current.feedback.unshift({
        id: makeId("feedback"),
        message,
        source: body.source || "web",
        createdAt: new Date().toISOString()
      });
      current.feedback = current.feedback.slice(0, 200);
      return recordEvent(current, "feedback_submit", { preview: message.slice(0, 80) });
    });
    json(res, 201, { ok: true, feedbackCount: store.feedback.length });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/feedback") {
    const store = readStore();
    json(res, 200, { feedback: store.feedback });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/events") {
    const body = await readBody(req);
    const store = updateStore((current) => recordEvent(current, body.name || "unknown_event", body.payload || {}));
    json(res, 201, { ok: true, eventCount: store.events.length });
    return;
  }

  json(res, 404, { error: "Not found" });
}

const server = http.createServer((req, res) => {
  route(req, res).catch((error) => {
    json(res, 500, { error: error.message || "Internal server error" });
  });
});

server.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
