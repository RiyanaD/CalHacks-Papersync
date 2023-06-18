import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import NavBarComponent from '@/components/NavBarComponent'

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

export default function PostPage() {
  const router = useRouter();
  const { postId } = router.query;
  
  // Set the post type in useState
  const [post, setPost] = useState<PostType | null>(null);
  
  const supabase = useSupabaseClient()

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
          <a href={post.pdf} style={{color: 'white'}}>View PDF</a>
          <p>Likes: {post.likes}</p>
        </div>
      ) : (
        'Loading...'
      )}
    </div>
  );
}