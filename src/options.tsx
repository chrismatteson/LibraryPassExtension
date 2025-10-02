import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { LibraryProfile, SiteStrategy, DEFAULT_PROFILE } from './types';

const Options: React.FC = () => {
  const [profile, setProfile] = useState<LibraryProfile>(DEFAULT_PROFILE);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load saved profile
    chrome.storage.sync.get('libraryProfile', (result) => {
      if (result.libraryProfile) {
        setProfile(result.libraryProfile);
      }
    });
  }, []);

  const saveProfile = () => {
    chrome.storage.sync.set({ libraryProfile: profile }, () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  };

  const exportProfile = () => {
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `library-profile-${profile.libraryName.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importProfile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        setProfile(imported);
      } catch (err) {
        alert('Invalid profile file');
      }
    };
    reader.readAsText(file);
  };

  const addStrategy = () => {
    setProfile({
      ...profile,
      strategies: [
        ...profile.strategies,
        {
          domain: '',
          mode: 'ezproxy-wrapper',
          url: '',
          description: ''
        }
      ]
    });
  };

  const updateStrategy = (index: number, updates: Partial<SiteStrategy>) => {
    const newStrategies = [...profile.strategies];
    newStrategies[index] = { ...newStrategies[index], ...updates };
    setProfile({ ...profile, strategies: newStrategies });
  };

  const removeStrategy = (index: number) => {
    setProfile({
      ...profile,
      strategies: profile.strategies.filter((_, i) => i !== index)
    });
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          📚 Library Pass Settings
        </h1>
        <p style={{ color: '#6b7280', margin: 0 }}>
          Configure your library access credentials and site strategies
        </p>
      </header>

      {/* Library Information */}
      <section style={{ background: 'white', padding: '24px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '18px', margin: '0 0 16px 0' }}>Library Information</h2>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>
            Library Name
          </label>
          <input
            type="text"
            value={profile.libraryName}
            onChange={(e) => setProfile({ ...profile, libraryName: e.target.value })}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>
            EZproxy Base URL
          </label>
          <input
            type="text"
            value={profile.proxyBaseUrl}
            onChange={(e) => setProfile({ ...profile, proxyBaseUrl: e.target.value })}
            placeholder="https://mylibrary.idm.oclc.org"
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>
            Login Path
          </label>
          <input
            type="text"
            value={profile.loginPath}
            onChange={(e) => setProfile({ ...profile, loginPath: e.target.value })}
            placeholder="/login?url="
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
          />
        </div>
      </section>

      {/* Optional Credentials */}
      <section style={{ background: 'white', padding: '24px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '18px', margin: '0 0 8px 0' }}>Auto-Fill Credentials (Optional)</h2>
        <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 16px 0' }}>
          Store credentials for automatic login. Leave blank to enter manually.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>
              Library Card Number
            </label>
            <input
              type="text"
              value={profile.libraryCard || ''}
              onChange={(e) => setProfile({ ...profile, libraryCard: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>
              PIN
            </label>
            <input
              type="password"
              value={profile.pin || ''}
              onChange={(e) => setProfile({ ...profile, pin: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
            />
          </div>
        </div>

        <details style={{ marginTop: '12px' }}>
          <summary style={{ cursor: 'pointer', color: '#2563eb', fontSize: '14px', fontWeight: 500 }}>
            Advanced: CSS Selectors for Auto-Fill
          </summary>
          <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>Barcode Selector</label>
              <input
                type="text"
                value={profile.barcodeSelector || ''}
                onChange={(e) => setProfile({ ...profile, barcodeSelector: e.target.value })}
                placeholder="#barcode"
                style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>PIN Selector</label>
              <input
                type="text"
                value={profile.pinSelector || ''}
                onChange={(e) => setProfile({ ...profile, pinSelector: e.target.value })}
                placeholder="#pin"
                style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>Submit Selector</label>
              <input
                type="text"
                value={profile.submitSelector || ''}
                onChange={(e) => setProfile({ ...profile, submitSelector: e.target.value })}
                placeholder="button[type=submit]"
                style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }}
              />
            </div>
          </div>
        </details>
      </section>

      {/* Site Strategies */}
      <section style={{ background: 'white', padding: '24px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', margin: 0 }}>Site Strategies</h2>
          <button onClick={addStrategy} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
            + Add Strategy
          </button>
        </div>

        {profile.strategies.map((strategy, index) => (
          <div key={index} style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '16px', marginBottom: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500 }}>Domain</label>
                <input
                  type="text"
                  value={strategy.domain}
                  onChange={(e) => updateStrategy(index, { domain: e.target.value })}
                  placeholder="nytimes.com"
                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500 }}>Mode</label>
                <select
                  value={strategy.mode}
                  onChange={(e) => updateStrategy(index, { mode: e.target.value as any })}
                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }}
                >
                  <option value="direct-login">Direct Login</option>
                  <option value="ezproxy-wrapper">EZproxy Wrapper</option>
                  <option value="ezproxy-search">EZproxy Search</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button onClick={() => removeStrategy(index)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
                  Remove
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500 }}>Target URL</label>
              <input
                type="text"
                value={strategy.url || ''}
                onChange={(e) => updateStrategy(index, { url: e.target.value })}
                placeholder="https://library.org/access-page"
                style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500 }}>Description</label>
              <input
                type="text"
                value={strategy.description || ''}
                onChange={(e) => updateStrategy(index, { description: e.target.value })}
                placeholder="How this strategy works"
                style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }}
              />
            </div>

            {(strategy.mode === 'direct-login' || strategy.mode === 'custom') && (
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500 }}>
                  Auto-Click Selectors (comma-separated)
                </label>
                <input
                  type="text"
                  value={strategy.clickSelectors?.join(', ') || ''}
                  onChange={(e) => updateStrategy(index, { clickSelectors: e.target.value.split(',').map(s => s.trim()) })}
                  placeholder="a.btn-primary, .redeem-button"
                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }}
                />
              </div>
            )}

            {strategy.mode === 'ezproxy-search' && (
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500 }}>Search Input Selector</label>
                <input
                  type="text"
                  value={strategy.searchSelector || ''}
                  onChange={(e) => updateStrategy(index, { searchSelector: e.target.value })}
                  placeholder="input[name='query']"
                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }}
                />
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <button onClick={saveProfile} style={{ flex: 1, background: '#2563eb', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 500 }}>
          {saved ? '✓ Saved!' : 'Save Settings'}
        </button>
        <button onClick={exportProfile} style={{ background: '#e5e7eb', color: '#374151', border: 'none', padding: '12px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
          Export Profile
        </button>
        <label style={{ background: '#e5e7eb', color: '#374151', border: 'none', padding: '12px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 500, display: 'inline-block' }}>
          Import Profile
          <input type="file" accept=".json" onChange={importProfile} style={{ display: 'none' }} />
        </label>
      </div>

      <footer style={{ color: '#6b7280', fontSize: '13px', textAlign: 'center', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
        <p>
          Library Pass helps you access paywalled content via your library's digital resources.
          <br />
          Share your profile JSON with others using the same library system.
        </p>
      </footer>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<Options />);
