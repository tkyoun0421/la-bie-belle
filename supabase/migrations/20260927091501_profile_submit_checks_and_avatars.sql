-- 프로필 제출이 보는 꼴을 둘 더한다. 연락처는 이미 함수가 보고 있었고(invalid_phone),
-- 이름과 성별은 앱만 보고 있어서 앱을 안 거친 호출이 그대로 들어왔다.
-- 근거는 docs/2-design/modules/account/README.md 의 ACC-002 와
-- docs/2-design/spec/profile-form.md 의 AC-02 다.
create or replace function public.submit_profile(
  display_name text,
  phone text,
  birth_date date,
  gender text
)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  caller_profile public.profiles;
begin
  select * into caller_profile
  from public.profiles
  where user_id = auth.uid();

  if not found then
    raise exception using message = 'not_allowed';
  end if;

  if submit_profile.display_name is null or btrim(submit_profile.display_name) = '' then
    raise exception using message = 'invalid_name';
  end if;

  if submit_profile.phone is null or submit_profile.phone !~ '^010-\d{4}-\d{4}$' then
    raise exception using message = 'invalid_phone';
  end if;

  if submit_profile.gender is null or submit_profile.gender not in ('female', 'male') then
    raise exception using message = 'invalid_gender';
  end if;

  if caller_profile.submitted_at is not null and caller_profile.rejected_at is null then
    raise exception using message = 'already_submitted';
  end if;

  update public.profiles
  set display_name = submit_profile.display_name,
      submitted_at = now(),
      rejected_at = null
  where id = caller_profile.id;

  insert into public.profile_private (profile_id, phone, birth_date, gender)
  values (
    caller_profile.id,
    submit_profile.phone,
    submit_profile.birth_date,
    submit_profile.gender
  )
  on conflict (profile_id) do update
  set phone = excluded.phone,
      birth_date = excluded.birth_date,
      gender = excluded.gender;
end;
$$;

-- 본인이 올린 사진이 사는 자리다. 정본은
-- docs/2-design/modules/account/design.md 의 「사진 저장」이다.
--
-- 공개 읽기인 것은 승인된 전원이 목록과 픽커에서 같은 사진을 그리기 때문이다. 서명 URL을
-- 매번 받으면 화면마다 호출이 늘고 오프라인 캐시가 어렵다. 파일 이름에 uuid가 들어 있어
-- 주소를 추측으로는 못 연다.
--
-- 상한 1MB는 앱이 512px 정사각 JPEG(품질 0.8)로 줄여 올린다는 전제의 뒷문이다 — 줄이기를 건너뛴
-- 호출이 폰 원본을 그대로 올리는 것을 버킷이 막는다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  1048576,
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- 쓰는 자리는 제 `<user_id>/` 폴더뿐이다. 지우기는 안 연다 — 옛 파일은 안 지우고 두는 것이
-- 「사진 저장」의 결정이라 삭제를 열 이유가 없다.
create policy avatars_insert_own
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy avatars_update_own
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy avatars_select_public
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'avatars');
