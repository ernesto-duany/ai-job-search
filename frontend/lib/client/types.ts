export interface ActivityItem {
  id: string;
  kind: "tool_use" | "permission_denial" | "system" | "raw";
  label: string;
  detail?: unknown;
}

export interface TranscriptTurn {
  id: string;
  role: "user" | "assistant";
  text: string;
  activity: ActivityItem[];
  status: "streaming" | "done" | "error";
  costUsd?: number | null;
  durationMs?: number | null;
}
