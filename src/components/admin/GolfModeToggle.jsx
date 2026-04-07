import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { useGolfMode } from '../../contexts/GolfModeContext';

export default function GolfModeToggle() {
  const { mode, setMode } = useGolfMode();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // load saved mode from settings
    (async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'app_mode').single();
      if (data?.value) setMode(data.value);
    })();
  }, []);

  async function toggle(newMode) {
    setLoading(true);
    await supabase.from('settings').upsert({ key: 'app_mode', value: newMode });
    setMode(newMode);
    setLoading(false);
  }

  return (
    <div className="admin-section">
      <div className="admin-title">Mode</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className={`btn ${mode === 'ncaam' ? 'btn-kelly' : 'btn-ghost'}`} onClick={() => toggle('ncaam')} disabled={loading}>NCAA Mode</button>
        <button className={`btn ${mode === 'golf' ? 'btn-kelly' : 'btn-ghost'}`} onClick={() => toggle('golf')} disabled={loading}>Golf Mode</button>
      </div>
    </div>
  );
}
