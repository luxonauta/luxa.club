create table
  public.leaderboard (
    id uuid not null default extensions.uuid_generate_v4 (),
    user_id uuid not null,
    username text null,
    total_score integer null default 0,
    constraint leaderboard_pkey primary key (id),
    constraint unique_user_id unique (user_id),
    constraint leaderboard_user_id_fkey foreign key (user_id) references auth.users (id)
  ) tablespace pg_default;