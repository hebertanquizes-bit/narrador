import { createServerClient } from '@supabase/auth-helpers-nextjs'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Cria cliente Supabase passando os cookies do request
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { req, res } // aqui é o segredo para ler a sessão
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) return res.status(401).json({ error: error.message })

  res.status(200).json({ user })
}