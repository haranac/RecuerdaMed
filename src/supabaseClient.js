import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://poefhcwgezaovfiofaco.supabase.co'

const supabaseKey = 'sb_publishable_RkIS-Q1wSpiGEKDt3-FSpA_iI3mMW0a'

export const supabase = createClient(supabaseUrl, supabaseKey)