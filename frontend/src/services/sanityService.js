import {createClient} from '@sanity/client'

export const client = createClient({
  projectId: 'bx61rc9c',
  dataset: 'production',
  useCdn: true, // set to `false` to bypass the edge cache
  apiVersion: '2024-01-01', // use current date (YYYY-MM-DD) to target the latest API version
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