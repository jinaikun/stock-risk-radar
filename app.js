const storageKey = "jnk-stock-discipline-assistant";
const analyticsConfig = {
  feedbackEmail: "jinaikun@gmail.com"
};

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

const defaultState = {
  dark: false,
  tokens: 186,
  rules: {
    hardStop: 6,
    atrStop: 2,
    atrTake: 3,
    trailStart: 5,
    maxDays: 12
  },
  positions: [
    { code: "002436.SZ", name: "兴森科技", cost: 39.62, price: 36.82, days: 3, atr: 1.74, peak: 41.2, change: -1.08 },
    { code: "002533.SZ", name: "金杯电工", cost: 12.43, price: 11.67, days: 4, atr: 0.42, peak: 12.72, change: -0.26 },
    { code: "000617.SZ", name: "中油资本", cost: 7.12, price: 7.38, days: 8, atr: 0.18, peak: 7.92, change: 1.24 }
  ],
  watchlist: [
    { code: "300750.SZ", name: "宁德时代", price: 212.8, trigger: 215, change: 1.16 },
    { code: "600519.SH", name: "贵州茅台", price: 1478.2, trigger: 1500, change: 0.55 }
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
    return {
      ...structuredClone(defaultState),
      ...saved,
      rules: { ...structuredClone(defaultState.rules), ...(saved.rules || {}) },
      positions: Array.isArray(saved.positions) ? saved.positions : structuredClone(defaultState.positions),
      watchlist: Array.isArray(saved.watchlist) ? saved.watchlist : structuredClone(defaultState.watchlist),
      alerts: []
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  const payload = {
    dark: state.dark,
    tokens: state.tokens,
    rules: state.rules,
    positions: state.positions,
    watchlist: state.watchlist
  };
  localStorage.setItem(storageKey, JSON.stringify(payload));
}

function trackEvent(path, title) {
  if (!window.goatcounter || typeof window.goatcounter.count !== "function") return;
  window.goatcounter.count({
    path: () => `event/${path}`,
    title,
    event: true
  });
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

function pseudoPrice(code) {
  const digits = normalizeDigits(code);
  const seed = digits.split("").reduce((sum, char) => sum + Number(char), 0);
  return Number((8 + (seed % 45) + (seed % 10) / 10).toFixed(2));
}

function pseudoAtr(price) {
  return Number(Math.max(price * 0.035, 0.12).toFixed(2));
}

function lookupQuote(rawCode) {
  const digits = normalizeDigits(rawCode);
  if (digits.length !== 6) return null;
  if (quoteBook[digits]) return quoteBook[digits];
  const normalized = normalizeCode(digits);
  const price = pseudoPrice(digits);
  return {
    code: normalized,
    name: `${digits} 模拟行情`,
    price,
    atr: pseudoAtr(price),
    change: Number((((Number(digits[5]) || 1) - 5) * 0.37).toFixed(2))
  };
}

function fmt(value, digits = 2) {
  return Number(value).toFixed(digits);
}

function statusLabel(level) {
  return {
    severe: "严重",
    warning: "警戒",
    watch: "观察",
    stable: "正常"
  }[level];
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
      detail: `当前 ${fmt(stock.price)} / ATR 止损线 ${fmt(atrLine)}，建议收盘复核风险。`
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
      title: `${stock.name} 触达 ATR 止盈线`,
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
    detail: `当前 ${fmt(stock.price)}，距离硬止损线还有 ${fmt(((stock.price - hardLine) / stock.price) * 100)}%。`
  };
}

function buildAlerts() {
  const positionAlerts = state.positions.map(classifyPosition);
  const watchAlerts = state.watchlist.map((stock) => {
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

function renderDashboard() {
  const counts = { severe: 0, warning: 0, watch: 0, stable: 0 };
  state.alerts.forEach((alert) => {
    counts[alert.level] += 1;
  });

  $("#severeCount").textContent = counts.severe;
  $("#warningCount").textContent = counts.warning;
  $("#watchCount").textContent = counts.watch;
  $("#stableCount").textContent = counts.stable;
  $("#tokenBalance").textContent = state.tokens;
  $("#heroRiskText").textContent = counts.severe > 0 ? `${counts.severe} 个严重预警` : "暂无严重风险";

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
    .map((stock, index) => {
      const result = classifyPosition(stock);
      const pnl = ((stock.price - stock.cost) / stock.cost) * 100;
      const changeClass = stock.change >= 0 ? "up" : "down";
      const changeText = `${stock.change >= 0 ? "+" : ""}${fmt(stock.change)}%`;
      return `
        <article class="stock-card">
          <div class="stock-top">
            <div>
              <strong>${stock.name} ${stock.code}</strong>
              <p>成本 ${fmt(stock.cost)} / 当前 ${fmt(stock.price)} / 盈亏 ${fmt(pnl)}%</p>
              <p>日内涨跌 <span class="${changeClass}">${changeText}</span> / 持仓 ${stock.days} 天</p>
            </div>
            <div class="stock-actions">
              <span class="pill">${statusLabel(result.level)}</span>
              <button class="remove-button" type="button" data-kind="position" data-index="${index}" aria-label="移除持仓">×</button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderWatchlist() {
  $("#watchList").innerHTML = state.watchlist
    .map((stock, index) => {
      const gap = stock.trigger - stock.price;
      const changeClass = stock.change >= 0 ? "up" : "down";
      const changeText = `${stock.change >= 0 ? "+" : ""}${fmt(stock.change)}%`;
      return `
        <article class="stock-card">
          <div class="stock-top">
            <div>
              <strong>${stock.name} ${stock.code}</strong>
              <p>当前 ${fmt(stock.price)} / 触发价 ${fmt(stock.trigger)} / 差值 ${fmt(gap)}</p>
              <p>日内涨跌 <span class="${changeClass}">${changeText}</span></p>
            </div>
            <div class="stock-actions">
              <span class="pill">自选</span>
              <button class="remove-button" type="button" data-kind="watch" data-index="${index}" aria-label="移除自选">×</button>
            </div>
          </div>
        </article>
      `;
    })
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

function makeReview() {
  if (state.tokens < 12) {
    $("#reviewCard").innerHTML = `<p class="muted">tokens 不足，无法生成 AI 复盘。</p>`;
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
    <p>本次消耗 12 tokens。系统按用户自设规则完成持仓与自选监控。</p>
    <ul>
      <li>严重预警 ${severe.length} 个，优先确认是否触达硬纪律线。</li>
      <li>警戒预警 ${warning.length} 个，收盘后复核 ATR 与移动止盈状态。</li>
      <li>观察事件 ${watch.length} 个，明日开盘加入重点列表。</li>
      <li>规则建议：若连续三天严重预警偏多，可降低单票仓位或缩短复盘周期。</li>
    </ul>
  `;
  saveState();
  trackEvent("review_generate", "generate_review");
  renderDashboard();
}

function renderAll() {
  buildAlerts();
  renderDashboard();
  renderPositions();
  renderWatchlist();
  renderRules();
  document.body.classList.toggle("dark", state.dark);
}

function updateQuotePreview(kind, quote) {
  const nameEl = kind === "position" ? $("#positionName") : $("#watchName");
  const priceEl = kind === "position" ? $("#positionPrice") : $("#watchPrice");
  const previewEl = kind === "position" ? $("#positionQuotePreview") : $("#watchQuotePreview");

  if (!quote) {
    nameEl.value = "";
    priceEl.value = "";
    previewEl.textContent = "输入 6 位股票代码后自动识别名称和当前价";
    return;
  }

  nameEl.value = quote.name;
  priceEl.value = fmt(quote.price);
  const changeText = `${quote.change >= 0 ? "+" : ""}${fmt(quote.change)}%`;
  previewEl.textContent = `${quote.name} ${quote.code} | 当前价 ${fmt(quote.price)} | 日内 ${changeText}`;
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
  $("#positionCode").addEventListener("input", (event) => {
    const digits = normalizeDigits(event.target.value);
    event.target.value = digits;
    updateQuotePreview("position", lookupQuote(digits));
  });

  $("#watchCode").addEventListener("input", (event) => {
    const digits = normalizeDigits(event.target.value);
    event.target.value = digits;
    const quote = lookupQuote(digits);
    updateQuotePreview("watch", quote);
    if (quote) {
      $("#watchForm").elements.trigger.value = fmt(quote.price * 1.02);
    }
  });

  $("#positionForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const quote = lookupQuote(data.get("code"));
    if (!quote) return;
    state.positions.unshift({
      code: quote.code,
      name: quote.name,
      cost: Number(data.get("cost")),
      price: quote.price,
      days: Number(data.get("days")),
      atr: quote.atr,
      peak: Number(Math.max(quote.price, Number(data.get("cost")) * 1.03).toFixed(2)),
      change: quote.change
    });
    saveState();
    trackEvent("position_add", `add_position_${quote.code}`);
    event.currentTarget.reset();
    updateQuotePreview("position", null);
    renderAll();
  });

  $("#watchForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const quote = lookupQuote(data.get("code"));
    if (!quote) return;
    state.watchlist.unshift({
      code: quote.code,
      name: quote.name,
      price: quote.price,
      trigger: Number(data.get("trigger")),
      change: quote.change
    });
    saveState();
    trackEvent("watch_add", `add_watch_${quote.code}`);
    event.currentTarget.reset();
    updateQuotePreview("watch", null);
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
    state.rules = { hardStop: 6, atrStop: 2, atrTake: 3, trailStart: 5, maxDays: 12 };
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
    $("#alertFeed").innerHTML = `<article class="alert-item"><strong>预警已清空</strong><p>下一次扫描会重新生成。</p></article>`;
    trackEvent("alerts_clear", "clear_alerts");
  });

  $("#makeReviewBtn").addEventListener("click", makeReview);

  $("#buyTokenBtn").addEventListener("click", () => {
    state.tokens += 100;
    saveState();
    trackEvent("token_buy", "buy_token_100");
    renderDashboard();
  });

  $("#themeToggle").addEventListener("click", () => {
    state.dark = !state.dark;
    saveState();
    trackEvent("theme_toggle", state.dark ? "theme_dark" : "theme_light");
    renderAll();
  });

  $("#feedbackLink").addEventListener("click", () => {
    trackEvent("feedback_click", "open_feedback_email");
  });

  document.addEventListener("click", (event) => {
    const button = event.target.closest(".remove-button");
    if (!button) return;
    const index = Number(button.dataset.index);
    if (button.dataset.kind === "position") {
      state.positions.splice(index, 1);
      trackEvent("position_remove", `remove_position_${index}`);
    }
    if (button.dataset.kind === "watch") {
      state.watchlist.splice(index, 1);
      trackEvent("watch_remove", `remove_watch_${index}`);
    }
    saveState();
    renderAll();
  });
}

bindTabs();
bindForms();
bindRules();
bindActions();
renderAll();
trackEvent("page_ready", "page_ready");
