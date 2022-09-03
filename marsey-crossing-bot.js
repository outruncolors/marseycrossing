module.exports = class MarseyCrossingBot {
  constructor() {
    console.log("Access Token", process.env.RDRAMA_ACCESS_TOKEN);
    console.log("Client ID", process.env.RDRAMA_CLIENT_ID);
  }

  run(command) {
    console.log("Bot running command: ", command);
  }
};
