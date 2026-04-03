async function test() {
  const loginRes = await fetch("http://localhost:5000/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "password" })
  });
  
  if (!loginRes.ok) {
    // Try admin1 just in case
    const loginRes2 = await fetch("http://localhost:5000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin1", password: "password" })
    });
    if (!loginRes2.ok) {
      console.log("Failed to login", await loginRes2.text());
      return;
    }
  }

  console.log("Login successful");
  const cookie = loginRes.headers.get("set-cookie");
  
  const updateRes = await fetch("http://localhost:5000/api/user/change-username", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Cookie": cookie || ""
    },
    body: JSON.stringify({ username: "admin_test" })
  });

  const text = await updateRes.text();
  console.log("Update response:", updateRes.status, text);
}

test().catch(console.error);
