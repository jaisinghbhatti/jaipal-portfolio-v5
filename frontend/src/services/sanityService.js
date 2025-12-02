import {createClient} from '@sanity/client'

export const client = createClient({
  projectId: 'bx61rc9c',
  dataset: 'production',
  useCdn: false, // Must be false when using a token to avoid CDN/auth conflicts
  apiVersion: '2024-01-01', // use current date (YYYY-MM-DD) to target the latest API version
  token: 'skN4ZRZuYJr2iZqeS7mI9krW5s7ZHVeIxdCdf6o1HxOK79FNFROVY6odv0SH9D9ityxgdrM1v6XgO4GMoPbqU1OPr5m0ziEhL8cDBnb3q5Uckn5kE1D3RC8pbhrUSz5uU2P45qdyhfysKtzIGw8JkhDKVKPOnA6lssVHKTqLo6UqtmZpKpCz', // Required for creating posts
})

// Helper function to fetch all published blog posts
export const getPublishedPosts = async () => {
  return await client.fetch(
    `*[_type == "post" && status == "published"] | order(publishedDate desc) {
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
    }`
  )
}

// Helper function to fetch a single post by slug
export const getPostBySlug = async (slug) => {
  return await client.fetch(
    `*[_type == "post" && slug.current == $slug && status == "published"][0] {
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
    }`,
    { slug }
  )
}