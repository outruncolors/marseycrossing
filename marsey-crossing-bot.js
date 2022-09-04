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
      min: process.env.MARSEY_CONGREGATION_SIZE_MINIMUM,
      max: process.env.MARSEY_CONGREGATION_SIZE_MAXIMUM,
    });
    const selectedMarseys = this.chance.pickset(availableMarseys, marseyCount);

    console.info("-- Creating a congregation with: ", selectedMarseys);
  }

  /**
   * Process a user's hug and determine if it succeeds or not.
   */
  handleUserHugged() {}
};
