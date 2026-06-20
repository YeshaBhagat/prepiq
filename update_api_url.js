const fs = require("fs");
const glob = require("path");
const files = [
  ...require("fs").readdirSync("E:/prepiq_v4/frontend").filter(f => f.endsWith(".html")).map(f => "E:/prepiq_v4/frontend/" + f),
  ...require("fs").readdirSync("E:/prepiq_v4/frontend/pages").filter(f => f.endsWith(".html")).map(f => "E:/prepiq_v4/frontend/pages/" + f),
];

let totalReplacements = 0;
files.forEach(f => {
  let content = fs.readFileSync(f, "utf8");
  const before = content;
  content = content.split("http://127.0.0.1:3000").join("https://prepiq-steel.vercel.app");
  if (content !== before) {
    fs.writeFileSync(f, content, "utf8");
    totalReplacements++;
    console.log("Updated: " + f);
  }
});
console.log("Total files updated: " + totalReplacements);
