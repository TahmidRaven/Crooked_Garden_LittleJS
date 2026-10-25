begin;

-- Keep every newly submitted run separately; existing personal bests are preserved.
create table public.garden_runs (
  user_id uuid not null references auth.users(id) on delete cascade,
  run_id uuid not null,
  name text not null check (name ~ '^[A-Za-z0-9 _-]{3,24}$'),
  score integer not null check (score between 0 and 10000),
  duration_seconds integer not null check (duration_seconds between 10 and 86400),
  submitted_at timestamptz not null default now(),
  primary key (user_id, run_id)
);
create index garden_runs_player_time on public.garden_runs (user_id, submitted_at desc);
alter table public.garden_runs enable row level security;
revoke all on public.garden_runs from public, anon, authenticated;

create or replace function public.submit_garden_score(p_user uuid, p_name text, p_score integer, p_run uuid, p_seconds integer)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  previous public.garden_scores%rowtype;
  existing_run public.garden_runs%rowtype;
  improved boolean;
  retry_seconds integer;
begin
  if p_user is null or p_run is null or p_name is null or p_name !~ '^[A-Za-z0-9 _-]{3,24}$'
    or p_score is null or p_score not between 0 and 10000
    or p_seconds is null or p_seconds not between 10 and 86400 then
    return jsonb_build_object('ok', false);
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user::text, 0));
  select * into previous from public.garden_scores where user_id = p_user;
  select * into existing_run from public.garden_runs where user_id = p_user and run_id = p_run;
  if found then
    -- Any retry of an already recorded run is idempotent, even after later runs.
    if existing_run.score <> p_score or existing_run.duration_seconds <> p_seconds then
      return jsonb_build_object('ok', false);
    end if;
    return jsonb_build_object('ok', true, 'duplicate', true, 'personal_best', previous.score);
  end if;
  if previous.user_id is not null then
    -- A legacy last-run retry must not manufacture a second history entry.
    if previous.last_run_id = p_run then
      return jsonb_build_object('ok', true, 'duplicate', true, 'personal_best', previous.score);
    end if;
    retry_seconds := ceil(extract(epoch from previous.last_submission_at + interval '5 seconds' - now()))::integer;
    if retry_seconds > 0 then
      return jsonb_build_object('ok', false, 'rate_limited', true, 'retry_after_seconds', retry_seconds);
    end if;
  end if;
  improved := previous.user_id is null or p_score > previous.score;
  insert into public.garden_runs(user_id, run_id, name, score, duration_seconds)
    values (p_user, p_run, p_name, p_score, p_seconds);
  insert into public.garden_scores(user_id, name, score, last_run_id)
    values (p_user, p_name, p_score, p_run)
  on conflict (user_id) do update set
    name = case when excluded.score >= garden_scores.score then excluded.name else garden_scores.name end,
    score = greatest(garden_scores.score, excluded.score),
    achieved_at = case when excluded.score > garden_scores.score then now() else garden_scores.achieved_at end,
    last_submission_at = now(), last_run_id = excluded.last_run_id;
  return jsonb_build_object('ok', true, 'duplicate', false, 'improved', improved,
    'personal_best', greatest(coalesce(previous.score, 0), p_score));
end;
$$;
revoke all on function public.submit_garden_score(uuid,text,integer,uuid,integer) from public, anon, authenticated;
grant execute on function public.submit_garden_score(uuid,text,integer,uuid,integer) to service_role;

commit;
