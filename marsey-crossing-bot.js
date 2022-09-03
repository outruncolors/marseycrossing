const fs = require("fs").promises;
const path = require("path");

module.exports = class MarseyCrossingBot {
  constructor() {
    console.log("Access Token", process.env.RDRAMA_ACCESS_TOKEN);
    console.log("Client ID", process.env.RDRAMA_CLIENT_ID);
  }

  async run(command) {
    const database = await readDatabase();

    console.log("Bot running command: ", command);
    console.log("Database is: ", database);
    console.log("All marsey length: ", (await readMarseys()).length);
    console.log(
      "Available marsey length: ",
      (await getAvailableMarseys()).length
    );
  }

  /**
   * Create a new post in /h/marseycrossing with a group of Marseys.
   */
  spawnMarseyGroup() {}
};

async function readDatabase() {
  const pathname = path.join(__dirname, "./database.json");
  const database = await fs.readFile(pathname, {
    encoding: "utf-8",
  });

  return JSON.parse(database);
}

async function readMarseys() {
  const pathname = path.join(__dirname, "./marseys.json");
  const marseys = await fs.readFile(pathname, {
    encoding: "utf-8",
  });

  return JSON.parse(marseys);
}

async function getAvailableMarseys() {
  const database = await readDatabase();
  const marseyLookup = (await readMarseys()).reduce((prev, next) => {
    prev[next] = true;
    return prev;
  }, {});

  for (const {
    village: { residents },
  } of Object.values(database)) {
    for (const marsey of residents) {
      marseyLookup[marsey] = false;
    }
  }

  return Object.entries(marseyLookup)
    .filter(([_, value]) => value)
    .map(([key]) => key);
}
