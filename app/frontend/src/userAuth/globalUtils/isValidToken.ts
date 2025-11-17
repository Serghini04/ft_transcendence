
async function isValidToken(token?: string): Promise<boolean>
{
  // if (!token) return false;
  const res = await fetch("http://localhost:8080/protect", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  });

  const verifyData = await res.json();
  return verifyData.code === "NO_TOKEN" ? false : true;
}

export default isValidToken;