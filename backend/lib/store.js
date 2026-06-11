const fs = require("fs");
const path = require("path");

const storePath = path.join(__dirname, "..", "data", "store.json");
const usersDir = path.join(__dirname, "..", "data", "users");

function readStore() {
  const raw = fs.readFileSync(storePath, "utf8");
  return JSON.parse(raw);
}

function writeStore(nextStore) {
  fs.writeFileSync(storePath, JSON.stringify(nextStore, null, 2), "utf8");
  return nextStore;
}

function updateStore(mutator) {
  const current = readStore();
  const next = mutator(current) || current;
  return writeStore(next);
}

function sanitizeUserCode(rawCode) {
  const code = String(rawCode || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 24);
  return code || "public";
}

function userStorePath(rawCode) {
  return path.join(usersDir, `${sanitizeUserCode(rawCode)}.json`);
}

function createUserStore(baseStore, userCode) {
  return {
    version: baseStore.version,
    userCode,
    rules: baseStore.rules || {
      hardStop: 6,
      atrStop: 2,
      atrTake: 3,
      trailStart: 5,
      maxDays: 12
    },
    tokens: 186,
    positions: [],
    watchlist: [],
    feedback: [],
    events: []
  };
}

function readUserStore(rawCode) {
  const userCode = sanitizeUserCode(rawCode);
  if (userCode === "public") return readStore();
  if (!fs.existsSync(usersDir)) fs.mkdirSync(usersDir, { recursive: true });
  const target = userStorePath(userCode);
  if (!fs.existsSync(target)) {
    const initialStore = createUserStore(readStore(), userCode);
    fs.writeFileSync(target, JSON.stringify(initialStore, null, 2), "utf8");
    return initialStore;
  }
  return JSON.parse(fs.readFileSync(target, "utf8"));
}

function writeUserStore(rawCode, nextStore) {
  const userCode = sanitizeUserCode(rawCode);
  if (userCode === "public") return writeStore(nextStore);
  if (!fs.existsSync(usersDir)) fs.mkdirSync(usersDir, { recursive: true });
  fs.writeFileSync(userStorePath(userCode), JSON.stringify({ ...nextStore, userCode }, null, 2), "utf8");
  return nextStore;
}

function updateUserStore(rawCode, mutator) {
  const current = readUserStore(rawCode);
  const next = mutator(current) || current;
  return writeUserStore(rawCode, next);
}

module.exports = {
  readStore,
  writeStore,
  updateStore,
  readUserStore,
  updateUserStore,
  sanitizeUserCode,
  storePath,
  usersDir
};
