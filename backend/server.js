const http = require("http");
const { URL } = require("url");
const { readStore, updateStore } = require("./lib/store");

const PORT = process.env.PORT || 8787;

const quoteBook = {
  "000001": { code: "000001.SZ", name: "Ping An Bank", price: 11.24, atr: 0.31, change: -0.62 },
  "000333": { code: "000333.SZ", name: "Midea Group", price: 64.88, atr: 1.42, change: 0.96 },
  "000617": { code: "000617.SZ", name: "Petro Capital", price: 7.38, atr: 0.18, change: 1.24 },
  "001289": { code: "001289.SZ", name: "China Longyuan", price: 18.34, atr: 0.62, change: 0.71 },
  "002230": { code: "002230.SZ", name: "iFlytek", price: 45.62, atr: 1.78, change: 2.14 },
  "002436": { code: "002436.SZ", name: "Xingsen Technology", price: 36.82, atr: 1.74, change: -1.08 },
  "002533": { code: "002533.SZ", name: "Golden Cup Electric", price: 11.67, atr: 0.42, change: -0.26 },
  "300059": { code: "300059.SZ", name: "East Money", price: 13.26, atr: 0.37, change: 0.84 },
  "300750": { code: "300750.SZ", name: "CATL", price: 212.8, atr: 6.8, change: 1.16 },
  "600036": { code: "600036.SH", name: "China Merchants Bank", price: 43.18, atr: 0.96, change: 0.68 },
  "600519": { code: "600519.SH", name: "Kweichow Moutai", price: 1478.2, atr: 35.4, change: 0.55 },
  "601318": { code: "601318.SH", name: "Ping An Insurance", price: 53.27, atr: 1.03, change: 0.42 },
  "601899": { code: "601899.SH", name: "Zijin Mining", price: 18.43, atr: 0.47, change: 1.38 }
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

function pseudoPrice(code) {
  const digits = normalizeDigits(code);
  const seed = digits.split("").reduce((sum, char) => sum + Number(char), 0);
  return Number((8 + (seed % 45) + (seed % 10) / 10).toFixed(2));
}

function quoteForCode(rawCode) {
  const digits = normalizeDigits(rawCode);
  if (digits.length !== 6) return null;
  if (quoteBook[digits]) return quoteBook[digits];
  const price = pseudoPrice(digits);
  return {
    code: normalizeCode(digits),
    name: `${digits} Simulated Quote`,
    price,
    atr: Number(Math.max(price * 0.035, 0.12).toFixed(2)),
    change: Number((((Number(digits[5]) || 1) - 5) * 0.37).toFixed(2))
  };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) {
        reject(new Error("Body too large"));
      }
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
  store.events.unshift({
    id: makeId("event"),
    name,
    payload,
    createdAt: new Date().toISOString()
  });
  store.events = store.events.slice(0, 300);
  return store;
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

  if (req.method === "GET" && url.pathname === "/api/state") {
    const store = readStore();
    json(res, 200, store);
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/quotes") {
    const codes = (url.searchParams.get("codes") || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const quotes = codes.map(quoteForCode).filter(Boolean);
    json(res, 200, { quotes });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/positions") {
    const body = await readBody(req);
    const quote = quoteForCode(body.code);
    if (!quote) {
      json(res, 400, { error: "Invalid stock code" });
      return;
    }
    const store = updateStore((current) => {
      current.positions.unshift({
        id: makeId("pos"),
        code: quote.code,
        name: quote.name,
        cost: Number(body.cost || 0),
        price: quote.price,
        days: Number(body.days || 0),
        atr: quote.atr,
        peak: Number(Math.max(quote.price, Number(body.cost || 0) * 1.03).toFixed(2)),
        change: quote.change
      });
      return recordEvent(current, "position_add_success", { code: quote.code });
    });
    json(res, 201, { positions: store.positions });
    return;
  }

  if (req.method === "DELETE" && url.pathname.startsWith("/api/positions/")) {
    const id = url.pathname.split("/").pop();
    const store = updateStore((current) => {
      current.positions = current.positions.filter((item) => item.id !== id);
      return recordEvent(current, "position_remove", { id });
    });
    json(res, 200, { positions: store.positions });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/watchlist") {
    const body = await readBody(req);
    const quote = quoteForCode(body.code);
    if (!quote) {
      json(res, 400, { error: "Invalid stock code" });
      return;
    }
    const store = updateStore((current) => {
      current.watchlist.unshift({
        id: makeId("watch"),
        code: quote.code,
        name: quote.name,
        price: quote.price,
        trigger: Number(body.trigger || 0),
        change: quote.change
      });
      return recordEvent(current, "watch_add_success", { code: quote.code });
    });
    json(res, 201, { watchlist: store.watchlist });
    return;
  }

  if (req.method === "DELETE" && url.pathname.startsWith("/api/watchlist/")) {
    const id = url.pathname.split("/").pop();
    const store = updateStore((current) => {
      current.watchlist = current.watchlist.filter((item) => item.id !== id);
      return recordEvent(current, "watch_remove", { id });
    });
    json(res, 200, { watchlist: store.watchlist });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/feedback") {
    const body = await readBody(req);
    const message = String(body.message || "").trim();
    if (!message) {
      json(res, 400, { error: "Feedback message is required" });
      return;
    }
    const store = updateStore((current) => {
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
