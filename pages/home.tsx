import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { createServerSupabaseClient, User } from '@supabase/auth-helpers-nextjs'
import { Database } from '../types/database'
import styles from "../styles/Styles.module.css"
import { GetServerSidePropsContext } from 'next'
import NavBarComponent from '@/components/NavBarComponent'  // imports the nav bar
import { Document, Page } from 'react-pdf'; 

type Post = {
  id: number,
  created_at: string,
  title: string,
  authors: string[],
  abstract: string,
  pdf: string,
  embedding: number[],
  likes: number
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
      console.log(data);
      const formattedData: Post[] = data.map(post => ({
        id: Number(post.id),
        created_at: new Date().toISOString(), // You'll need to adjust this if you have a specific date to assign
        title: post.title,
        authors: post.authors, // Assuming user_id is the author here
        abstract: post.abstract,
        pdf: '', // Assuming there is no pdf field in the fetched data
        embedding: post.embedding, // Assuming likes is the embedding field
        likes: post.likes
      }))
      setPosts(formattedData)
    }
  }

  const likePost = useCallback(async (postId : number) => {
    // Check if this user has already liked this post
    const { data: likesData, error: likesError } = await supabase
      .from('likes')
      .select('*')
      .eq('user_id', user.id)
      .eq('post_id', postId);
  
    if (likesError) console.log('Error fetching likes: ', likesError)
    else if (likesData.length > 0) {
      console.log('User has already liked this post');
    } else {
      // Fetch the current number of likes for this post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('likes')
        .eq('id', postId);
  
      if (postError) console.log('Error fetching post: ', postError)
      else if (postData.length === 0) {
        console.log('No post found with this id');
      } else {
        const newLikes = postData[0].likes + 1;
  
        // Increment the likes for this post
        const { data: updateData, error: updateError } = await supabase
          .from('posts')
          .update({ likes: newLikes })
          .eq('id', postId);
  
        if (updateError) console.log('Error updating post: ', updateError)
        else {
          // Add a row to the likes table
          const { data: likesData, error: likesError } = await supabase
            .from('likes')
            .insert([
              { user_id: user.id, post_id: postId }
            ]);
  
          if (likesError) console.log('Error inserting like: ', likesError)
          else {
            console.log('Successfully liked post');
            fetchPosts();
          }
        }
      }
    }
  }, [fetchPosts, supabase, user.id]);

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
            <button onClick={() => likePost(post.id)}>Like</button>
            <p>{post.likes} likes</p>
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