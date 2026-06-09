const state = {
  dark: false,
  tokens: 186,
  rules: {
    hardStop: 6,
    atrStop: 2,
    atrTake: 3,
    trailStart: 5,
    maxDays: 12,
  },
  positions: [
    { code: "002436.SZ", name: "兴森科技", cost: 39.62, price: 36.82, days: 3, atr: 1.74, peak: 41.2 },
    { code: "002533.SZ", name: "金杯电工", cost: 12.43, price: 11.67, days: 4, atr: 0.42, peak: 12.72 },
    { code: "000617.SZ", name: "中油资本", cost: 7.12, price: 7.38, days: 8, atr: 0.18, peak: 7.92 },
  ],
  watchlist: [
    { code: "300750.SZ", name: "宁德时代", price: 212.8, trigger: 215 },
    { code: "600519.SH", name: "贵州茅台", price: 1478.2, trigger: 1500 },
  ],
  alerts: [],
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const quoteBook = {
  "002436": { code: "002436.SZ", name: "兴森科技", price: 36.82, atr: 1.74 },
  "002533": { code: "002533.SZ", name: "金杯电工", price: 11.67, atr: 0.42 },
  "000617": { code: "000617.SZ", name: "中油资本", price: 7.38, atr: 0.18 },
  "300750": { code: "300750.SZ", name: "宁德时代", price: 212.8, atr: 6.8 },
  "600519": { code: "600519.SH", name: "贵州茅台", price: 1478.2, atr: 35.4 },
  "001289": { code: "001289.SZ", name: "龙源电力", price: 18.34, atr: 0.62 },
};

function normalizeCode(rawCode) {
  const digits = String(rawCode || "").replace(/\D/g, "").slice(0, 6);
  if (digits.length !== 6) return null;
  const suffix = digits.startsWith("6") ? "SH" : "SZ";
  return `${digits}.${suffix}`;
}

function pseudoPrice(code) {
  const seed = code.split("").reduce((sum, char) => sum + Number(char), 0);
  return Number((6 + (seed % 37) + (seed % 9) / 10).toFixed(2));
}

function lookupQuote(rawCode) {
  const digits = String(rawCode || "").replace(/\D/g, "").slice(0, 6);
  if (digits.length !== 6) return null;
  if (quoteBook[digits]) return quoteBook[digits];
  const normalized = normalizeCode(digits);
  const price = pseudoPrice(digits);
  return {
    code: normalized,
    name: "待行情源返回名称",
    price,
    atr: Math.max(price * 0.035, 0.01),
  };
}

function fmt(value, digits = 2) {
  return Number(value).toFixed(digits);
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
      detail: `当前${fmt(stock.price)} / 成本${fmt(stock.cost)} / 浮亏${fmt(drawdown)}%，纪律线${fmt(hardLine)}。`,
    };
  }

  if (stock.price <= atrLine) {
    return {
      level: "warning",
      title: `${stock.name} 跌破ATR止损`,
      detail: `当前${fmt(stock.price)} / ATR线${fmt(atrLine)}，建议收盘复核风险。`,
    };
  }

  if (trailLine && stock.price <= trailLine) {
    return {
      level: "warning",
      title: `${stock.name} 触发移动止盈`,
      detail: `最高${fmt(stock.peak)} / 回撤线${fmt(trailLine)}，已进入利润保护区。`,
    };
  }

  if (stock.price >= atrTakeLine) {
    return {
      level: "watch",
      title: `${stock.name} 触达ATR止盈线`,
      detail: `当前${fmt(stock.price)} / ATR止盈线${fmt(atrTakeLine)}，可考虑分批止盈或抬高保护线。`,
    };
  }

  if (stock.days >= state.rules.maxDays) {
    return {
      level: "watch",
      title: `${stock.name} 达到持仓周期`,
      detail: `持仓${stock.days}天 / 上限${state.rules.maxDays}天，明日优先复盘。`,
    };
  }

  return {
    level: "stable",
    title: `${stock.name} 风险正常`,
    detail: `当前${fmt(stock.price)}，距离硬止损线还有${fmt(((stock.price - hardLine) / stock.price) * 100)}%。`,
  };
}

