export async function fetchMilestonesByGig(gigId, token) {
  const res = await fetch(`/api/milestones/gig/${gigId}`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!res.ok) throw new Error("Failed to fetch milestones for gig " + gigId);
  return await res.json();
}
