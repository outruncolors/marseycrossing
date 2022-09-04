const fs = require("fs").promises;
const path = require("path");

async function readDatabase() {
  const pathname = path.join(__dirname, "./database.json");
  const database = await fs.readFile(pathname, {
    encoding: "utf-8",
  });

  return JSON.parse(database);
}
exports.readDatabase = readDatabase;

async function readMarseys() {
  const pathname = path.join(__dirname, "./marseys.json");
  const marseys = await fs.readFile(pathname, {
    encoding: "utf-8",
  });

  return JSON.parse(marseys);
}
exports.readMarseys = readMarseys;

async function getAvailableMarseys() {
  const database = await readDatabase();
  const marseyLookup = (await readMarseys()).reduce((prev, next) => {
    prev[next] = true;
    return prev;
  }, {});

  for (const {
    village: { residents },
  } of Object.values(database.players)) {
    for (const marsey of residents) {
      marseyLookup[marsey] = false;
    }
  }

  return Object.entries(marseyLookup)
    .filter(([_, value]) => value)
    .map(([key]) => key);
}
exports.getAvailableMarseys = getAvailableMarseys;

async function getActiveCongregation() {
  const database = await readDatabase();
  return database.congregation;
}
exports.getActiveCongregation = getActiveCongregation;
