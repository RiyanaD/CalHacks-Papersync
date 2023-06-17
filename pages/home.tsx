import React, { useState, useEffect } from 'react'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { createServerSupabaseClient, User } from '@supabase/auth-helpers-nextjs'
import { Database } from '../types/database'
import styles from "../styles/Styles.module.css"

type Post = {
  id: number,
  created_at: string,
  title: string,
  authors: string[],
  content: string,
  pdf: string,
  embedding: number[]
}

export default function Home({ user }: { user: User }) {
  const supabase = useSupabaseClient<Database>()
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
  
    if (error) console.log('Error fetching posts: ', error)
    else {
      const formattedData: Post[] = data.map(post => ({
        id: Number(post.post_id),
        created_at: new Date().toISOString(), // You'll need to adjust this if you have a specific date to assign
        title: post.title,
        authors: post.authors, // Assuming user_id is the author here
        content: post.content,
        pdf: '', // Assuming there is no pdf field in the fetched data
        embedding: post.embedding // Assuming likes is the embedding field
      }))
      setPosts(formattedData)
    }
  }

  return (
    <>
      <div>

        {posts && posts.map((post, index) => (
          <div key={post.id} style={{border: '1px solid #ccc', margin: '10px 0', padding: '10px'}}>
            <h2 style={{margin: '0 0 10px 0'}}>{post.title}</h2>
            <h3 style={{margin: '0 0 10px 0'}}>Author: {post.authors}</h3>
            <p style={{margin: '0 0 10px 0'}}>{post.content}</p>
            <a href={post.pdf}>View PDF</a>
            {/* Since embedding is a float array, just for illustration here. You might want to do something else with this data */}
            <p>{post.embedding.join(', ')}</p>
          </div>
        ))}
      </div>
    </>
  )
}

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  // Create authenticated Supabase Client
  const supabase = createServerSupabaseClient(ctx)
  // Check if we have a session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session)
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    }

  return {
    props: {
      initialSession: session,
      user: session.user,
    },
  }
}