create unique index notifications_profile_kind_subject_uidx
  on public.notifications (profile_id, kind, subject_id)
  where subject_id is not null;
