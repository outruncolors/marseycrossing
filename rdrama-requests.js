const axios = require("axios");
const instance = axios.create({
  baseURL: process.env.RDRAMA_BASE_URL,
  timeout: 1000,
  headers: {
    Authorization: process.env.RDRAMA_ACCESS_TOKEN,
    "Content-Type": "multipart/form-data",
  },
});

// #region Posts
/**
 *
 * @param {string} title - The title of the post.
 * @param {string} body - The content of the post.
 * @returns
 */
async function createPost(title, body) {
  try {
    const result = await instance.post("/h/marseycrossing/submit", {
      formkey: "470acae33bdbdb398a03f3b93bae3af1",
      sub: "marseycrossing",
      title,
      body,
    });
    return result.data;
  } catch (error) {
    console.error("Unable to create post.", error);
    return null;
  }
}
exports.createPost = createPost;

/**
 *
 * @param {string} id - The identifier for the post to read.
 * @returns
 */
async function readPost(id) {
  try {
    const result = await instance.get(`/h/marseycrossing/post/${id}`);
    return result.data;
  } catch (error) {
    console.error("Unable to read post.", error);
    return null;
  }
}
exports.readPost = readPost;

/**
 *
 * @returns Every post made in /h/marseycrossing
 */
async function readAllPosts() {
  try {
    const result = await instance.get("/h/marseycrossing");
    return result.data;
  } catch (error) {
    console.error("Unable to read posts.", error);
    return [];
  }
}
exports.readAllPosts = readAllPosts;

/**
 *
 * @param {string} id - The identifier of the post to edit.
 * @param {string} title - The new title.
 * @param {string} body - The new body.
 * @returns
 */
async function updatePost(id, title, body) {
  try {
    const result = await instance.post(`/edit_post/${id}`, {
      formkey: "470acae33bdbdb398a03f3b93bae3af1",
      sub: "marseycrossing",
      title,
      body,
    });
    return result.data;
  } catch (error) {
    console.error("Unable to edit post.", error);
    return null;
  }
}
exports.updatePost = updatePost;

/**
 *
 * @param {string} id - Which post to delete.
 * @returns
 */
async function deletePost(id) {
  try {
    const result = await instance.delete(`/delete_post/${id}`);
    return result.data;
  } catch (error) {
    console.error("Unable to delete post.", error);
    return null;
  }
}
exports.deletePost = deletePost;
// #endregion
