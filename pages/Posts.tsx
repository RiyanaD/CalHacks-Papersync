import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient, User } from '@supabase/auth-helpers-nextjs'
import { Database } from '../types/database'
import {  GetServerSidePropsContext } from 'next'
import NavBarComponent from '@/components/NavBarComponent'  // imports the nav bar
import axios from 'axios'

interface Post {
  title: string;
  authors:  string[];
  content: string;
  pdf: string;
  embedding: number[] | null;
  poster_id: any;

}

// Initialize Supabase client
const supabase = createClient('https://cgsqrloddibkgfbbihvf.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc3FybG9kZGlia2dmYmJpaHZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODcwMTk4NDksImV4cCI6MjAwMjU5NTg0OX0.dIjB8bcDtniKGy54YC1ZYhvvFmvRB7igDJAZheYCRN0');


export default function Posts({ initialSession } : {initialSession: any}) {
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState<string[]>(['']);
  const [content, setContent] = useState('');
  const [pdf, setPDF] = useState('');
  const [poster_id, setPosterID] = useState('');
  const [summary, setSummary] = useState('');
  

  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handlePostIDChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPosterID(e.target.value);
  }

  const handleAbstractChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleAuthorsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputAuthors = e.target.value.split(','); // Assuming the authors are separated by commas
    setAuthors(inputAuthors);
  };

  const handlePDFChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPDF(e.target.value);
  };



  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Perform validation if needed
    if (!title || !content) {
      console.log('Invalid post. Title and content are required.');
      return;
    }

    //is this fradulent?
    const fraudDetection = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
          model: 'gpt-4',
          messages: [
              {
                  role: "system",
                  content: "You are a bot that determines the validity of any given research paper that the user tries to upload. Look for pornographic, informal, or anything that can be deemed as misinfomartion. You are to say 'yes' or 'no' to the user when they try to submit their paper"
              },
              {
                  role: "user",
                  content: content
              }
          ],
          max_tokens: 200,
          n: 1,
          stop: null,
          temperature: 0,
      },
      {
          headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer `  + process.env.NEXT_PUBLIC_API_KEY,
          },
      }
    );

    const answer = fraudDetection.data.choices[0].message.content;

    if (answer === 'no') {
      alert("Please re-enter valid research...")
      setTitle('')
      setAuthors([''])
      setContent('')
      setPDF('')
      setPosterID('')
      setSummary('')
    }else{
      const sentencesResponse = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
            model: 'gpt-4',
            messages: [
                {
                    role: "system",
                    content: "This is a chat that a user had with a chatbot. Describe the user in as many descriptive sentences as you can, but do so from the first-person point of view. For example, I am very interested in video games. could be one description. Every unique description should be a sentence, and every sentence should represent a unique aspect of the user. End every sentence with a newline."
                },
                {
                    role: "user",
                    content: content
                }
            ],
            max_tokens: 200,
            n: 1,
            stop: null,
            temperature: 0,
        },
        {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer `  + process.env.NEXT_PUBLIC_API_KEY,
            },
        }
      );
  
  
  
      setSummary(sentencesResponse.data.choices[0].message.content)
  
      const data = sentencesResponse.data.choices[0].message.content;
      const newData = data.split('\n')
  
      
      const response = await axios.post(
          'https://api.openai.com/v1/embeddings',
          {
              model: 'text-embedding-ada-002',
              input: newData,
          },
          {
              headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ` + process.env.NEXT_PUBLIC_API_KEY,
              },
          },
      );
      
      const embeddings = response.data.data[0].embedding; // hypothetical response format
      
  
      const post: Post = {
        title: title,
        authors: authors,
        content: content,
        pdf: pdf,
        embedding: embeddings,
        poster_id: initialSession.user.id,
      };
      // Perform further actions with the post object
      // For example, you could send it to a server or save it to a database
      try {
          const { data, error } = await supabase.from('posts').insert([post]);
  
          if (error) {
          console.error('Error inserting post:', error);
          } else {
          console.log('Your post has been created');
          }
      } catch (error) {
          console.error('Error inserting post:', error);
      }
    }
  
  };

  return (
    <div className="flex flex-col justify-center">
      <NavBarComponent />
      <style jsx global>{`
        body {
          background-color: black;
        }
      `}</style>

      <form onSubmit={handleSubmit} className="flex flex-col p-4">
        <div className="mb-2 p-4" style={{ width: "912px", margin: "0 auto", color: "white"}}>
          <label className="block pb-3" htmlFor="title" style={{ textAlign: "left" }}>
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={handleTitleChange}
            style={{
              marginLeft: "auto",
              marginRight: "auto",
              borderRadius: "10px",
              height: "54.98px",
              background: "#1E1E1E",
              width: "100%",
              padding: "10px"
            }}
          />
        </div>

        <div className="mb-2 p-4" style={{ width: "912px", margin: "0 auto", color: "white"}}>
          <label className="block pb-3" htmlFor="title" style={{ textAlign: "left" }}>
            Authors
          </label>
          <input
            type="text"
            id="authors"
            value={authors}
            onChange={handleAuthorsChange}
            style={{
              marginLeft: "auto",
              marginRight: "auto",
              borderRadius: "10px",
              height: "54.98px",
              background: "#1E1E1E",
              width: "100%",
              padding: "10px"
            }}
          />
        </div>
        
        <div className="mb-2 p-4" style={{ width: "912px", margin: "0 auto", color: "white"}}>
          <label className="block pb-3" htmlFor="title" style={{ textAlign: "left" }}>
            Abstract
          </label>
          <textarea
            id="abstract"
            value={content}
            onChange={handleAbstractChange}
            style={{
              marginLeft: "auto",
              marginRight: "auto",
              borderRadius: "10px",
              height: "295.98px",
              background: "#1E1E1E",
              width: "100%",
              padding: "10px"
            }}
          ></textarea>
        </div>
        
        <div className="mb-2 p-4 text-center">
          <label className="block pb-3" htmlFor="pdf">PDF</label>
          <input
            type="text"
            id="pdf"
            value={pdf}
            onChange={handlePDFChange}
          />
        </div>


        <button type="submit">Create Post</button>
      </form>
    </div>
  );
};

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