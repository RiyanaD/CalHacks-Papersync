import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient, User } from '@supabase/auth-helpers-nextjs'
import { Database } from '../types/database'
import {  GetServerSidePropsContext } from 'next'

interface Post {
  created_at: Date;
  title: string;
  authors:  string[];
  content: string;
  pdf: string;
  embedding: number[];
  poster_id: any;

}

// Initialize Supabase client
const supabase = createClient('https://cgsqrloddibkgfbbihvf.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc3FybG9kZGlia2dmYmJpaHZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODcwMTk4NDksImV4cCI6MjAwMjU5NTg0OX0.dIjB8bcDtniKGy54YC1ZYhvvFmvRB7igDJAZheYCRN0', {
  schema: 'public'
});


export default function Posts({ initialSession } : {initiailSession: any}) {
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState<string[]>(['']);
  const [content, setContent] = useState('');
  const [created_at, setCreatedAt] = useState(new Date());
  const [embedding, setEmbedding] = useState<number[]>([]);
  const [pdf, setPDF] = useState('');
  const [poster_id, setPosterID] = useState('');
  

  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handlePostIDChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPosterID(e.target.value);
  }

  const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
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

    const post: Post = {
      //created_at: created_at,
      title: title,
      authors: authors,
      content: content,
      pdf: pdf,
      //embedding: embedding,
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
  };

  return (
    <div className="flex flex-row justify-center">
      <form onSubmit={handleSubmit} className="flex flex-col p-4">
        <div className="mb-2 p-4 text-center">
          <label className="block pb-3" htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={handleTitleChange}
            className="text-center"
          />
        </div>
        <div className="mb-2 p-4 text-center">
          <label className="block pb-3" htmlFor="authors">Authors</label>
          <input
            type="text"
            id="authors"
            value={authors}
            onChange={handleAuthorsChange}
            className="text-center"
          />
        </div>
        <div className="mb-2 p-4 text-center">
          <label className="block pb-3" htmlFor="content">Content</label>
          <textarea
            id="content"
            value={content}
            onChange={handleContentChange}
            className="text-center"
          ></textarea>
        </div>
        
        <div className="mb-2 p-4 text-center">
          <label className="block pb-3" htmlFor="pdf">PDF</label>
          <input
            type="text"
            id="pdf"
            value={pdf}
            onChange={handlePDFChange}
            className="text-center"
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