import { useState } from 'react';
import { LogIn, UserPlus, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMessage('確認メールを送信しました。メールのリンクをクリックしてください。');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError('メールアドレスまたはパスワードが正しくありません');
    }
    setLoading(false);
  };

  return (
    <div className="setup-screen">
      <div className="setup-card">
        <span style={{ fontSize: 32 }}>⬡</span>
        <h2>Taskflow</h2>
        <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>タスクを立体的に把握する</p>

        <div className="mode-tabs" style={{ marginTop: 8 }}>
          <button className={`mode-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>
            <LogIn size={13} /> ログイン
          </button>
          <button className={`mode-tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => setMode('signup')}>
            <UserPlus size={13} /> 新規登録
          </button>
        </div>

        <form onSubmit={handleSubmit} className="setup-form">
          <input
            type="email" placeholder="メールアドレス" value={email}
            onChange={e => setEmail(e.target.value)}
            className="setup-input" required autoFocus
          />
          <input
            type="password" placeholder="パスワード（8文字以上）" value={password}
            onChange={e => setPassword(e.target.value)}
            className="setup-input" required minLength={8}
          />
          {error && <p className="error-text">{error}</p>}
          {message && <p style={{ color: '#4caf50', fontSize: 12 }}>{message}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading
              ? <><Loader2 size={13} className="spin" /> 処理中...</>
              : mode === 'login' ? 'ログイン' : 'アカウント作成'
            }
          </button>
        </form>
      </div>
    </div>
  );
}
