begin;

-- Private backing tables: browsers cannot read identities or write scores directly.
create table public.garden_scores (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (name ~ '^[A-Za-z0-9 _-]{3,24}$'),
  score integer not null check (score between 0 and 10000),
  achieved_at timestamptz not null default now(),
  last_submission_at timestamptz not null default now(),
  last_run_id uuid not null
);
create index garden_scores_ranking on public.garden_scores (score desc, achieved_at, user_id);
alter table public.garden_scores enable row level security;
revoke all on public.garden_scores from public, anon, authenticated;

-- A fixed Top 10 projection exposes only the chosen public name, rank and score.
create function public.garden_top_scores()
returns table(rank integer, name text, score integer)
language sql stable security definer set search_path = ''
as $$
  select (row_number() over (order by s.score desc, s.achieved_at, s.user_id))::integer,
    s.name, s.score
  from public.garden_scores s
  order by s.score desc, s.achieved_at, s.user_id
  limit 10;
$$;
revoke all on function public.garden_top_scores() from public;
grant execute on function public.garden_top_scores() to anon, authenticated;

-- Service-role only, called after the Edge Function verifies the player's JWT.
create function public.submit_garden_score(p_user uuid, p_name text, p_score integer, p_run uuid, p_seconds integer)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare previous public.garden_scores%rowtype;
begin
  if p_user is null or p_run is null or p_name is null or p_name !~ '^[A-Za-z0-9 _-]{3,24}$'
    or p_score is null or p_score not between 0 and 10000
    or p_seconds is null or p_seconds not between 10 and 86400 then
    return jsonb_build_object('ok', false);
  end if;
  -- Serialize a player's submissions, including their first insert.
  perform pg_advisory_xact_lock(hashtextextended(p_user::text, 0));
  select * into previous from public.garden_scores where user_id = p_user;
  if found then
    -- Retry after a lost response is harmless and does not consume another quota.
    if previous.last_run_id = p_run then return jsonb_build_object('ok', true); end if;
    if previous.last_submission_at > now() - interval '30 seconds' then
      return jsonb_build_object('ok', false, 'rate_limited', true);
    end if;
    update public.garden_scores set
      name = case when p_score >= previous.score then p_name else previous.name end,
      score = greatest(previous.score, p_score),
      achieved_at = case when p_score > previous.score then now() else previous.achieved_at end,
      last_submission_at = now(), last_run_id = p_run
    where user_id = p_user;
  else
    insert into public.garden_scores(user_id, name, score, last_run_id)
      values (p_user, p_name, p_score, p_run);
  end if;
  return jsonb_build_object('ok', true);
end;
$$;
revoke all on function public.submit_garden_score(uuid,text,integer,uuid,integer) from public, anon, authenticated;
grant execute on function public.submit_garden_score(uuid,text,integer,uuid,integer) to service_role;

commit;
