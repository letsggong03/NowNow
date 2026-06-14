import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SUPABASE_URL = "https://lvtlyypmxszgjdfzqjta.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2dGx5eXBteHN6Z2pkZnpxanRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MDU3MzksImV4cCI6MjA5NjM4MTczOX0.uzG1qOquYKvEzoYuOnSjbCOxQqK7xkgRvVz_dNDS2C8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
    },
});