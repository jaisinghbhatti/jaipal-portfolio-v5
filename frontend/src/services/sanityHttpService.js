import axios from 'axios';

// Sanity CMS Configuration - Direct Client-Side Access
const SANITY_PROJECT_ID = 'bx61rc9c';
const SANITY_DATASET = 'production';
const SANITY_API_VERSION = '2024-01-01';
const SANITY_TOKEN = 'skN4ZRZuYJr2iZqeS7mI9krW5s7ZHVeIxdCdf6o1HxOK79FNFROVY6odv0SH9D9ityxgdrM1v6XgO4GMoPbqU1OPr5m0ziEhL8cDBnb3q5Uckn5kE1D3RC8pbhrUSz5uU2P45qdyhfysKtzIGw8JkhDKVKPOnA6lssVHKTqLo6UqtmZpKpCz';

const SANITY_API_URL = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}`;

// Helper function to fetch all published blog posts directly from Sanity
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

    const response = await axios.get(SANITY_API_URL, {
      params: { query },
      headers: {
        'Authorization': `Bearer ${SANITY_TOKEN}`
      }
    });

    return response.data.result || [];
  } catch (error) {
    console.error('Error fetching blogs from Sanity:', error);
    throw error;
  }
};

// Helper function to fetch a single post by slug directly from Sanity
export const getPostBySlug = async (slug) => {
  try {
    const query = `*[_type == "post" && slug.current == "${slug}" && status == "published"][0] {
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

    const response = await axios.get(SANITY_API_URL, {
      params: { query },
      headers: {
        'Authorization': `Bearer ${SANITY_TOKEN}`
      }
    });

    return response.data.result || null;
  } catch (error) {
    console.error('Error fetching blog by slug from Sanity:', error);
    throw error;
  }
};
