export default function handler(req, res) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = "http://localhost:3000/api/auth/google/callback";
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account",
  });
  res.writeHead(302, { Location: "https://accounts.google.com/o/oauth2/v2/auth?" + params.toString() });
  res.end();
}
