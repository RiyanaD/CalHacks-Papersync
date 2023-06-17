import React, { useState, useEffect } from 'react'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { GetServerSidePropsContext } from 'next'
import { createServerSupabaseClient, User } from '@supabase/auth-helpers-nextjs'
import { Database } from '../types/database'

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

  const handleInputChange = (e : any) => {
    setUpdatedField({ [e.target.name]: e.target.value })
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
  }

  return (
    <div>
      {editing ? (
        <>
          <input name="name" onChange={handleInputChange} defaultValue={userProfile?.name} />
          <input name="organization" onChange={handleInputChange} defaultValue={userProfile?.organization} />
          <input name="biography" onChange={handleInputChange} defaultValue={userProfile?.biography} />
          <button onClick={updateProfile}>Save</button>
          <button onClick={() => setEditing(false)}>Cancel</button>
        </>
      ) : (
        <>
          <h2>{userProfile?.name}</h2>
          <h3>{userProfile?.organization}</h3>
          <p>{userProfile?.biography}</p>
          <button onClick={() => setEditing(true)}>Edit</button>
        </>
      )}
    </div>
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
    console.log(profileData)
  
    const profile = profileData[0] || null;
  
    return {
      props: {
        initialSession: session,
        user: session.user,
        profile,
      },
    }
  }