function buildAlerts() {
  const positionAlerts = state.positions.map(classifyPosition);
  const watchAlerts = state.watchlist.map((stock) => {
    if (stock.price >= stock.trigger) {
      return {
        level: "watch",
        title: `${stock.name} 接近自选触发价`,
        detail: `当前${fmt(stock.price)} / 触发价${fmt(stock.trigger)}，纳入盘中观察。`,
      };
    }

    return {
      level: "stable",
      title: `${stock.name} 自选正常`,
      detail: `当前${fmt(stock.price)}，距离触发价${fmt(stock.trigger - stock.price)}。`,
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
      return `
        <article class="stock-card">
          <div class="stock-top">
            <div>
              <strong>${stock.name} ${stock.code}</strong>
              <p>成本${fmt(stock.cost)} / 当前${fmt(stock.price)} / 盈亏${fmt(pnl)}%</p>
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
    .map(
      (stock, index) => `
        <article class="stock-card">
          <div class="stock-top">
            <div>
              <strong>${stock.name} ${stock.code}</strong>
              <p>当前${fmt(stock.price)} / 触发价${fmt(stock.trigger)}</p>
            </div>
            <div class="stock-actions">
              <span class="pill">自选</span>
              <button class="remove-button" type="button" data-kind="watch" data-index="${index}" aria-label="移除自选">×</button>
            </div>
          </div>
        </article>
      `
    )
    .join("");
}

function statusLabel(level) {
  return {
    severe: "严重",
    warning: "警戒",
    watch: "观察",
    stable: "正常",
  }[level];
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
    $("#reviewCard").innerHTML = `<p class="muted">tokens不足，无法生成AI复盘。</p>`;
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
      <li>警戒预警 ${warning.length} 个，收盘后复核ATR与移动止盈状态。</li>
      <li>观察事件 ${watch.length} 个，明日开盘加入重点列表。</li>
      <li>规则建议：若连续三天严重预警过多，可降低单票仓位或缩短复盘周期。</li>
    </ul>
  `;
  renderDashboard();
}

function renderAll() {
  buildAlerts();
  renderDashboard();
  renderPositions();
  renderWatchlist();
  renderRules();
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
    const digits = event.target.value.replace(/\D/g, "").slice(0, 6);
    event.target.value = digits;
    const quote = lookupQuote(digits);
    $("#positionName").value = quote ? quote.name : "";
    $("#positionPrice").value = quote ? fmt(quote.price) : "";
    $("#positionQuotePreview").textContent = quote
      ? `${quote.name} ${quote.code} | 当前价 ${fmt(quote.price)}`
      : "输入6位股票代码后自动识别名称和当前价";
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
      peak: quote.price,
    });
    event.currentTarget.reset();
    $("#positionName").value = "";
    $("#positionPrice").value = "";
    $("#positionQuotePreview").textContent = "输入6位股票代码后自动识别名称和当前价";
    renderAll();
  });

  $("#watchForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const trigger = Number(data.get("trigger"));
    state.watchlist.unshift({
      code: data.get("code").trim(),
      name: data.get("name").trim(),
      price: trigger * 0.985,
      trigger,
    });
    event.currentTarget.reset();
    renderAll();
  });
}

function bindRules() {
  [
    ["hardStop", "hardStop"],
    ["atrStop", "atrStop"],
    ["atrTake", "atrTake"],
    ["trailStart", "trailStart"],
    ["maxDays", "maxDays"],
  ].forEach(([id, key]) => {
    $(`#${id}`).addEventListener("input", (event) => {
      state.rules[key] = Number(event.target.value);
      renderAll();
    });
  });

  $("#resetRulesBtn").addEventListener("click", () => {
    state.rules = { hardStop: 6, atrStop: 2, atrTake: 3, trailStart: 5, maxDays: 12 };
    renderAll();
  });
}

function bindActions() {
  $("#runScanBtn").addEventListener("click", renderAll);
  $("#clearAlertsBtn").addEventListener("click", () => {
    state.alerts = [];
    $("#alertFeed").innerHTML = `<article class="alert-item"><strong>预警已清空</strong><p>下一次扫描会重新生成。</p></article>`;
  });
  $("#makeReviewBtn").addEventListener("click", makeReview);
  $("#buyTokenBtn").addEventListener("click", () => {
    state.tokens += 100;
    renderDashboard();
  });
  $("#themeToggle").addEventListener("click", () => {
    state.dark = !state.dark;
    document.body.classList.toggle("dark", state.dark);
  });

  document.addEventListener("click", (event) => {
    const button = event.target.closest(".remove-button");
    if (!button) return;
    const index = Number(button.dataset.index);
    if (button.dataset.kind === "position") {
      state.positions.splice(index, 1);
    }
    if (button.dataset.kind === "watch") {
      state.watchlist.splice(index, 1);
    }
    renderAll();
  });
}

bindTabs();
bindForms();
bindRules();
bindActions();
renderAll();
