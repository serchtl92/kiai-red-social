import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cztvayrersfrgpngveny.supabase.co'; // Cambia con tu URL de Supabase
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6dHZheXJlcnNmcmdwbmd2ZW55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MDA5NzEsImV4cCI6MjA1OTk3Njk3MX0.fVqZYciu-BTjjKhWlaXTpEwnDvyWlfAB-mT7Ief84_Y'; // Cambia con tu clave pública

export const supabase = createClient(supabaseUrl, supabaseKey);
