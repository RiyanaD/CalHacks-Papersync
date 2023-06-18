import { useRouter } from 'next/router'
import { useEffect, useState, useCallback } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import NavBarComponent from '@/components/NavBarComponent'
import { GetServerSidePropsContext } from 'next'
import { createServerSupabaseClient, User } from '@supabase/auth-helpers-nextjs'
import styles from "../styles/Styles.module.css"

// Define your post type
type PostType = {
  id: number;
  created_at: string;
  title: string;
  authors: string[];
  content: string;
  pdf: string;
  embedding: number[];
  likes: number;
};

type Profile = {
    id?: number;
    user_id?: string;
    name?: string;
    organization?: string;
    biography?: string;
    citations?: number;
}

export default function PostPage({ user, profile }: { user: User, profile: Profile }) {
  const router = useRouter();
  const { postId } = router.query;
  
  // Set the post type in useState
  const [post, setPost] = useState<PostType | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  
  const supabase = useSupabaseClient()

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
  useEffect(() => {
    const startTime = new Date(); // set the startTime when the component mounts

    const incrementRetentionScore = async () => {
      // Get the current post data
      const { data: postData, error: fetchError } = await supabase
        .from('posts')
        .select('retention_score')
        .eq('id', postId);

      if (fetchError) {
        console.log('Error fetching post data: ', fetchError);
        return;
      }

      // Calculate the new retention score
      const currentScore = postData?.[0]?.retention_score || 0;
      const timeSpent = Math.floor((new Date().getTime() - startTime.getTime()) / 1000) *  ( 2 / Math.log(profile.citations! + 3) ); // calculate time spent in seconds
      const newScore = currentScore + timeSpent;

      // Update the retention score
      const { error: updateError } = await supabase
        .from('posts')
        .update({ retention_score: newScore })
        .eq('id', postId);
      
      if (updateError) {
        console.log('Error updating retention score: ', updateError);
      }
    };

    // Set up an interval to update the retention_score every 5 seconds
    const intervalId = setInterval(incrementRetentionScore, 5000);
    
    // Cleanup function to clear the interval and do a final update when the component unmounts
    return () => {
      clearInterval(intervalId);
      incrementRetentionScore();
    };
  }, [postId, supabase]);

  useEffect(() => {
    if(postId) {
      // fetch data for the postId
      const fetchPost = async () => {
        const { data: post, error } = await supabase
          .from('posts')
          .select('*')
          .eq('id', postId)

        if(error) {
          console.log('Error fetching post: ', error)
        } else if(post) {
          setPost(post[0])
        }
      }

      fetchPost()
    }
  }, [postId, supabase])

  // Render the properties of the post
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100vw', height: '100vh', position: 'relative', backgroundColor: 'black'}}>
    <style jsx global>{`
    body {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }
    `}</style>
        <NavBarComponent />
      {post ? (
        <div style={{
            marginTop: '40px',
            paddingTop: '40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: '#121212',
          color: 'white',
          padding: '20px',
          borderRadius: '10px',
          width: '80%',
        }}>
          <h2 style={{fontSize: '2em'}}>{post.title}</h2>
          <h3 style={{fontSize: '0.8em'}}>{post.authors.join(', ')}</h3>
          <p style={{fontSize: '1.2em', width: '70%', paddingTop: '30px', paddingBottom: '30px'}}>{post.content}</p>
          <a href={post.pdf} className={styles.link}>View PDF</a>
          
          <button className={styles.button}>Likes: {post.likes}</button>
        </div>
      ) : (
        'Loading...'
      )}
    </div>
  );
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
  
    const { data: profileData, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', session.user.id)

    if (profileError || !profileData) {
    console.log('Error fetching profile: ', profileError) // Add log here
    return {
        notFound: true,
    }
    }
  
    const profile = profileData[0] || null;
  
    return {
      props: {
        initialSession: session,
        user: session.user,
        profile,
      },
    }
  }