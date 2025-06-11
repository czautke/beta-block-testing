// js/supabaseClient.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Replace with your actual Supabase project URL and anon public key
const SUPABASE_URL = 'https://wwojgzyntsfuoqdttepq.supabase.co'; // e.g., 'https://abcde12345.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3b2pnenludHNmdW9xZHR0ZXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMjI5MTksImV4cCI6MjA2NDc5ODkxOX0.vC-DQezXo_UrpCNXCEe3IaoCkiRqMwAf9KELDxSDkG0'; // e.g., 'eyJhbGciOiJIUzI1Ni...'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);



/*   // Optional: Log user session status for debugging
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Supabase Auth Event:', event);
    console.log('Supabase Session:', session);
    // You might want to reload page specific data here or redirect
    // based on login/logout
});    */