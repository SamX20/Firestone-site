# Firestone Content Administration

The static site reads published content from the separate Firestone Jo Supabase
project `bqhwudsezoedjbrovkqm`. `/admin` uses password authentication and explicit
membership in `public.firestone_admins`. `/Admin` redirects to `/admin` on Vercel.
The browser contains only a publishable API key, never a service-role key.

## First Administrator

Create `manager@firestonejo.com` through Supabase Dashboard > Authentication >
Users > Add user > Create new user. Choose a unique password of at least 12
characters and enable Auto Confirm User. Do not store or send the password in
this repository or chat.

After verifying the intended user exists, a project owner can grant membership:

```sql
insert into public.firestone_admins (user_id)
select id from auth.users where email = 'manager@firestonejo.com'
on conflict (user_id) do nothing;
```

Authentication alone does not grant editing rights. There is no public signup
or client-side membership creation. Account provisioning was not completed by
the website code. Password recovery is managed through the Supabase dashboard;
the portal supports changing a password while logged in.

## Content and Storage

- Projects: Arabic/English title and description, category, up to 20 photos,
  cover first, numeric ordering, draft/published status.
- Hero: desktop photo, optional mobile photo, numeric order, published status.
- Images: logo, banner, and four service images.
- Changes appear on the next public-page load without a Vercel deployment.
- Uploads accept JPEG, PNG, WebP, up to 12 MiB each. The public media bucket is
  for marketing images, not confidential files. Draft records are private but
  their uploaded images have public URLs.
- Removing a photo or deleting a project does not delete stored files. Unused
  uploads can be removed in Storage after checking that nothing references them.
- Database timestamps prevent overwriting changes from another editor session.
- Existing static content is retained as fallback if the content API is unavailable.

The disabled `firestone-admin-setup` function requires JWT verification and
always returns HTTP 410. It does not create accounts or grant privileges.

## Verification

Public content and unauthorized access were checked against the real database.
The admin CRUD/upload UI was tested with browser-only API fixtures, including
responsive layout, accessibility, ordering, publication, conflict handling,
and multi-image gallery rendering. A complete real-account upload test remains
required after the administrator is created and membership granted.

The security advisor returned no findings. The performance advisor noted
overlapping published/admin SELECT policies on projects and slides; both are
intentional permissive alternatives, not an authorization bypass.
