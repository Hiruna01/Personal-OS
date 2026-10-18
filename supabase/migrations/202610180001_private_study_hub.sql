-- Phase 0–3 only. Apply as the database administrator.
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null unique references auth.users(id),
  name text not null check (char_length(name) between 1 and 100),
  timezone text not null default 'Asia/Colombo',
  created_at timestamptz not null default now()
);
create unique index one_workspace on public.workspaces ((true));
create function public.owns_workspace(wid uuid) returns boolean language sql stable security invoker set search_path = '' as $$
  select exists(select 1 from public.workspaces where id = wid and owner_user_id = (select auth.uid()));
$$;
create table public.academic_profiles (
  workspace_id uuid primary key references public.workspaces(id),
  university text not null check (char_length(university) between 1 and 200),
  programme text not null check (char_length(programme) between 1 and 200),
  start_year integer not null check (start_year between 1900 and 2200),
  expected_completion date,
  updated_at timestamptz not null default now()
);
create table public.semesters (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  name text not null check (char_length(name) between 1 and 160), academic_year text not null,
  starts_on date not null, ends_on date not null, status text not null default 'planned' check (status in ('planned','active','completed')),
  is_current boolean not null default false, created_at timestamptz not null default now(),
  unique(id,workspace_id), check(ends_on >= starts_on), check(not is_current or status = 'active')
);
create unique index one_current_semester on public.semesters(workspace_id) where is_current;
create index semesters_workspace on public.semesters(workspace_id, starts_on desc);
create table public.modules (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), semester_id uuid not null,
  title text not null check(char_length(title) between 1 and 200), code text not null check(code = upper(btrim(code)) and char_length(code) between 1 and 30),
  credits numeric(6,2) not null check(credits > 0 and credits <= 100), lecturer text, contact text,
  position integer not null default 0, created_at timestamptz not null default now(),
  foreign key(semester_id,workspace_id) references public.semesters(id,workspace_id),
  unique(semester_id,code), unique(id,workspace_id)
);
create index modules_parent on public.modules(workspace_id,semester_id,position);
create table public.lectures (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), module_id uuid not null,
  title text not null check(char_length(title) between 1 and 200), topic text, lecture_date date,
  position integer not null default 0, study_status text not null default 'not_started' check(study_status in ('not_started','studying','reviewed')),
  created_at timestamptz not null default now(), foreign key(module_id,workspace_id) references public.modules(id,workspace_id),
  unique(id,module_id,workspace_id)
);
create index lectures_parent on public.lectures(workspace_id,module_id,position,created_at);
-- New lectures append under the same module lock used by reordering.
create function public.append_lecture_position() returns trigger language plpgsql security invoker set search_path='' as $$
begin
  perform 1 from public.modules where id=new.module_id and workspace_id=new.workspace_id for update;
  select coalesce(max(position),0)+1 into new.position from public.lectures where module_id=new.module_id and workspace_id=new.workspace_id;
  return new;
end $$;
revoke all on function public.append_lecture_position() from public,anon,authenticated;
create trigger append_lecture before insert on public.lectures for each row execute function public.append_lecture_position();

