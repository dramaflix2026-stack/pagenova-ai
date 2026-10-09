/** Resolve a payment email to exactly one Supabase Auth identity.
 * Never derive a subscriber ID from the untrusted webhook body.
 */
export async function resolveBillingSubscriberId(
  email: string,
  listUsers: (args: { page: number; perPage: number }) => Promise<{
    data: { users: Array<{ id: string; email?: string | null }> };
    error: { message: string } | null;
  }>,
): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return null;
  let matched: string | null = null;
  for (let page = 1; page <= 100; page++) {
    const { data, error } = await listUsers({ page, perPage: 1000 });
    if (error) throw new Error("Supabase subscriber lookup failed");
    for (const user of data.users) {
      if (user.email?.trim().toLowerCase() !== normalized) continue;
      if (!/^[a-zA-Z0-9_:-]{1,128}$/.test(user.id)) throw new Error("Invalid Supabase subscriber ID");
      if (matched && matched !== user.id) throw new Error("Ambiguous billing subscriber identity");
      matched = user.id;
    }
    if (data.users.length < 1000) return matched;
  }
  // An incomplete scan is not proof of a unique identity.
  throw new Error("Subscriber lookup pagination limit reached");
}
