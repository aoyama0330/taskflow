import { useState } from 'react';
import { Key } from 'lucide-react';
import { saveApiKey } from '../lib/storage';

interface Props {
  onSave: (key: string) => void;
}

export default function ApiKeySetup({ onSave }: Props) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    saveApiKey(value.trim());
    onSave(value.trim());
  };

  return (
    <div className="setup-screen">
      <div className="setup-card">
        <Key size={32} className="setup-icon" />
        <h2>Taskflow へようこそ</h2>
        <p>Claude API キーを入力してください。<br />キーはブラウザのローカルストレージにのみ保存されます。</p>
        <form onSubmit={handleSubmit} className="setup-form">
          <input
            type="password"
            placeholder="sk-ant-..."
            value={value}
            onChange={e => setValue(e.target.value)}
            className="setup-input"
            autoFocus
          />
          <button type="submit" className="btn-primary" disabled={!value.trim()}>
            保存して始める
          </button>
        </form>
      </div>
    </div>
  );
}
