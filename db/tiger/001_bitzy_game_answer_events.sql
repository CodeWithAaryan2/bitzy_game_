CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE IF NOT EXISTS public.bitzy_game_answer_events (
  answered_at timestamptz NOT NULL,
  user_id uuid NOT NULL,
  question_id text NOT NULL,
  game_name text NOT NULL CHECK (game_name IN (
    'quiz', 'truthy', 'prediction', 'bughunt', 'fillblank',
    'typing', 'codeorder', 'coderace', 'bugsquash', 'royale', 'dash'
  )),
  is_correct boolean NOT NULL,
  PRIMARY KEY (answered_at, user_id, question_id)
);

SELECT create_hypertable(
  'public.bitzy_game_answer_events',
  by_range('answered_at'),
  if_not_exists => TRUE
);

CREATE INDEX IF NOT EXISTS bitzy_game_answer_user_time_idx
  ON public.bitzy_game_answer_events (user_id, answered_at DESC);
CREATE INDEX IF NOT EXISTS bitzy_game_answer_user_game_time_idx
  ON public.bitzy_game_answer_events (user_id, game_name, answered_at DESC);
