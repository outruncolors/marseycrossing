const Chance = require("chance");
const requests = require("./rdrama-requests");
const repository = require("./database-requests");

module.exports = class MarseyCrossingBot {
  constructor() {
    this.chance = new Chance();
  }

  async run(command) {
    const commandMethod = this[command];

    if (!commandMethod || typeof commandMethod !== "function") {
      throw new Error(`Command does not exist: ${command}`);
    }

    commandMethod.call(this);
  }

  /**
   * Create a new post in /h/marseycrossing with a group of Marseys.
   */
  async spawnCongregation() {
    // If a Marsey group is currently in progress, don't spawn a new group.
    const activeCongregation = await repository.getActiveCongregation();

    if (activeCongregation) {
      throw new Error("Only one congregation may be active at a time.");
    }

    const availableMarseys = await repository.getAvailableMarseys();
    const marseyCount = this.chance.integer({
      min: parseInt(process.env.MARSEY_CONGREGATION_SIZE_MINIMUM),
      max: parseInt(process.env.MARSEY_CONGREGATION_SIZE_MAXIMUM),
    });
    const selectedMarseys = this.chance.pickset(availableMarseys, marseyCount);
    const congregationData = {
      marseys: initializeMarseyCongregation(selectedMarseys),
      interactions: {},
      postId: "",
    };

    // Make the post, retrieve the ID, etc.

    await repository.createCongregation(congregationData);

    console.info(
      `Successfully created a new congregation containing ${marseyCount} Marseys.`
    );
  }

  /**
   * Process a user's hug and determine if it succeeds or not.
   */
  handleUserHugged() {}
};

// #region Helpers
function initializeActiveMarsey(name) {
  return {
    name,
    hugs: 0,
    scared: 0,
    status: "active", // active | ran | caught
  };
}

function initializeMarseyCongregation(marseys) {
  const normalized = marseys.reduce(
    (prev, next) => {
      prev.byName[next] = initializeActiveMarsey(next);
      return prev;
    },
    {
      all: marseys,
      byName: {},
    }
  );

  return normalized;
}
// #endregion