create table public.assets (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), module_id uuid not null,
  object_path text not null unique, media_type text not null check(media_type in ('image/jpeg','image/png','image/webp')),
  byte_size integer not null check(byte_size > 0 and byte_size <= 2097152), created_at timestamptz not null default now(),
  foreign key(module_id,workspace_id) references public.modules(id,workspace_id), unique(id,module_id,workspace_id),
  check(object_path like workspace_id::text || '/' || module_id::text || '/%')
);
create table public.resources (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), module_id uuid not null, lecture_id uuid,
  kind text not null check(kind in ('lecture_note','exam_paper','exam_solution')), title text not null check(char_length(title) between 1 and 200),
  url text not null check(url ~ '^https?://'), thumbnail_asset_id uuid, thumbnail_url text check(thumbnail_url ~ '^https://'),
  paper_year integer check(paper_year between 1900 and 2200), exam_type text, position integer not null default 0,
  created_at timestamptz not null default now(), foreign key(module_id,workspace_id) references public.modules(id,workspace_id),
  foreign key(lecture_id,module_id,workspace_id) references public.lectures(id,module_id,workspace_id),
  foreign key(thumbnail_asset_id,module_id,workspace_id) references public.assets(id,module_id,workspace_id),
  check((kind='lecture_note' and lecture_id is not null) or (kind in ('exam_paper','exam_solution') and lecture_id is null)),
  check(thumbnail_asset_id is null or thumbnail_url is null)
);
create index resources_parent on public.resources(workspace_id,module_id,lecture_id,position);
create table public.projects (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), module_id uuid not null,
  title text not null check(char_length(title) between 1 and 200), created_at timestamptz not null default now(),
  foreign key(module_id,workspace_id) references public.modules(id,workspace_id), unique(id,module_id,workspace_id)
);
create table public.study_documents (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), module_id uuid not null, lecture_id uuid, project_id uuid,
  kind text not null check(kind in ('quiz','questions','project_brief')), category text check(category in ('tutorial','practical','essay','exam')),
  title text not null check(char_length(title) between 1 and 200), source_markdown text not null check(octet_length(source_markdown) between 1 and 1048576),
  quiz_json jsonb, parser_version text, revision integer not null default 1 check(revision > 0), original_filename text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key(module_id,workspace_id) references public.modules(id,workspace_id),
  foreign key(lecture_id,module_id,workspace_id) references public.lectures(id,module_id,workspace_id),
  foreign key(project_id,module_id,workspace_id) references public.projects(id,module_id,workspace_id),
  check((kind='project_brief' and project_id is not null and lecture_id is null) or (kind in ('quiz','questions') and project_id is null)),
  check((kind='questions' and category is not null and ((lecture_id is null and category='exam') or (lecture_id is not null and category in ('tutorial','practical','essay')))) or (kind <> 'questions' and category is null)),
  check((kind='quiz' and quiz_json is not null and parser_version is not null and jsonb_typeof(quiz_json)='object' and quiz_json ?& array['title','questions'] and jsonb_typeof(quiz_json->'title')='string' and jsonb_typeof(quiz_json->'questions')='array' and jsonb_array_length(quiz_json->'questions') between 1 and 100) or (kind<>'quiz' and quiz_json is null and parser_version is null))
);
create index documents_parent on public.study_documents(workspace_id,module_id,lecture_id,project_id,created_at desc);
create index projects_parent on public.projects(workspace_id,module_id);
create index assets_parent on public.assets(workspace_id,module_id);
-- Explicit grants, including revocation of Supabase default grants.
revoke all on all tables in schema public from anon, authenticated;
grant select on public.workspaces to authenticated;
grant update(name,timezone) on public.workspaces to authenticated;
alter table public.workspaces enable row level security;
create policy owner_workspace on public.workspaces for all to authenticated using(owner_user_id=(select auth.uid())) with check(owner_user_id=(select auth.uid()));
do $$ declare t text; begin
  foreach t in array array['academic_profiles','semesters','modules','lectures','assets','resources','projects','study_documents'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy owner_only on public.%I for all to authenticated using (public.owns_workspace(workspace_id)) with check (public.owns_workspace(workspace_id))',t);
    execute format('grant select, insert, update, delete on public.%I to authenticated',t);
  end loop;
end $$;
revoke all on function public.owns_workspace(uuid) from public,anon;
grant execute on function public.owns_workspace(uuid) to authenticated;
-- Atomically switch current semester; serialize workspace operations.
create function public.save_semester(payload jsonb) returns uuid language plpgsql security invoker set search_path='' as $$
declare wid uuid := (payload->>'workspace_id')::uuid; sid uuid := coalesce((payload->>'id')::uuid,gen_random_uuid());
begin
  if not public.owns_workspace(wid) then raise exception 'Workspace unavailable'; end if;
  perform 1 from public.workspaces where id=wid for update;
  if coalesce((payload->>'is_current')::boolean,false) then
    update public.semesters set is_current=false where workspace_id=wid and id<>sid and is_current;
  end if;
  if payload->>'id' is not null then
    update public.semesters set name=payload->>'name',academic_year=payload->>'academic_year',starts_on=(payload->>'starts_on')::date,ends_on=(payload->>'ends_on')::date,status=payload->>'status',is_current=(payload->>'is_current')::boolean where id=sid and workspace_id=wid;
    if not found then raise exception 'Semester unavailable'; end if;
  else
    insert into public.semesters(id,workspace_id,name,academic_year,starts_on,ends_on,status,is_current) values(sid,wid,payload->>'name',payload->>'academic_year',(payload->>'starts_on')::date,(payload->>'ends_on')::date,payload->>'status',(payload->>'is_current')::boolean);
  end if;
  return sid;
end $$;
-- Move one lecture inside its module in one transaction. No duplicate order assumptions.
create function public.reorder_lecture(target_id uuid,direction integer) returns void language plpgsql security invoker set search_path='' as $$
declare target public.lectures; row_record record; ids uuid[]; idx integer; other_idx integer; temp uuid;
begin
  select * into target from public.lectures where id=target_id;
  if not found or not public.owns_workspace(target.workspace_id) or direction not in (-1,1) then raise exception 'Lecture unavailable'; end if;
  perform 1 from public.modules where id=target.module_id for update;
  select array_agg(id order by position,created_at,id) into ids from public.lectures where module_id=target.module_id;
  idx:=array_position(ids,target_id); other_idx:=idx+direction;
  if other_idx<1 or other_idx>array_length(ids,1) then return; end if;
  temp:=ids[idx]; ids[idx]:=ids[other_idx]; ids[other_idx]:=temp;
  for row_record in select id, ordinality from unnest(ids) with ordinality as item(id,ordinality) loop
    update public.lectures set position=row_record.ordinality where id=row_record.id;
  end loop;
end $$;
-- Source and derived JSON share one atomic write; stale replacements are rejected.
create function public.save_study_document(payload jsonb,expected_revision integer) returns uuid language plpgsql security invoker set search_path='' as $$
declare wid uuid := (payload->>'workspace_id')::uuid; did uuid := coalesce((payload->>'id')::uuid,gen_random_uuid());
begin
  if not public.owns_workspace(wid) then raise exception 'Document unavailable'; end if;
  if payload->>'id' is not null then
    update public.study_documents set title=payload->>'title',category=payload->>'category',source_markdown=payload->>'source_markdown',quiz_json=nullif(payload->'quiz_json','null'::jsonb),parser_version=payload->>'parser_version',original_filename=payload->>'original_filename',revision=revision+1,updated_at=now()
    where id=did and workspace_id=wid and revision=expected_revision and module_id=(payload->>'module_id')::uuid and kind=payload->>'kind' and lecture_id is not distinct from (payload->>'lecture_id')::uuid and project_id is not distinct from (payload->>'project_id')::uuid;
    if not found then raise exception 'This document changed. Reload it before saving again.'; end if;
  else
    insert into public.study_documents(id,workspace_id,module_id,lecture_id,project_id,kind,category,title,source_markdown,quiz_json,parser_version,original_filename)
    values(did,wid,(payload->>'module_id')::uuid,(payload->>'lecture_id')::uuid,(payload->>'project_id')::uuid,payload->>'kind',payload->>'category',payload->>'title',payload->>'source_markdown',nullif(payload->'quiz_json','null'::jsonb),payload->>'parser_version',payload->>'original_filename');
  end if;
  return did;
end $$;
revoke all on function public.save_semester(jsonb), public.reorder_lecture(uuid,integer), public.save_study_document(jsonb,integer) from public,anon;
grant execute on function public.save_semester(jsonb), public.reorder_lecture(uuid,integer), public.save_study_document(jsonb,integer) to authenticated;
-- Private image objects; paths must refer to an owned module.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('thumbnails','thumbnails',false,2097152,array['image/jpeg','image/png','image/webp']);
create policy thumbnail_owner on storage.objects for all to authenticated
using(bucket_id='thumbnails' and exists(select 1 from public.modules m where m.workspace_id::text=(storage.foldername(name))[1] and m.id::text=(storage.foldername(name))[2] and public.owns_workspace(m.workspace_id)))
with check(bucket_id='thumbnails' and exists(select 1 from public.modules m where m.workspace_id::text=(storage.foldername(name))[1] and m.id::text=(storage.foldername(name))[2] and public.owns_workspace(m.workspace_id)));
