import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// IMPORTANTE: Credenciales reales de tu proyecto Supabase
const supabaseUrl = 'https://zccbphmebkpuzwbkgtse.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjY2JwaG1lYmtwdXp3YmtndHNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0Nzk4OTEsImV4cCI6MjA5NzA1NTg5MX0.Pc3VBCZJDsVrn6cx5eelDF6vwrgs3X7uTI5Q1kNgvDY';

export const supabase = createClient(supabaseUrl, supabaseKey);
