-- Optional ElevenLabs voice override (null = use persona default from app catalog).
alter table public.user_preferences
  add column if not exists elevenlabs_voice_id text null;

comment on column public.user_preferences.elevenlabs_voice_id is
  'ElevenLabs voice_id override; null uses persona-mapped premade voice.';
