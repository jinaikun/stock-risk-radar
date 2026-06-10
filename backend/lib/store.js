const fs = require("fs");
const path = require("path");

const storePath = path.join(__dirname, "..", "data", "store.json");

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

module.exports = {
  readStore,
  writeStore,
  updateStore,
  storePath
};
