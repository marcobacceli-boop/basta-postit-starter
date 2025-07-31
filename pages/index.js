import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';


const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY);
const session = await supabase.auth.getSession();

export default function Home() {
  const [tables, setTables] = useState([]);
  const [name, setName] = useState('');

  useEffect(() => {
    supabase.from('tables').select('*').order('date', { ascending: true })
      .then(({ data }) => setTables(data));
  }, []);

  async function handleJoin(id) {
    await supabase.from('tables').update({
      participants: supabase.raw('array_append(participants, ?)', [name])
    }).eq('id', id);
    // ricarica
    const { data } = await supabase.from('tables').select('*').order('date', { ascending: true });
    setTables(data);
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Tavoli Basta Post‑it</h1>
      <input type="text" placeholder="Il tuo nome" value={name} onChange={e => setName(e.target.value)} className="border p-2 mb-4" />
      {tables.map(t => (
        <div key={t.id} className="border rounded p-4 mb-2">
          <h2 className="font-semibold">{t.game} – {t.location}</h2>
          <div>{t.date} {t.time}</div>
          <div>{t.description}</div>
          <div>Posti: {t.participants?.length ?? 0} / {t.capacity}</div>
          <button onClick={() => handleJoin(t.id)} disabled={!name || (t.participants?.length >= t.capacity)}>Partecipa</button>
        </div>
      ))}
    </div>
  );
}
