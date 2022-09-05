const fs = require("fs").promises;
const path = require("path");

// #region General
async function readDatabase() {
  const pathname = path.join(__dirname, "./database.json");
  const database = await fs.readFile(pathname, {
    encoding: "utf-8",
  });

  return JSON.parse(database);
}
exports.readDatabase = readDatabase;

async function writeDatabase(database) {
  const pathname = path.join(__dirname, "./database.json");

  await fs.writeFile(pathname, JSON.stringify(database, null, 2), {
    encoding: "utf-8",
  });
}
// #endregion

// #region Specific
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

// #region Congregation
async function getActiveCongregation() {
  const database = await readDatabase();
  return database.congregation;
}
exports.getActiveCongregation = getActiveCongregation;

async function createCongregation(congregation) {
  const database = await readDatabase();

  if (!database.congregation) {
    database.congregation = congregation;
  }

  await writeDatabase(database);
}
exports.createCongregation = createCongregation;

async function updateCongregation(congregation) {
  const database = await readDatabase();

  database.congregation = congregation;

  await writeDatabase(database);
}
exports.updateCongregation = updateCongregation;

async function deleteCongregation() {
  const database = await readDatabase();
  database.congregation = null;
  await writeDatabase(database);
}
exports.deleteCongregation = deleteCongregation;
// #endregion

// #region Village
async function createVillage(playerId, postId, ...residents) {
  const database = await readDatabase();

  database.players[playerId] = {
    village: {
      postId,
      name: "Village",
      residents,
    },
  };

  await writeDatabase(database);
}
exports.createVillage = createVillage;

async function readVillage(playerId) {
  const { players } = await readDatabase();
  const player = players[playerId];
  return player ? player.village : null;
}
exports.readVillage = readVillage;

async function updateVillage(playerId, updatedVillage) {
  const village = await readVillage(playerId);

  if (village) {
    const database = await readDatabase();
    database.players[playerId].village = updatedVillage;
    await writeDatabase(database);
  }
}
exports.updateVillage = updateVillage;

async function addVillageResident(playerId, resident) {
  const village = await readVillage(playerId);

  if (village) {
    village.residents.push(resident);
    await updateVillage(playerId, village);
  }
}
exports.addVillageResident = addVillageResident;
// #endregion
// #endregion
