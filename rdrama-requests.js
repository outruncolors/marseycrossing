const Chance = require("chance");
const axios = require("axios");
const instance = axios.create({
  baseURL: "https://rdrama.net/h/marseycrossing",
  timeout: 1000,
  headers: { Authorization: process.env.RDRAMA_ACCESS_TOKEN },
});

const makeFormkey = () => new Chance().guid();

/**
 *
 * @returns Every post made in /h/marseycrossing
 */
async function getAllPosts() {
  const result = await instance.get("/");
  return result.data;
}
exports.getAllPosts = getAllPosts;

/**
 *
 * @param {string} title - The title of the post.
 * @param {string} body - The content of the post.
 * @returns
 */
async function createNewPost(title, body) {
  try {
    const result = await instance.post("/submit", {
      sub: "marseycrossing",
      title,
      body,
      url: "https://google.com/",
    });
    return result;
  } catch (error) {
    console.error("Unable to create post.", error);
  }
}
exports.createNewPost = createNewPost;
