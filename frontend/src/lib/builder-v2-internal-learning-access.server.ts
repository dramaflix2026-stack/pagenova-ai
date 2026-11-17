/**
 * Server-only permission check for the PageNova internal learning dashboards.
 * Identity pairs are taken from verified Supabase auth.users rows.
 * Never grant access from a client-provided email, URL parameter or user_metadata.
 */
type AuthenticatedIdentity={
  id:string;
  email?:string|null;
  email_confirmed_at?:string|null;
};
const AUTHORIZED_INTERNAL_ACCOUNTS:ReadonlyMap<string,string>=new Map([
  ["01cadff1-1bff-4075-8354-a61b51ecd0eb","giovanesornoqui@hotmail.com"],
  ["3a405182-e509-4c1b-ab4b-d16a21049f18","giovanevfs@outlook.com"],
]);

export function isVerifiedInternalLearningAccount(user:AuthenticatedIdentity|null|undefined):boolean{
  if(!user?.id||!user.email_confirmed_at||typeof user.email!=="string")return false;
  const allowedEmail=AUTHORIZED_INTERNAL_ACCOUNTS.get(user.id);
  return typeof allowedEmail==="string"&&allowedEmail===user.email.trim().toLowerCase();
}
