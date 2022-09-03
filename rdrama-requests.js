const axios = require("axios");
const instance = axios.create({
  baseURL: "https://rdrama.net/h/marseycrossing",
  timeout: 1000,
  headers: { Authorization: process.env.RDRAMA_ACCESS_TOKEN },
});

/**
 *
 * @returns Every post made in /h/marseycrossing
 */
async function getAllPosts() {
  const result = await instance.get("/");
  return result.data;
}
exports.getAllPosts = getAllPosts;
