alter table profiles
  add constraint profiles_name_not_blank check (length(btrim(name)) > 0);
