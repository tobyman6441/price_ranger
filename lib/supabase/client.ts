import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.')
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

export const uploadImage = async (file: File, folder: string = 'estimates'): Promise<string> => {
  const supabase = createClient()
  
  // Generate a unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `${folder}/${fileName}`

  // Upload the file
  const { data, error } = await supabase.storage
    .from('images')
    .upload(filePath, file)

  if (error) {
    throw error
  }

  // Get the public URL
  const { data: { publicUrl } } = supabase.storage
    .from('images')
    .getPublicUrl(filePath)

  return publicUrl
} 