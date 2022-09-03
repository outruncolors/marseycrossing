// Load environment variables.
require("dotenv").config();

// Each single usage of the bot accepts a single command, runs it, then exits.
const MarseyCrossingBot = require("./marsey-crossing-bot");
const bot = new MarseyCrossingBot();
bot.run("test");
