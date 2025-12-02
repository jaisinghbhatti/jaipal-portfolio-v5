import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Helper function to fetch all published blog posts via backend proxy
export const getPublishedPosts = async () => {
  try {
    const response = await axios.get(`${API}/sanity/blogs`);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching blogs from backend:', error);
    throw error;
  }
};

// Helper function to fetch a single post by slug via backend proxy
export const getPostBySlug = async (slug) => {
  try {
    const response = await axios.get(`${API}/sanity/blogs/${slug}`);
    return response.data || null;
  } catch (error) {
    console.error('Error fetching blog by slug from backend:', error);
    throw error;
  }
};
