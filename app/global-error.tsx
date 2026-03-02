'use client';

import { useEffect } from 'react';

/**
 * Global Error Boundary - catches errors in the root layout itself.
 * This is the last line of defense before a white screen.
 * It must render its own <html> and <body> since the root layout may have crashed.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[SlabFlow Global Error]', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#fafaf9' }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}>
          <div style={{ maxWidth: '28rem', width: '100%', textAlign: 'center' }}>
            {/* Icon */}
            <div style={{
              margin: '0 auto 1.5rem',
              width: '4rem',
              height: '4rem',
              backgroundColor: '#fffbeb',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#d97706"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1c1917', marginBottom: '0.5rem' }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#78716c', marginBottom: '2rem', lineHeight: 1.6 }}>
              We encountered an unexpected error. Please try refreshing the page.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => reset()}
                style={{
                  padding: '0.625rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#fff',
                  backgroundColor: '#1c1917',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                }}
              >
                Try Again
              </button>
              <a
                href="/"
                style={{
                  padding: '0.625rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#44403c',
                  backgroundColor: '#fff',
                  border: '1px solid #e7e5e4',
                  borderRadius: '0.375rem',
                  textDecoration: 'none',
                }}
              >
                Back to Home
              </a>
            </div>

            {error.digest && (
              <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#a8a29e' }}>
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
