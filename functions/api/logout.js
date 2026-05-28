export async function onRequest(context) {
  const headers = new Headers();
  headers.append("Location", "/");
  headers.append("Set-Cookie", "bcs_access_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  headers.append("Set-Cookie", "bcs_is_auth=; Path=/; Secure; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT");

  return new Response(null, {
    status: 302,
    headers: headers
  });
}
