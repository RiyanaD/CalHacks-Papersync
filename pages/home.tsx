import React, { useState } from 'react'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { createServerSupabaseClient, User } from '@supabase/auth-helpers-nextjs'
import { Database } from '../types/database'
import {  GetServerSidePropsContext } from 'next'

export default function Home({ user }: { user: User }) {
  

  return (
    <>
    <div className = "grid grid-cols">
        <div className="flex flex-row">
          <h1 className="p-4 font-family: sans-serif">PaperSync</h1>
          <button className="p-4 font-family: sans-serif outline-4">
            Create a Post

          </button>
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
