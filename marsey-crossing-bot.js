const { deleteComment } = require("./rdrama-requests");

module.exports = class MarseyCrossingBot {
  async run(command) {
    console.log("Running command: ", command);

    const result = await deleteComment("18");

    console.log(result);
  }

  /**
   * Create a new post in /h/marseycrossing with a group of Marseys.
   */
  spawnMarseyGroup() {}

  /**
   * Process a user's hug and determine if it succeeds or not.
   */
  handleUserHugged() {}
};
