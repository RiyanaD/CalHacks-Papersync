import React, { useState, useEffect } from 'react'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { createServerSupabaseClient, User } from '@supabase/auth-helpers-nextjs'
import { Database } from '../types/database'
import { GetServerSidePropsContext } from 'next'

type Post = {
  id: number,
  created_at: string,
  title: string,
  authors: string,
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
        authors: post.user_id, // Assuming user_id is the author here
        content: post.content,
        pdf: '', // Assuming there is no pdf field in the fetched data
        embedding: [post.likes] // Assuming likes is the embedding field
      }))
      setPosts(formattedData)
    }
  }

  return (
    <>
      <div>

        {posts && posts.map((post, index) => (
          <div key={post.id}>
            <h2>{post.title}</h2>
            <h3>{post.authors}</h3>
            <p>{post.content}</p>
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