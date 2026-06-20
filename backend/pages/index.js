export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        margin: 0,
        padding: '64px 24px',
        background: '#09090f',
        color: '#e8e8f0',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <section
        style={{
          maxWidth: '760px',
          margin: '0 auto',
          padding: '32px',
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.04)',
        }}
      >
        <p style={{ color: '#34d399', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          PrepIQ Backend
        </p>
        <h1 style={{ fontSize: '2.4rem', marginBottom: '12px' }}>Resume ATS analysis service is running.</h1>
        <p style={{ color: '#a0a0bd', lineHeight: 1.7 }}>
          This Next.js backend powers the PDF resume upload flow and returns ATS scoring, keyword matches,
          and improvement suggestions.
        </p>
        <div
          style={{
            display: 'inline-block',
            marginTop: '12px',
            padding: '10px 14px',
            borderRadius: '12px',
            background: 'rgba(91,106,245,0.18)',
            color: '#ffffff',
            fontFamily: 'monospace',
          }}
        >
          POST /api/resume/analyze
        </div>
      </section>
    </main>
  );
}
