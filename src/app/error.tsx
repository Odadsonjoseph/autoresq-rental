'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-deep)',
      color: 'var(--text-primary)',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div>
        <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>500</h1>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Something went wrong</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          {error.message || 'An unexpected error occurred'}
        </p>
        <button onClick={reset} className="btn-primary">
          Try again
        </button>
      </div>
    </main>
  );
}
