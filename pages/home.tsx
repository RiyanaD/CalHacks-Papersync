import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { createServerSupabaseClient, User } from '@supabase/auth-helpers-nextjs'
import { Database } from '../types/database'
import styles from "../styles/Styles.module.css"
import { GetServerSidePropsContext } from 'next'
import NavBarComponent from '@/components/NavBarComponent'  // imports the nav bar 
import * as tf from '@tensorflow/tfjs';
import preview1 from "/public/previews/preview1.png"
import preview2 from "/public/previews/preview2.png"
import preview3 from "/public/previews/preview3.png"
import preview4 from "/public/previews/preview4.png"
import preview5 from "/public/previews/preview5.png"
import Link from 'next/link';
import { AiFillHeart } from 'react-icons/ai';


type Post = {
  id: number,
  created_at: string,
  title: string,
  authors: string[],
  content: string,
  pdf: string,
  embedding: number[],
  likes: number,
  retention_score: number
}

export default function Home({ user, closestPosts }: { user: User, closestPosts: Post[] }) {
  const supabase = useSupabaseClient<Database>()
  const [posts, setPosts] = useState<Post[]>([])


  useEffect(() => {
    setPosts(closestPosts)
  }, [])

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
            // You might want to manually update the closestPosts state to reflect the new like
          }
        }
      }
    }
  }, [supabase, user.id]);
  const previews = [preview1, preview2, preview3, preview4, preview5];
  // {loadImagePath(post.id)}
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
              <Link href={`/${post.id}`}>
                <div className={styles.content}>
                  <img src={previews[index % previews.length].src} alt={`Preview ${index + 1}`} className={styles.image} />
                  <div className={styles.details}>
                    <h2 className={styles.title}>
                      {/* If the title is too long, display a shortened version */}
                      {post.title.length > 75 ? post.title.substring(0, 75) + "..." : post.title}
                    </h2>
                    <h3 className={styles.author}>Author: {post.authors.join(', ')}</h3>
                    <p className={styles.content}>
                      {/* If the content is too long, display a shortened version */}
                      {post.content.length > 200 ? post.content.substring(0, 200) + "..." : post.content}
                    </p>
                  </div>
                </div>
              </Link>
              <div className={styles.actions}>
                <a target = "_blank" href={post.pdf} className={styles.link}>View PDF</a>
                <button onClick={() => likePost(post.id)} className={styles.button}>
                  <AiFillHeart size={16} style={{ color: "#2C3163", marginRight: '5px' }} /> Likes: {post.likes}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );  
}

// A function to calculate the cosine similarity between two embeddings
async function cosineSimilarity(embedding1: number[], embedding2: number[]): Promise<number> {
  const a = tf.tensor1d(embedding1);
  const b = tf.tensor1d(embedding2);
  
  const magnitudeA = tf.norm(a);
  const magnitudeB = tf.norm(b);
  const dotProduct = tf.sum(tf.mul(a, b));
  
  const similarity = tf.div(dotProduct, tf.mul(magnitudeA, magnitudeB));

  return (await similarity.array()) as number; // Assert that the result is a number
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

    const { data: userEmbeddingsData } = await supabase
    .from('user_embeddings')
    .select('*')
    .eq('user_id', session.user.id);

    // Fetch the post embeddings
    const { data: postEmbeddingsData } = await supabase
    .from('posts')
    .select('*');

    // For each post, calculate its maximum cosine similarity to the user embeddings
    const similarities = [];
    for (const post of postEmbeddingsData!) {
      let maxSimilarity = -Infinity;
      for (const userEmbedding of userEmbeddingsData!) {
        const similarity = await cosineSimilarity(userEmbedding.embedding, post.embedding);
        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
        }
    }
    similarities.push({ id: post.id, similarity: maxSimilarity });
    }

    // Sort the posts by similarity and take the first 100
    const closestPosts = similarities
    .sort((a, b) => b.similarity - a.similarity) // Note that we sort in descending order
    .slice(0, 5)
    .map(({ id }) => postEmbeddingsData!.find(post => post.id === id));

    const scoredPosts = closestPosts.map((post) => {
      const score = Math.log(post.likes + 3) * post.retention_score;
      return { ...post, score };
    });
  
    const sortedByScore = scoredPosts.sort((a, b) => b.score - a.score);
  
    return {
      props: {
        initialSession: session,
        user: session.user,
        closestPosts: sortedByScore,
      },
    };
  };