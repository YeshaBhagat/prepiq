export default function NotFound() {
  return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'#09090f', color:'#e8e8f0', fontFamily:'system-ui,sans-serif', flexDirection:'column', gap:'16px' }}>
      <h1 style={{ fontSize:'4rem', fontWeight:800, margin:0, color:'#5b6af5' }}>404</h1>
      <p style={{ color:'#7070a0', margin:0 }}>This API route does not exist.</p>
    </main>
  );
}
