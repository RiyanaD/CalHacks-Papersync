import React, { useState, useEffect } from 'react'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { GetServerSidePropsContext } from 'next'
import { createServerSupabaseClient, User } from '@supabase/auth-helpers-nextjs'
import { Database } from '../types/database'
import NavBarComponent from '@/components/NavBarComponent'
import axios from 'axios';

type Profile = {
    id?: number;
    user_id?: string;
    name?: string;
    organization?: string;
    biography?: string;
}

export default function Profile({ user, profile }: { user: User, profile: Profile }) {
  const supabase = useSupabaseClient<Database>()
  const [userProfile, setUserProfile] = useState<Profile | undefined>(profile)
  const [editing, setEditing] = useState(false)
  const [updatedField, setUpdatedField] = useState<{ [key: string]: string }>({})
  const [previousBio, setPreviousBio] = useState(profile.biography);

  useEffect(() => {
    setPreviousBio(userProfile!.biography);
  }, [userProfile]);

  const handleInputChange = (e: any) => {
    setUpdatedField(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const updateProfile = async () => {
    const updatedProfile = { ...userProfile, ...updatedField }
    const { error } = await supabase
      .from('users')
      .update(updatedProfile)
      .match({ user_id: user.id })

    if (error) {
      console.log('Error updating profile: ', error)
    } else {
      setUserProfile(updatedProfile)
      setEditing(false)
    }
    
    if (previousBio !== updatedField.biography) {
      const { error: deleteError } = await supabase
        .from('user_embeddings')
        .delete()
        .match({ user_id: user.id })
      console.log(userProfile?.biography)
      const sentencesResponse = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
            model: 'gpt-4-0314',
            messages: [
                {
                    role: "system",
                    content: "This is a user's biography. Only describe the user's research interests, but do so from the first-person point of view. For example, \"I am very interested in computer science.\" could be one description. Every unique description should be a sentence, and every sentence should represent a unique aspect of the user. Try not put descriptions that are too similar to each other or too vague. End every sentence with a newline."
                },
                {
                    role: "user",
                    content: userProfile?.biography
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
                Authorization: `Bearer ` + process.env.NEXT_PUBLIC_API_KEY,
            },
        }
    );
    
    const bruh = sentencesResponse.data.choices[0].message.content;
    const sentences = bruh.split('\n');
    
    for (const sentence of sentences) {
        const response = await axios.post(
            'https://api.openai.com/v1/embeddings',
            {
                model: 'text-embedding-ada-002',
                input: sentence
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ` + process.env.NEXT_PUBLIC_API_KEY,
                },
            }
        );
        
        const embedding = response.data.data[0].embedding; // hypothetical response format
        
        // Insert embedding into Supabase DB
        const { error } = await supabase
            .from('user_embeddings') // Replace with your table name
            .insert([
                { 
                    user_id: user.id, // assuming "user" prop includes the user id
                    embedding: embedding, // store the embedding
                    sentiment: sentence, // store the sentence
                },
            ]);
        
        if (error) {
            console.log('Error inserting embedding:', error);
        } else {
            console.log('Embedding inserted successfully');
        }
    }

    }

  }

  const handleInChange = (e: any) => {
    setUpdatedField(prev => ({ ...prev, [e.target.name]: e.target.value }))
  
    if (e.target.name === 'biography') {
      const lineCount = (e.target.value.match(/\n/g) || []).length + 1; // +1 for the current line
      e.target.rows = lineCount;
    }
  }

  return (
    <>
    <style jsx global>{`
        body {
          background-color: black;
        }
      `}</style>
      <NavBarComponent/>

      <div style={{color:"white", marginLeft: "20%", marginRight: "20%", marginTop: "20px"}}>
      {editing ? (
          <>
          <div style={{ display: "flex", flexWrap: "wrap", flexDirection: "row", backgroundColor: 'black', color: 'white' }}>
            <div style={{ width: "200px", height: "200px", borderRadius: "50%", background: "grey", flexShrink: 0 }}></div>
            <div style={{ maxWidth: "700px", flexShrink: 0 }}>
              <input
                name="name"
                style={{ fontSize: "48px", overflowWrap: "break-word", backgroundColor: 'black', color: 'white', outline: 'none' }}
                onChange={handleInputChange}
                defaultValue={userProfile?.name}
              />
              <input
                name="organization"
                style={{ fontSize: "30px", overflowWrap: "break-word", backgroundColor: 'black', color: 'white', outline: 'none' }}
                onChange={handleInputChange}
                defaultValue={userProfile?.organization}
              />
              <textarea
                name="biography"
                style={{ fontSize: "20px", overflowWrap: "break-word", backgroundColor: 'black', color: 'white', border: 'none', resize: 'none', display: 'block', width: '100%', outline: 'none', height: 250 }}
                onChange={handleInChange}
                defaultValue={userProfile?.biography}
              />
            </div>
          </div>
          <button style={{ background: "#6F7DFF", borderRadius: "7px", fontWeight: "bold", marginRight: "40px", padding: "10px", paddingLeft: "20px", paddingRight: "20px", color: "#2C3163"}} onClick={updateProfile}>Save</button>
          <button style={{ background: "#67B7F1", borderRadius: "7px", fontWeight: "bold", color: "#25455B", padding: "10px", paddingLeft: "20px", paddingRight: "20px"}} onClick={() => setEditing(false)}>Cancel</button>
        </>
      ) : (
        <>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            <div style={{ width: "200px", height: "200px", borderRadius: "50%", background: "grey", flexShrink: 0 }}></div>
            <div style={{ maxWidth: "700px", flexShrink: 0 }}>
              <h2 style={{ fontSize: "48px", overflowWrap: "break-word" }}>{userProfile?.name}</h2>
              <h3 style={{ fontSize: "30px", overflowWrap: "break-word" }}>{userProfile?.organization}</h3>
              <p style={{ fontSize: "20px", overflowWrap: "break-word", height: 250, width: '100%' }}>{userProfile?.biography}</p>
              <button onClick={() => setEditing(true)} style={{background: "#6F7DFF", borderRadius: "7px", fontWeight: "bold", marginRight: "40px", padding: "10px", paddingLeft: "20px", paddingRight: "20px", color: "#2C3163"}}>Edit</button>
            </div>
          </div>
        </>
      )}
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

    console.log(session.user.id)
    console.log(profileData[0])
  
    const profile = profileData[0] || null;
  
    return {
      props: {
        initialSession: session,
        user: session.user,
        profile,
      },
    }
  }