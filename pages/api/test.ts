import { createServerClient } from '@supabase/ssr'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Cria cliente Supabase com cookies do request
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => {
          return Object.entries(req.cookies).map(([name, value]) => ({
            name,
            value: value ?? '',
          }))
        },
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.setHeader('Set-Cookie', `${name}=${value}; Path=/; HttpOnly`)
          })
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) return res.status(401).json({ error: error.message })

  res.status(200).json({ user })
}