import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
);

export default function Home() {
  const [session, setSession] = useState(null);
  const [tables, setTables] = useState([]);
  const [name, setName] = useState('');
  const [form, setForm] = useState({
    game: '',
    location: '',
    description: '',
    date: '',
    time: '',
    capacity: 4,
  });

  const adminEmail = 'marco.bacceli@gmail.com'; // Cambia con il tuo se necessario

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    loadTables();
  }, []);

  async function loadTables() {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .order('date', { ascending: true });
    if (!error) setTables(data);
  }

  async function handleJoin(id) {
    if (!name) return;

    const { data: row } = await supabase
      .from('tables')
      .select('participants')
      .eq('id', id)
      .single();

    // Evita doppie iscrizioni
    if (row?.participants?.includes(name)) return;

    const updated = [...(row?.participants || []), name];

    const { error } = await supabase
      .from('tables')
      .update({ participants: updated })
      .eq('id', id);

    if (error) {
      console.error('Errore durante la partecipazione:', error);
    }

    loadTables();
  }

  async function createTable() {
    await supabase.from('tables').insert({
      ...form,
      participants: [],
    });
    setForm({
      game: '',
      location: '',
      description: '',
      date: '',
      time: '',
      capacity: 4,
    });
    loadTables();
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Tavoli Basta Post‑it</h1>

      {!session ? (
        <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} />
      ) : (
        <>
          <div className="mb-4">
            👋 Ciao, {session.user.email}{' '}
            <button
              className="ml-2 text-blue-600 underline"
              onClick={() => supabase.auth.signOut()}
            >
              Logout
            </button>
          </div>

          <div className="mb-6">
            <input
              type="text"
              placeholder="Il tuo nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border px-2 py-1 mr-2"
            />
          </div>

          {session.user.email === adminEmail && (
            <div className="border p-4 mb-8 bg-gray-50 rounded">
              <h2 className="font-semibold mb-2">➕ Crea un nuovo evento</h2>
              <input
                type="text"
                placeholder="Gioco"
                value={form.game}
                onChange={(e) => setForm({ ...form, game: e.target.value })}
                className="border px-2 py-1 mb-1 w-full"
              />
              <input
                type="text"
                placeholder="Luogo"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="border px-2 py-1 mb-1 w-full"
              />
              <input
                type="text"
                placeholder="Descrizione"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="border px-2 py-1 mb-1 w-full"
              />
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="border px-2 py-1 mb-1 w-full"
              />
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="border px-2 py-1 mb-1 w-full"
              />
              <input
                type="number"
                placeholder="Numero massimo partecipanti"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) })}
                className="border px-2 py-1 mb-1 w-full"
              />
              <button onClick={createTable} className="bg-blue-600 text-white px-4 py-1 rounded mt-2">
                Crea evento
              </button>
            </div>
          )}
        </>
      )}

      {tables.map((t) => (
        <div key={t.id} className="border rounded p-4 mb-2">
          <h2 className="font-semibold">{t.game} – {t.location}</h2>
          <div>{t.date} {t.time}</div>
          <div>{t.description}</div>
          <div>Posti: {t.participants?.length ?? 0} / {t.capacity}</div>
          <button
            onClick={() => handleJoin(t.id)}
            disabled={
              !name ||
              t.participants?.length >= t.capacity ||
              t.participants?.includes(name)
            }
            className="mt-1 px-2 py-1 bg-green-600 text-white rounded disabled:opacity-50"
          >
            Partecipa
          </button>
        </div>
      ))}
    </div>
  );
}
