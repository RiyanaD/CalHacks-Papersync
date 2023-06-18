import React, { useState, useEffect } from 'react'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { createServerSupabaseClient, User } from '@supabase/auth-helpers-nextjs'
import { Database } from '../types/database'
import styles from "../styles/Styles.module.css"
import { GetServerSidePropsContext } from 'next'
import NavBarComponent from '@/components/NavBarComponent'  // imports the nav bar

type Post = {
  id: number,
  created_at: string,
  title: string,
  authors: string[],
  abstract: string,
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
        abstract: post.abstract,
        pdf: '', // Assuming there is no pdf field in the fetched data
        embedding: post.embedding // Assuming likes is the embedding field
      }))
      setPosts(formattedData)
    }
  }

  return (
      <>
      <style jsx global>{`
        body {
          background-color: black;
        }
      `}</style>
      <div>
        <NavBarComponent />
        <div className={styles.container}>
          {/* nav bar */}
          {posts && posts.map((post, index) => (
          <div key={post.id} className={styles.post}>
            <h2 className={styles.title}>{post.title}</h2>
            <h3 className={styles.author}>Author: {post.authors.join(', ')}</h3>
            <p className={styles.abstract}>{post.abstract}</p>
            <a href={post.pdf} className={styles.link}>View PDF</a>
            {/* Since embedding is a float array, just for illustration here. You might want to do something else with this data */}
            {post.embedding && <p>{post.embedding.join(', ')}</p>}
          </div>
          ))}
        </div>
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