-- Transactional integration check. All test rows and updates are rolled back.
-- Requires the diagnostic anonymous account created during the live Auth check.
begin;
do $$
declare
  player uuid;
  first_run uuid := gen_random_uuid();
  second_run uuid := gen_random_uuid();
  before_count bigint;
  result jsonb;
begin
  select id into player from auth.users
    where is_anonymous and raw_user_meta_data @> '{"diagnostic":true}'::jsonb limit 1;
  if player is null then raise exception 'A diagnostic Auth user is required; no test account was created'; end if;
  select count(*) into before_count from public.garden_runs where user_id = player;
  update public.garden_scores set last_submission_at = now() - interval '6 seconds' where user_id = player;
  result := public.submit_garden_score(player, 'RunHistoryTest', 10000, first_run, 34);
  if result->>'ok' <> 'true' then raise exception 'First run not saved: %', result; end if;
  result := public.submit_garden_score(player, 'RunHistoryTest', 3994, second_run, 35);
  if result->>'rate_limited' <> 'true' then raise exception 'Rapid distinct submissions must be limited'; end if;
  update public.garden_scores set last_submission_at = now() - interval '6 seconds' where user_id = player;
  result := public.submit_garden_score(player, 'RunHistoryTest', 3994, second_run, 35);
  if result->>'ok' <> 'true' or (result->>'personal_best')::integer <> 10000 then
    raise exception 'Lower second run must be saved without replacing the best: %', result;
  end if;
  if (select count(*) from public.garden_runs where user_id = player) <> before_count + 2 then
    raise exception 'Both runs must have separate history records';
  end if;
  result := public.submit_garden_score(player, 'RunHistoryTest', 10000, first_run, 34);
  if result->>'duplicate' <> 'true' then raise exception 'An earlier-run retry must be idempotent after a later run'; end if;
  result := public.submit_garden_score(player, 'RunHistoryTest', 9999, first_run, 34);
  if result->>'ok' <> 'false' then raise exception 'A stored run cannot change score'; end if;
  if (select count(*) from public.garden_runs where user_id = player) <> before_count + 2 then
    raise exception 'Retries must not add records';
  end if;
  if has_table_privilege('anon', 'public.garden_runs', 'SELECT')
    or has_table_privilege('authenticated', 'public.garden_runs', 'SELECT')
    or has_table_privilege('authenticated', 'public.garden_runs', 'INSERT')
    or has_function_privilege('authenticated', 'public.submit_garden_score(uuid,text,integer,uuid,integer)', 'EXECUTE') then
    raise exception 'Private history or submission access leaked to browser roles';
  end if;
end;
$$;
rollback;
