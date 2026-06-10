const storageKey = "jnk-stock-discipline-assistant";
const appVersion = "v1.3.4";
const defaultApiBase =
  window.location.protocol === "file:"
    ? "http://localhost:8787"
    : window.location.origin;

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

const defaultState = {
  dark: false,
  tokens: 186,
  version: appVersion,
  dataMode: "demo",
  apiBase: defaultApiBase,
  market: {
    hs300: { code: "000300.SH", name: "沪深300", price: 3512.63, change: 0.18, source: "fallback" }
  },
  rules: {
    hardStop: 6,
    atrStop: 2,
    atrTake: 3,
    trailStart: 5,
    maxDays: 12
  },
  positions: [
    {
      id: "demo-pos-002436",
      code: "002436.SZ",
      name: "兴森科技",
      cost: 39.62,
      price: 36.82,
      days: 3,
      atr: 1.74,
      peak: 41.2,
      change: -1.08
    },
    {
      id: "demo-pos-002533",
      code: "002533.SZ",
      name: "金杯电工",
      cost: 12.43,
      price: 11.67,
      days: 4,
      atr: 0.42,
      peak: 12.72,
      change: -0.26
    }
  ],
  watchlist: [
    {
      id: "demo-watch-300750",
      code: "300750.SZ",
      name: "宁德时代",
      price: 212.8,
      trigger: 215,
      change: 1.16
    }
  ],
  alerts: []
};

const state = loadState();
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (!saved) return structuredClone(defaultState);
    const loaded = {
      ...structuredClone(defaultState),
      ...saved,
      market: {
        ...structuredClone(defaultState.market),
        ...(saved.market || {})
      },
      rules: {
        ...structuredClone(defaultState.rules),
        ...(saved.rules || {})
      },
      positions: Array.isArray(saved.positions) ? dedupeStocks(saved.positions, "pos") : structuredClone(defaultState.positions),
      watchlist: Array.isArray(saved.watchlist) ? dedupeStocks(saved.watchlist, "watch") : structuredClone(defaultState.watchlist),
      alerts: []
    };
    if (window.location.protocol !== "file:") {
      loaded.apiBase = window.location.origin;
    }
    return loaded;
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(
    storageKey,
    JSON.stringify({
      dark: state.dark,
      tokens: state.tokens,
      version: state.version,
      dataMode: state.dataMode,
      apiBase: state.apiBase,
      market: state.market,
      rules: state.rules,
      positions: state.positions,
      watchlist: state.watchlist
    })
  );
}

