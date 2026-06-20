export default function handler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = "http://localhost:3000/api/auth/github/callback";
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "read:user user:email",
  });
  res.writeHead(302, { Location: "https://github.com/login/oauth/authorize?" + params.toString() });
  res.end();
}
