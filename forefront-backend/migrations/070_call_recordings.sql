CREATE TABLE IF NOT EXISTS call_recordings (
  id TEXT PRIMARY KEY,
  call_id TEXT,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  recording_url TEXT,
  recording_sid TEXT,
  duration INTEGER,
  file_size INTEGER,
  transcription TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recordings_workspace
  ON call_recordings(workspace_id);
CREATE INDEX IF NOT EXISTS idx_recordings_call
  ON call_recordings(call_id);