function trackEvent(path, title) {
  if (window.goatcounter && typeof window.goatcounter.count === "function") {
    window.goatcounter.count({
      path: () => `event/${path}`,
      title,
      event: true
    });
  }

  apiRequest("/api/events", {
    method: "POST",
    body: JSON.stringify({ name: path, payload: { title } })
  }).catch(() => {});
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

function normalizeStockItem(item, kind) {
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

function dedupeStocks(items, kind) {
  const seen = new Set();
  return (items || [])
    .map((item) => normalizeStockItem(item, kind))
    .filter((item) => {
      const digits = normalizeDigits(item.code);
      if (digits.length !== 6 || seen.has(digits)) return false;
      seen.add(digits);
      return true;
    });
}

function fmt(value, digits = 2) {
  return Number(value || 0).toFixed(digits);
}

function pctText(value) {
  const number = Number(value || 0);
  return `${number >= 0 ? "+" : ""}${fmt(number)}%`;
}

function statusLabel(level) {
  return {
    severe: "严重",
    warning: "警戒",
    watch: "观察",
    stable: "正常"
  }[level];
}

function fallbackQuote(rawCode) {
  const digits = normalizeDigits(rawCode);
  if (digits.length !== 6) return null;
  if (quoteBook[digits]) return quoteBook[digits];
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

function classifyPosition(stock) {
  const drawdown = ((stock.price - stock.cost) / stock.cost) * 100;
  const hardLine = stock.cost * (1 - state.rules.hardStop / 100);
  const atrLine = stock.cost - state.rules.atrStop * stock.atr;
  const atrTakeLine = stock.cost + state.rules.atrTake * stock.atr;
  const trailActive = stock.peak >= stock.cost * (1 + state.rules.trailStart / 100);
  const trailLine = trailActive ? stock.peak - 1.5 * stock.atr : null;

  if (stock.price <= hardLine) {
    return {
      level: "severe",
      title: `${stock.name} 触发硬止损`,
      detail: `当前 ${fmt(stock.price)} / 成本 ${fmt(stock.cost)} / 浮亏 ${fmt(drawdown)}%，纪律线 ${fmt(hardLine)}。`
    };
  }

  if (stock.price <= atrLine) {
    return {
      level: "warning",
      title: `${stock.name} 跌破 ATR 止损`,
      detail: `当前 ${fmt(stock.price)} / ATR 止损线 ${fmt(atrLine)}，建议收盘后复核风险。`
    };
  }

  if (trailLine && stock.price <= trailLine) {
    return {
      level: "warning",
      title: `${stock.name} 触发移动止盈`,
      detail: `最高 ${fmt(stock.peak)} / 回撤线 ${fmt(trailLine)}，已进入利润保护区。`
    };
  }

  if (stock.price >= atrTakeLine) {
    return {
      level: "watch",
      title: `${stock.name} 到达 ATR 止盈线`,
      detail: `当前 ${fmt(stock.price)} / ATR 止盈线 ${fmt(atrTakeLine)}，可考虑分批止盈。`
    };
  }

  if (stock.days >= state.rules.maxDays) {
    return {
      level: "watch",
      title: `${stock.name} 达到持仓周期`,
      detail: `持仓 ${stock.days} 天 / 上限 ${state.rules.maxDays} 天，明日优先复盘。`
    };
  }

  return {
    level: "stable",
    title: `${stock.name} 风险正常`,
    detail: `当前 ${fmt(stock.price)}，距离硬止损线仍有 ${fmt(((stock.price - hardLine) / stock.price) * 100)}%。`
  };
}

function buildAlerts() {
  const validPositions = state.positions.filter((stock) => Number(stock.price) > 0 && Number(stock.cost) > 0);
  const validWatchlist = state.watchlist.filter((stock) => Number(stock.price) > 0 && Number(stock.trigger) > 0);
  const positionAlerts = validPositions.map(classifyPosition);
  const watchAlerts = validWatchlist.map((stock) => {
    const gap = stock.trigger - stock.price;
    if (stock.price >= stock.trigger) {
      return {
        level: "watch",
        title: `${stock.name} 触发自选条件`,
        detail: `当前 ${fmt(stock.price)} / 触发价 ${fmt(stock.trigger)}，已进入重点观察。`
      };
    }
    if (gap <= Math.max(stock.trigger * 0.01, 0.3)) {
      return {
        level: "watch",
        title: `${stock.name} 接近触发价`,
        detail: `当前 ${fmt(stock.price)} / 触发价 ${fmt(stock.trigger)}，差值 ${fmt(gap)}。`
      };
    }
    return {
      level: "stable",
      title: `${stock.name} 自选正常`,
      detail: `当前 ${fmt(stock.price)}，距离触发价 ${fmt(gap)}。`
    };
  });

  state.alerts = [...positionAlerts, ...watchAlerts].sort((a, b) => {
    const weight = { severe: 0, warning: 1, watch: 2, stable: 3 };
    return weight[a.level] - weight[b.level];
  });
}

function renderMarket() {
  const hs300 = state.market?.hs300 || defaultState.market.hs300;
  $("#hs300Price").textContent = fmt(hs300.price);
  const changeEl = $("#hs300Change");
  changeEl.textContent = pctText(hs300.change);
  changeEl.className = Number(hs300.change) >= 0 ? "up" : "down";
}

function renderDashboard() {
  const counts = { severe: 0, warning: 0, watch: 0, stable: 0 };
  state.alerts.forEach((alert) => {
    counts[alert.level] += 1;
  });

  renderMarket();
  $("#severeCount").textContent = counts.severe;
  $("#warningCount").textContent = counts.warning;
  $("#watchCount").textContent = counts.watch;
  $("#stableCount").textContent = counts.stable;
  $("#tokenBalance").textContent = state.tokens;
  $("#heroRiskText").textContent = counts.severe > 0 ? `${counts.severe} 个严重预警待处理` : "暂无严重风险";
  $("#versionText").textContent = state.version || appVersion;
  $("#runtimeStatus").textContent = state.dataMode === "backend" ? "后端在线" : "演示模式";
  $("#reviewHint").textContent = state.dataMode === "backend" ? "已连接实时接口" : "当前为演示数据";
  $("#alertFeed").innerHTML = state.alerts
    .map(
      (alert) => `
        <article class="alert-item ${alert.level}">
          <strong>${alert.title}</strong>
          <p>${alert.detail}</p>
        </article>
      `
    )
    .join("");
}

function renderPositions() {
  $("#positionList").innerHTML = state.positions
    .map((stock) => {
      const result = classifyPosition(stock);
      const pnl = ((stock.price - stock.cost) / stock.cost) * 100;
      return `
        <article class="stock-card">
          <div class="stock-top">
            <div>
              <strong>${stock.name} ${stock.code}</strong>
              <p>成本 ${fmt(stock.cost)} / 当前 ${fmt(stock.price)} / 盈亏 ${fmt(pnl)}%</p>
              <p>日内涨跌 <span class="${Number(stock.change) >= 0 ? "up" : "down"}">${pctText(stock.change)}</span> / 持仓 ${stock.days} 天</p>
            </div>
            <div class="stock-actions">
              <span class="pill">${statusLabel(result.level)}</span>
              <button class="remove-button" type="button" data-kind="position" data-id="${stock.id}" aria-label="移除持仓">×</button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderWatchlist() {
  $("#watchList").innerHTML = state.watchlist
    .map((stock) => `
      <article class="stock-card">
        <div class="stock-top">
          <div>
            <strong>${stock.name} ${stock.code}</strong>
            <p>当前 ${fmt(stock.price)} / 触发价 ${fmt(stock.trigger)} / 差值 ${fmt(stock.trigger - stock.price)}</p>
            <p>日内涨跌 <span class="${Number(stock.change) >= 0 ? "up" : "down"}">${pctText(stock.change)}</span></p>
          </div>
          <div class="stock-actions">
            <span class="pill">自选</span>
            <button class="remove-button" type="button" data-kind="watch" data-id="${stock.id}" aria-label="移除自选">×</button>
          </div>
        </div>
      </article>
    `)
    .join("");
}

function renderRules() {
  $("#hardStop").value = state.rules.hardStop;
  $("#atrStop").value = state.rules.atrStop;
  $("#atrTake").value = state.rules.atrTake;
  $("#trailStart").value = state.rules.trailStart;
  $("#maxDays").value = state.rules.maxDays;
  $("#hardStopLabel").textContent = `-${fmt(state.rules.hardStop, 1)}%`;
  $("#atrStopLabel").textContent = `${fmt(state.rules.atrStop, 1)}x`;
  $("#atrTakeLabel").textContent = `${fmt(state.rules.atrTake, 1)}x`;
  $("#trailStartLabel").textContent = `${fmt(state.rules.trailStart, 1)}%`;
  $("#maxDaysLabel").textContent = `${state.rules.maxDays}天`;
}

function renderAll() {
  buildAlerts();
  renderDashboard();
  renderPositions();
  renderWatchlist();
  renderRules();
  document.body.classList.toggle("dark", state.dark);
}

function setQuotePreview(kind, quote, message) {
  const nameEl = kind === "position" ? $("#positionName") : $("#watchName");
  const priceEl = kind === "position" ? $("#positionPrice") : $("#watchPrice");
  const previewEl = kind === "position" ? $("#positionQuotePreview") : $("#watchQuotePreview");

  if (message) {
    nameEl.value = "";
    priceEl.value = "";
    previewEl.textContent = message;
    return;
  }

  if (!quote) {
    nameEl.value = "";
    priceEl.value = "";
    previewEl.textContent = "输入 6 位股票代码后，自动带出股票名称和当前价。";
    return;
  }

  nameEl.value = quote.name || "待行情源返回名称";
  priceEl.value = quote.price == null ? "" : fmt(quote.price);
  const priceText = quote.price == null ? "待行情源返回价格" : fmt(quote.price);
  previewEl.textContent = `${quote.name || "待行情源返回名称"} ${quote.code} | 当前价 ${priceText} | 日内 ${pctText(quote.change)}`;
}

async function apiRequest(path, options = {}) {
  if (!state.apiBase) return null;
  try {
    const response = await fetch(`${state.apiBase}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      ...options
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch {
    return null;
  }
}

async function loadBackendState() {
  const data = await apiRequest("/api/state");
  if (!data) {
    state.dataMode = "demo";
    state.market = structuredClone(defaultState.market);
    saveState();
    return;
  }
  state.version = appVersion;
  state.rules = data.rules || state.rules;
  state.positions = Array.isArray(data.positions) ? dedupeStocks(data.positions, "pos") : dedupeStocks(state.positions, "pos");
  state.watchlist = Array.isArray(data.watchlist) ? dedupeStocks(data.watchlist, "watch") : dedupeStocks(state.watchlist, "watch");
  state.market = data.market || state.market;
  state.dataMode = "backend";
  saveState();
}

async function fetchQuote(rawCode) {
  const digits = normalizeDigits(rawCode);
  if (digits.length !== 6) return null;
  const remote = await apiRequest(`/api/quotes?codes=${digits}`);
  if (remote && Array.isArray(remote.quotes) && remote.quotes[0]) {
    return remote.quotes[0];
  }
  return fallbackQuote(digits);
}

async function refreshQuotePreview(kind, rawCode) {
  const digits = normalizeDigits(rawCode);
  if (!digits) {
    setQuotePreview(kind, null);
    return;
  }
  if (digits.length < 6) {
    setQuotePreview(kind, null, "请继续输入完整的 6 位股票代码。");
    return;
  }
  setQuotePreview(kind, null, "正在读取行情与股票名称...");
  const quote = await fetchQuote(digits);
  setQuotePreview(kind, quote, null);
  if (kind === "watch" && quote?.price != null) {
    $("#watchForm").elements.trigger.value = fmt(quote.price * 1.02);
  }
}

async function addPosition(payload) {
  const remote = await apiRequest("/api/positions", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  if (remote && Array.isArray(remote.positions)) {
    state.positions = dedupeStocks(remote.positions, "pos");
    state.dataMode = "backend";
    saveState();
    return true;
  }

  const quote = await fetchQuote(payload.code);
  if (!quote || quote.price == null) return false;
  state.positions.unshift({
    id: `demo-pos-${Date.now()}`,
    code: quote.code,
    name: quote.name,
    cost: Number(payload.cost),
    price: quote.price,
    days: Number(payload.days),
    atr: quote.atr || 0.6,
    peak: Number(Math.max(quote.price, Number(payload.cost) * 1.03).toFixed(2)),
    change: quote.change || 0
  });
  saveState();
  return true;
}

async function addWatch(payload) {
  const remote = await apiRequest("/api/watchlist", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  if (remote && Array.isArray(remote.watchlist)) {
    state.watchlist = dedupeStocks(remote.watchlist, "watch");
    state.dataMode = "backend";
    saveState();
    return true;
  }

  const quote = await fetchQuote(payload.code);
  if (!quote || quote.price == null) return false;
  state.watchlist.unshift({
    id: `demo-watch-${Date.now()}`,
    code: quote.code,
    name: quote.name,
    price: quote.price,
    trigger: Number(payload.trigger),
    change: quote.change || 0
  });
  saveState();
  return true;
}

async function submitFeedback(message) {
  const remote = await apiRequest("/api/feedback", {
    method: "POST",
    body: JSON.stringify({ message, source: "web" })
  });
  if (remote && remote.ok) {
    state.dataMode = "backend";
    saveState();
    return true;
  }
  return false;
}

async function removeItem(kind, id) {
  const path = kind === "position" ? `/api/positions/${id}` : `/api/watchlist/${id}`;
  const remote = await apiRequest(path, { method: "DELETE" });
  if (remote) {
    if (kind === "position" && Array.isArray(remote.positions)) {
      state.positions = dedupeStocks(remote.positions, "pos");
    }
    if (kind === "watch" && Array.isArray(remote.watchlist)) {
      state.watchlist = dedupeStocks(remote.watchlist, "watch");
    }
    state.dataMode = "backend";
    saveState();
    return;
  }

  if (kind === "position") {
    state.positions = state.positions.filter((item) => item.id !== id);
  }
  if (kind === "watch") {
    state.watchlist = state.watchlist.filter((item) => item.id !== id);
  }
  saveState();
}

async function makeReview() {
  if (state.tokens < 12) {
    $("#reviewCard").innerHTML = '<p class="muted">tokens 不足，无法生成 AI 复盘。</p>';
    trackEvent("review_blocked", "review_insufficient_tokens");
    return;
  }

  state.tokens -= 12;
  const severe = state.alerts.filter((item) => item.level === "severe");
  const warning = state.alerts.filter((item) => item.level === "warning");
  const watch = state.alerts.filter((item) => item.level === "watch");
  $("#reviewState").textContent = "已生成";
  $("#reviewCard").innerHTML = `
    <h4>今日纪律复盘</h4>
    <p>本次消耗 12 tokens。系统按你的纪律规则完成了持仓和自选扫描。</p>
    <ul>
      <li>严重预警 ${severe.length} 个，优先确认是否已经触发硬止损。</li>
      <li>警戒预警 ${warning.length} 个，收盘后重点复核 ATR 止损和移动止盈状态。</li>
      <li>观察事件 ${watch.length} 个，明日开盘前加入重点清单。</li>
      <li>如果连续多日严重预警偏多，建议主动降低仓位或缩短持仓周期。</li>
    </ul>
  `;
  saveState();
  trackEvent("review_generate", "generate_review");
  renderDashboard();
}

function bindTabs() {
  $$(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      $$(".tab").forEach((item) => item.classList.remove("active"));
      $$(".view").forEach((item) => item.classList.remove("active"));
      tab.classList.add("active");
      $(`#view-${tab.dataset.view}`).classList.add("active");
    });
  });
}

function bindForms() {
  $("#positionCode").addEventListener("input", async (event) => {
    const digits = normalizeDigits(event.target.value);
    event.target.value = digits;
    await refreshQuotePreview("position", digits);
  });

  $("#watchCode").addEventListener("input", async (event) => {
    const digits = normalizeDigits(event.target.value);
    event.target.value = digits;
    await refreshQuotePreview("watch", digits);
  });

  $("#positionForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const code = normalizeDigits(data.get("code"));
    const cost = Number(data.get("cost"));
    const days = Number(data.get("days"));
    if (code.length !== 6) {
      setQuotePreview("position", null, "请先输入完整的 6 位股票代码。");
      return;
    }
    if (!(cost > 0)) {
      setQuotePreview("position", null, "请填写成本价，保存持仓需要股票代码、成本价和持仓天数。");
      return;
    }
    if (!(days >= 0)) {
      setQuotePreview("position", null, "请填写持仓天数，可以填 0。");
      return;
    }

    const ok = await addPosition({ code, cost, days });
    if (!ok) {
      setQuotePreview("position", null, "当前未拿到有效行情，暂时无法保存持仓。");
      return;
    }
    trackEvent("position_add_success", `position_add_success_${normalizeCode(code)}`);
    event.currentTarget.reset();
    setQuotePreview("position", null);
    renderAll();
  });

  $("#watchForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const code = normalizeDigits(data.get("code"));
    const trigger = Number(data.get("trigger"));
    if (code.length !== 6) {
      setQuotePreview("watch", null, "请先输入完整的 6 位股票代码。");
      return;
    }
    if (!(trigger > 0)) {
      setQuotePreview("watch", null, "请填写触发价，保存自选需要股票代码和触发价。");
      return;
    }

    const ok = await addWatch({ code, trigger });
    if (!ok) {
      setQuotePreview("watch", null, "当前未拿到有效行情，暂时无法加入自选。");
      return;
    }
    trackEvent("watch_add_success", `watch_add_success_${normalizeCode(code)}`);
    event.currentTarget.reset();
    setQuotePreview("watch", null);
    renderAll();
  });
}

function bindRules() {
  [
    ["hardStop", "hardStop"],
    ["atrStop", "atrStop"],
    ["atrTake", "atrTake"],
    ["trailStart", "trailStart"],
    ["maxDays", "maxDays"]
  ].forEach(([id, key]) => {
    $(`#${id}`).addEventListener("input", (event) => {
      state.rules[key] = Number(event.target.value);
      saveState();
      renderAll();
    });
  });

  $("#resetRulesBtn").addEventListener("click", () => {
    state.rules = { ...defaultState.rules };
    saveState();
    trackEvent("rules_reset", "reset_rules");
    renderAll();
  });
}

function bindActions() {
  $("#runScanBtn").addEventListener("click", () => {
    trackEvent("scan_run", "run_scan");
    renderAll();
  });

  $("#clearAlertsBtn").addEventListener("click", () => {
    state.alerts = [];
    $("#alertFeed").innerHTML = '<article class="alert-item"><strong>预警已清空</strong><p>下一次扫描会重新生成。</p></article>';
    trackEvent("alerts_clear", "clear_alerts");
  });

  $("#makeReviewBtn").addEventListener("click", makeReview);

  $("#buyTokenBtn").addEventListener("click", () => {
    state.tokens += 100;
    saveState();
    trackEvent("token_buy", "buy_token_4_99");
    renderDashboard();
  });

  $("#themeToggle").addEventListener("click", () => {
    state.dark = !state.dark;
    saveState();
    trackEvent("theme_toggle", state.dark ? "theme_dark" : "theme_light");
    renderAll();
  });

  $("#feedbackText").addEventListener(
    "focus",
    () => {
      trackEvent("feedback_click", "feedback_input_focus");
    },
    { once: true }
  );

  $("#feedbackForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = $("#feedbackText").value.trim();
    if (!text) {
      $("#feedbackStatus").textContent = "请先写一点真实感受再提交。";
      return;
    }
    const ok = await submitFeedback(text);
    trackEvent("feedback_submit", text.slice(0, 80));
    $("#feedbackStatus").textContent = ok
      ? "反馈已提交到后端，感谢你帮我把这个助手打磨得更好。"
      : "反馈已记为试用事件，后端接通后会更完整。";
    $("#feedbackText").value = "";
  });

  document.addEventListener("click", async (event) => {
    const button = event.target.closest(".remove-button");
    if (!button) return;
    const id = button.dataset.id;
    if (button.dataset.kind === "position") {
      await removeItem("position", id);
      trackEvent("position_remove", `remove_position_${id}`);
    }
    if (button.dataset.kind === "watch") {
      await removeItem("watch", id);
      trackEvent("watch_remove", `remove_watch_${id}`);
    }
    renderAll();
  });
}

async function init() {
  bindTabs();
  bindForms();
  bindRules();
  bindActions();
  await loadBackendState();
  renderAll();
  setQuotePreview("position", null);
  setQuotePreview("watch", null);
  trackEvent("page_ready", "page_ready");
}

init();
