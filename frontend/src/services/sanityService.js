import { createClient } from '@sanity/client';

// Sanity CMS Configuration
const SANITY_PROJECT_ID = 'bx61rc9c';
const SANITY_DATASET = 'production';
const SANITY_API_VERSION = '2024-01-01';
const SANITY_TOKEN = 'skN4ZRZuYJr2iZqeS7mI9krW5s7ZHVeIxdCdf6o1HxOK79FNFROVY6odv0SH9D9ityxgdrM1v6XgO4GMoPbqU1OPr5m0ziEhL8cDBnb3q5Uckn5kE1D3RC8pbhrUSz5uU2P45qdyhfysKtzIGw8JkhDKVKPOnA6lssVHKTqLo6UqtmZpKpCz';

// Create the Sanity client
export const client = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  token: SANITY_TOKEN,
  useCdn: false, // Set to false for write operations
});

// Helper function to fetch all posts (for editor)
export const getAllPosts = async () => {
  try {
    const query = `*[_type == "post"] | order(publishedDate desc) {
      _id,
      title,
      slug,
      author,
      publishedDate,
      readTime,
      tags,
      excerpt,
      thumbnail,
      content,
      status
    }`;
    return await client.fetch(query);
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
};

// Helper function to fetch all published posts
export const getPublishedPosts = async () => {
  try {
    const query = `*[_type == "post" && status == "published"] | order(publishedDate desc) {
      _id,
      title,
      slug,
      author,
      publishedDate,
      readTime,
      tags,
      excerpt,
      thumbnail,
      content,
      status
    }`;
    return await client.fetch(query);
  } catch (error) {
    console.error('Error fetching published posts:', error);
    throw error;
  }
};

// Helper function to fetch a single post by slug
export const getPostBySlug = async (slug) => {
  try {
    const query = `*[_type == "post" && slug.current == "${slug}"][0] {
      _id,
      title,
      slug,
      author,
      publishedDate,
      readTime,
      tags,
      excerpt,
      thumbnail,
      content,
      status
    }`;
    return await client.fetch(query);
  } catch (error) {
    console.error('Error fetching post by slug:', error);
    throw error;
  }
};

// Helper function to create a new post
export const createPost = async (postData) => {
  try {
    const doc = {
      _type: 'post',
      ...postData,
      slug: {
        _type: 'slug',
        current: postData.slug || postData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      }
    };
    return await client.create(doc);
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

// Helper function to update an existing post
export const updatePost = async (postId, postData) => {
  try {
    return await client.patch(postId).set(postData).commit();
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
};

// Helper function to delete a post
export const deletePost = async (postId) => {
  try {
    return await client.delete(postId);
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

// Helper function to upload an image to Sanity
export const uploadImage = async (file) => {
  try {
    return await client.assets.upload('image', file);
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export default client;
