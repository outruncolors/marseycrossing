const Chance = require("chance");
const requests = require("./rdrama-requests");
const repository = require("./database-requests");

module.exports = class MarseyCrossingBot {
  constructor() {
    this.chance = new Chance();
    this.playerCommands = ["/hug"];
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
      scanned: {},
      reports: [],
      postId: "",
      updateCommentId: "",
    };

    // Make the post, retrieve the ID, etc.
    const title = `Marseys have congregated nearby!`;
    const body = buildCongregationTableMarkdown(congregationData.marseys);
    const post = await requests.createPost(title, body);
    congregationData.postId = post.id;

    // Create the updates comment and store data for future reference.
    const comment = await requests.createComment(
      post.id,
      `t2_${post.id}`,
      `## ${marseyCount} Marseys are hanging out.`
    );
    congregationData.updateCommentId = comment.id;

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
   * Run through a congregation thread looking for un-run player commands.
   */
  async scanCongregation() {
    const activeCongregation = await repository.getActiveCongregation();

    if (!activeCongregation) {
      throw new Error("There is no active congregation.");
    }

    const playerCommandsToRun = [];
    const post = await requests.readPost(activeCongregation.postId);

    // Go through all top-level comments and determine which ones have commands.
    for (const reply of post.replies) {
      if (activeCongregation.scanned[reply.id]) {
        // We've already scanned it.
        continue;
      }

      activeCongregation.scanned[reply.id] = true;
      const [command, argument, ...rest] = reply.body.split(" ");

      if (!this.playerCommands.includes(command) || rest.length > 0) {
        // It's not a command.
        continue;
      }

      const commandData = {
        playerId: reply.author.id,
        playerName: reply.author.username,
        command,
        argument,
        createdAt: reply.created_utc,
      };

      playerCommandsToRun.push(commandData);
    }

    // Ensure the commands are run in the order they were posted.
    playerCommandsToRun.sort((a, b) => a.createdAt - b.createdAt);

    // Run each command and record the interaction.
    for (const playerCommand of playerCommandsToRun) {
      const { playerId, playerName, argument } = playerCommand;
      const whoToHug = argument.replace(/:/g, "");
      const playerInteractions = activeCongregation.interactions[playerId] || {
        "/hug": {}, // Record<marseyname, boolean>
      };

      switch (playerCommand.command) {
        case "/hug":
          const canHug = checkPlayerCanHug(
            activeCongregation,
            playerCommand,
            playerInteractions
          );

          if (canHug) {
            activeCongregation.reports.push(
              `${playerName} attempted to hug :${whoToHug}:.`
            );
            playerInteractions["/hug"][whoToHug] = true;
            const marseyToHug = buildCongregationMarsey(
              activeCongregation,
              whoToHug
            );
            const successfullyHugged = attemptMarseyHug(marseyToHug);

            if (successfullyHugged) {
              marseyToHug.status = "caught";
              const existingVillage = await repository.readVillage(playerId);

              if (!existingVillage) {
                const post = await requests.createPost(
                  `[Village] ${playerName}'s Village`,
                  `:${whoToHug}:`
                );

                await repository.createVillage(playerId, post.id);
              }

              await repository.addVillageResident(playerId, whoToHug);
              await requests.updatePost(
                activeCongregation.postId,
                `Marseys have congregated nearby!`,
                buildCongregationTableMarkdown(activeCongregation.marseys)
              );

              const updatedVillage = await repository.readVillage(playerId);
              await requests.updatePost(
                existingVillage.postId,
                `[Village] ${playerName}'s Village`,
                updatedVillage.residents.map((resident) => `:${resident}:`).join(' ')
              );

              activeCongregation.reports.push(
                `:${whoToHug}: joined ${playerName}'s village.`
              );
            } else {
              activeCongregation.reports.push(`${whoToHug} rejected the hug.`);
            }
          }
          break;
        default:
          throw new Error(
            `Invalid command ${command} cannot be handled in scan.`
          );
      }

      activeCongregation.interactions[playerId] = playerInteractions;
    }

    // Create or update the status post with the latest reports.
    const update = `## ${
      activeCongregation.marseys.all.length
    } Marseys were hanging out.
### Then...
${activeCongregation.reports
  .map((report, index) => `${index + 1}. ${report}`)
  .join("\n")}
`;

    await requests.updateComment(activeCongregation.updateCommentId, update);
    await repository.updateCongregation(activeCongregation);

    console.info("Successfully scanned the active congregation.");
  }
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

function checkPlayerCanHug(congregation, playerCommand, playerInteractions) {
  const { playerName, argument } = playerCommand;
  const whoToHug = argument.replace(/:/g, "");

  // Cannot hug a Marsey that isn't in the congregation.
  if (!congregation.marseys.all.includes(whoToHug)) {
    congregation.reports.push(
      `${playerName} foolishly tried to hug a Marsey that isn't here.`
    );

    return false;
  }

  const huggedMarseyData = congregation.marseys.byName[whoToHug];

  // Only Marseys who haven't been caught or scared off can be hugged.
  if (huggedMarseyData.status !== "active") {
    congregation.reports.push(
      `${playerName} tried to hug :${whoToHug}:, but they're no longer around.`
    );

    return false;
  }

  // A player can only try to hug a Marsey once.
  if (playerInteractions["/hug"][whoToHug]) {
    congregation.reports.push(
      `${playerName} forgot that :${whoToHug}: already rejected them.`
    );

    return false;
  }

  return true;
}

function buildCongregationMarsey(congregation, marsey) {
  return congregation.marseys.byName[marsey];
}

function attemptMarseyHug(marseyData) {
  return true;
}
// #endregion
