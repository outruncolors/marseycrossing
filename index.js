// Load environment variables.
require("dotenv").config();

// Load flags.
const minimist = require("minimist");
const PASSED_ARGUMENTS = minimist(process.argv.slice(2));
const { command } = PASSED_ARGUMENTS;

if (!command) {
  console.error("Error: MarseyCrossingBot requires a command to run.");
  process.exit(1);
}

// Each single usage of the bot accepts a single command, runs it, then exits.
const MarseyCrossingBot = require("./marsey-crossing-bot");
const bot = new MarseyCrossingBot();
bot.run(command);
