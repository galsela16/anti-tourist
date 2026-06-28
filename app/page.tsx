'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// אתחול קליינט סופהבייס - מושך את הכתובות מהגדרות ה-Vercel שלך
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // פונקציית החיפוש שמדברת עם בסיס הנתונים
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // מחפש בטבלת locations היכן ש-tourist_trap מכיל את מה שהמשתמש הקליד
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .ilike('tourist_trap', `%${searchQuery}%`);

      if (error) throw error;

      if (data && data.length > 0) {
        setResult(data[0]); 
      } else {
        setError('לא מצאנו חלופה למקום הזה במאגר המידע שלנו עדיין...');
      }
    } catch (err: any) {
      setError('שגיאה בחיבור לבסיס הנתונים. ודא שמשתני הסביבה מוגדרים ב-Vercel.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col items-center p-6" dir="rtl">
      
      <header className="text-center mt-10 mb-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Anti<span className="text-emerald-600">-Tourist</span></h1>
        <p className="text-gray-600">גלה את הסודות המקומיים. תברח מההמונים.</p>
      </header>

      <main className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            לאן כולם הולכים? (הכנס אטרקציה)
          </label>
          <input 
            type="text" 
            placeholder="לדוגמה: מזרקת טרווי..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-emerald-500 transition duration-300 text-right"
          />
        </div>
        
        <button 
          onClick={handleSearch} 
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 shadow-md disabled:bg-gray-400"
        >
          {loading ? 'מחפש בסודות...' : 'מצא לי חלופה שקטה'}
        </button>

        {error && (
          <p className="mt-4 text-sm text-red-500 font-bold text-center">{error}</p>
        )}

        {result && (
          <div className="mt-8 border-t border-gray-100 pt-6">
            <p className="text-sm text-red-500 font-bold mb-1">⚠️ עמוס שם עכשיו!</p>
            <p className="text-gray-600 mb-4 text-sm">במקום להצטופף ב-<strong>{result.tourist_trap}</strong>, נסה את:</p>
            
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
              <h3 className="font-bold text-emerald-800 text-lg mb-1">{result.alternative_name}</h3>
              <p className="text-sm text-emerald-700 mb-3 leading-relaxed">
                {result.alternative_desc}
              </p>
              <span className="text-sm text-blue-600 font-bold">📍 המקום מוכן לביקור!</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
