create table public.firestone_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.firestone_admins enable row level security;
grant select on public.firestone_admins to authenticated;
revoke all on public.firestone_admins from anon;
create policy "Read own membership" on public.firestone_admins for select to authenticated using (user_id = (select auth.uid()));

create table public.firestone_projects (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null check (length(trim(title_ar)) between 1 and 160),
  title_en text not null check (length(trim(title_en)) between 1 and 160),
  description_ar text not null default '' check (length(description_ar) <= 4000),
  description_en text not null default '' check (length(description_en) <= 4000),
  category text not null check (category in ('interior','outdoor')),
  images jsonb not null default '[]'::jsonb check (jsonb_typeof(images) = 'array' and jsonb_array_length(images) between 1 and 20),
  published boolean not null default false,
  position integer not null default 0 check (position between 0 and 100000),
  updated_at timestamptz not null default now()
);
create table public.firestone_slides (
  id uuid primary key default gen_random_uuid(),
  image_url text not null check (length(image_url) between 1 and 2048),
  mobile_url text not null default '' check (length(mobile_url) <= 2048),
  alt_ar text not null default '' check (length(alt_ar) <= 200),
  alt_en text not null default '' check (length(alt_en) <= 200),
  published boolean not null default false,
  position integer not null default 0 check (position between 0 and 100000),
  updated_at timestamptz not null default now()
);
create table public.firestone_images (
  slot text primary key check (slot in ('logo','banner','service-0','service-1','service-2','service-3')),
  image_url text not null check (length(image_url) between 1 and 2048),
  updated_at timestamptz not null default now()
);
create index firestone_projects_order on public.firestone_projects (position,id) where published;
create index firestone_slides_order on public.firestone_slides (position,id) where published;

alter table public.firestone_projects enable row level security;
alter table public.firestone_slides enable row level security;
alter table public.firestone_images enable row level security;
grant select on public.firestone_projects, public.firestone_slides, public.firestone_images to anon, authenticated;
grant insert, update, delete on public.firestone_projects, public.firestone_slides to authenticated;
grant update on public.firestone_images to authenticated;
create policy "Read published projects" on public.firestone_projects for select to anon, authenticated using (published);
create policy "Manage projects" on public.firestone_projects for all to authenticated using (exists(select 1 from public.firestone_admins where user_id = (select auth.uid()))) with check (exists(select 1 from public.firestone_admins where user_id = (select auth.uid())));
create policy "Read published slides" on public.firestone_slides for select to anon, authenticated using (published);
create policy "Manage slides" on public.firestone_slides for all to authenticated using (exists(select 1 from public.firestone_admins where user_id = (select auth.uid()))) with check (exists(select 1 from public.firestone_admins where user_id = (select auth.uid())));
create policy "Read section images" on public.firestone_images for select to anon, authenticated using (true);
create policy "Manage section images" on public.firestone_images for update to authenticated using (exists(select 1 from public.firestone_admins where user_id = (select auth.uid()))) with check (exists(select 1 from public.firestone_admins where user_id = (select auth.uid())));

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types) values ('firestone-media','firestone-media',true,12582912,array['image/jpeg','image/png','image/webp']);
create policy "Firestone media upload" on storage.objects for insert to authenticated with check (bucket_id = 'firestone-media' and exists(select 1 from public.firestone_admins where user_id = (select auth.uid())));
create policy "Firestone media admin read" on storage.objects for select to authenticated using (bucket_id = 'firestone-media' and exists(select 1 from public.firestone_admins where user_id = (select auth.uid())));

-- Optimistic concurrency uses a database-owned revision timestamp.
create function public.firestone_touch_updated_at() returns trigger language plpgsql security invoker set search_path = '' as $$
begin new.updated_at = clock_timestamp(); return new; end;
$$;
revoke execute on function public.firestone_touch_updated_at() from public,anon,authenticated;
create trigger touch_projects before update on public.firestone_projects for each row execute function public.firestone_touch_updated_at();
create trigger touch_slides before update on public.firestone_slides for each row execute function public.firestone_touch_updated_at();
create trigger touch_images before update on public.firestone_images for each row execute function public.firestone_touch_updated_at();

