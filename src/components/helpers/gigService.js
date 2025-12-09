export async function fetchUserGigs(token) {
  const res = await fetch('/api/gigs/user', {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!res.ok) throw new Error("Failed to fetch gigs");
  return await res.json();
}
