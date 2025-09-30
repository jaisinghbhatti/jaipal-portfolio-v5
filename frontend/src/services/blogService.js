import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Blog service functions
export const blogService = {
  // Get all blogs
  async getAllBlogs(status = 'published') {
    try {
      const response = await axios.get(`${API}/blogs?status=${status}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching blogs:', error);
      throw error;
    }
  },

  // Get blog by slug
  async getBlogBySlug(slug) {
    try {
      const response = await axios.get(`${API}/blogs/${slug}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching blog by slug:', error);
      throw error;
    }
  },

  // Create new blog
  async createBlog(blogData) {
    try {
      const response = await axios.post(`${API}/blogs`, blogData);
      return response.data;
    } catch (error) {
      console.error('Error creating blog:', error);
      throw error;
    }
  },

  // Update existing blog
  async updateBlog(blogId, blogData) {
    try {
      const response = await axios.put(`${API}/blogs/${blogId}`, blogData);
      return response.data;
    } catch (error) {
      console.error('Error updating blog:', error);
      throw error;
    }
  },

  // Delete blog
  async deleteBlog(blogId) {
    try {
      const response = await axios.delete(`${API}/blogs/${blogId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting blog:', error);
      throw error;
    }
  },

  // Format date helper
  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  },

  // Calculate total read time
  calculateTotalReadTime(blogs) {
    return blogs.reduce((total, blog) => {
      const minutes = parseInt(blog.read_time) || 0;
      return total + minutes;
    }, 0);
  },

  // Get unique tags
  getUniqueTags(blogs) {
    const allTags = blogs.flatMap(blog => blog.tags || []);
    return [...new Set(allTags)];
  }
};

export default blogService;