import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = 'https://rbrzbtzolmudwtucjmsx.supabase.co'
const SUPABASE_KEY = 'sb_publishable_ck9X_4TeY9UyjKMK6HV4Mg_5IlQE5pJ'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)