-- Customer testimonials: anyone can submit (always unpublished), admins review and publish.
create table public.firestone_testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 80),
  area text not null default '' check (length(area) <= 80),
  project text not null default '' check (length(project) <= 120),
  body text not null check (length(trim(body)) between 5 and 1000),
  show_name boolean not null default true,
  published boolean not null default false,
  position integer not null default 0 check (position between 0 and 100000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index firestone_testimonials_order on public.firestone_testimonials (position, created_at) where published;
alter table public.firestone_testimonials enable row level security;
revoke all on public.firestone_testimonials from anon, authenticated;
grant insert (name, area, project, body, show_name) on public.firestone_testimonials to anon, authenticated;
grant select (id, name, area, project, body, show_name, published, position, created_at, updated_at) on public.firestone_testimonials to anon, authenticated;
grant update, delete on public.firestone_testimonials to authenticated;
create policy "Submit testimonial" on public.firestone_testimonials for insert to anon, authenticated with check (published = false and position = 0);
create policy "Read published testimonials" on public.firestone_testimonials for select to anon, authenticated using (published);
create policy "Manage testimonials" on public.firestone_testimonials for all to authenticated using (exists(select 1 from public.firestone_admins where user_id = (select auth.uid()))) with check (exists(select 1 from public.firestone_admins where user_id = (select auth.uid())));
create trigger touch_testimonials before update on public.firestone_testimonials for each row execute function public.firestone_touch_updated_at();

-- Optional phone-only image for the wide banner slot.
alter table public.firestone_images add column mobile_url text not null default '' check (length(mobile_url) <= 2048);

-- Contact details shown across the public site (single row), editable from /admin.
create table public.firestone_contact (
  id boolean primary key default true check (id),
  phone text not null check (phone ~ '^\+[0-9]{8,15}$'),
  whatsapp text not null check (whatsapp ~ '^[0-9]{8,15}$'),
  instagram text not null default '' check (length(instagram) <= 300 and (instagram = '' or instagram ~ '^https://(www\.)?instagram\.com/')),
  facebook text not null default '' check (length(facebook) <= 300 and (facebook = '' or facebook ~ '^https://(www\.|m\.)?facebook\.com/')),
  tiktok text not null default '' check (length(tiktok) <= 300 and (tiktok = '' or tiktok ~ '^https://(www\.)?tiktok\.com/')),
  email text not null default '' check (length(email) <= 200 and (email = '' or email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  updated_at timestamptz not null default now()
);
alter table public.firestone_contact enable row level security;
revoke all on public.firestone_contact from anon, authenticated;
grant select on public.firestone_contact to anon, authenticated;
grant update (phone, whatsapp, instagram, facebook, tiktok, email) on public.firestone_contact to authenticated;
create policy "Read contact info" on public.firestone_contact for select to anon, authenticated using (true);
create policy "Manage contact info" on public.firestone_contact for update to authenticated using (exists(select 1 from public.firestone_admins where user_id = (select auth.uid()))) with check (exists(select 1 from public.firestone_admins where user_id = (select auth.uid())));
create trigger touch_contact before update on public.firestone_contact for each row execute function public.firestone_touch_updated_at();
insert into public.firestone_contact (phone, whatsapp, instagram, facebook) values ('+962798202604', '962798202604', 'https://www.instagram.com/firestonejo_/', 'https://facebook.com/profile.php?id=61588688032575');

-- Link-preview image for /review, served through /og/review.jpg (api/og-review.js).
alter table public.firestone_images drop constraint if exists firestone_images_slot_check;
alter table public.firestone_images add constraint firestone_images_slot_check check (slot in ('logo','banner','service-0','service-1','service-2','service-3','review-share'));
insert into public.firestone_images (slot, image_url) values ('review-share', '/assets/og-review.jpg') on conflict (slot) do nothing;
