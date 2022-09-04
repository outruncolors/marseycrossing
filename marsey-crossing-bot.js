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
    const title = `${marseyCount} Marseys have congregated nearby!`;
    const body = buildCongregationTableMarkdown(congregationData.marseys);
    const post = await requests.createPost(title, body);
    congregationData.postId = post.id;

    await repository.createCongregation(congregationData);

    console.info(
      `Successfully created a new congregation containing ${marseyCount} Marseys.`,
      `${process.env.RDRAMA_BASE_URL}/h/marseycrossing/post/${post.id}`
    );
  }

  /**
   * End an ongoing congregation and archive the relevant post.
   */
  async disperseCongregation() {
    // If a Marsey group is currently in progress, don't spawn a new group.
    const activeCongregation = await repository.getActiveCongregation();

    if (!activeCongregation) {
      throw new Error("There is no active congregation.");
    }

    await requests.deletePost(activeCongregation.postId);
    await repository.deleteCongregation();

    console.info("Successfully dispersed the active congregation.");
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

function buildMarseyScaredText(scaredLevel) {
  if (scaredLevel === 0) {
    return "😀";
  }

  if (scaredLevel > 0 && scaredLevel < 3) {
    return "🤭";
  }

  if (scaredLevel > 3 && scaredLevel < 6) {
    return "😬";
  }

  if (scaredLevel > 6 && scaredLevel < 9) {
    return "😨";
  }

  return "😱";
}

function buildCongregationTableMarkdown(normalizedMarseys) {
  return `<table>
      <thead>
        <tr>
          <th></th>
          <th>Hugs</th>
          <th>Scared?</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${normalizedMarseys.all.map((marsey) => {
          const data = normalizedMarseys.byName[marsey];

          return `<tr>
            <td>:#${marsey}:</td>
            <td>${data.hugs}</td>
            <td>${buildMarseyScaredText(data.scared)}</td>
            <td>${data.status}</td>
          </tr>`;
        })}
      </tbody>
    </table>
  `.replace(/\s+/g, "");
}
// #endregion
