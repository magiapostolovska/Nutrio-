const API_BASE = "http://localhost:5000"; 

export async function createMembership(providerPaymentId: string) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found.");

  const res = await fetch(`${API_BASE}/membership`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ProviderPaymentId: providerPaymentId }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to create membership");
  }

  return await res.json(); 
}