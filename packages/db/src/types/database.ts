// P0-S3-T1: `packages/db`의 DB 타입.
//
// **주의**: 이 환경에는 Docker/Podman이 없어 `supabase gen types typescript --db-url`이
// (v2.115 CLI가 introspection에 로컬 컨테이너를 요구함) 실패한다. 대신
// `supabase/migrations/*.sql` 5개 파일을 근거로 손으로 정확히 옮겨 적었다 — 실제 CLI
// 출력과 동일한 셰이프(Row/Insert/Update/Relationships, Json, 헬퍼 제네릭)를 따른다.
//
// Docker/Podman이 설치되면 `pnpm --filter @ongod/db gen:types`로 이 파일을 CLI가 실제
// 생성한 내용으로 교체하고, 아래 손으로 옮겨 적은 내용과 diff가 없는지 확인해라.
// 스키마가 바뀌면(새 마이그레이션) 이 파일도 반드시 같이 갱신해야 한다 — 자동 동기화 아님.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          auth_user_id: string;
          display_name: string | null;
          avatar_url: string | null;
          provider: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          provider?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          provider?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      songs: {
        Row: {
          id: string;
          title: string;
          artist: string;
          album: string | null;
          release_year: number | null;
          genre: string | null;
          origin_country: string | null;
          apple_music_id: string | null;
          spotify_id: string | null;
          youtube_id: string | null;
          apple_music_url: string | null;
          spotify_url: string | null;
          youtube_url: string | null;
          album_cover_url: string | null;
          album_cover_source_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          artist: string;
          album?: string | null;
          release_year?: number | null;
          genre?: string | null;
          origin_country?: string | null;
          apple_music_id?: string | null;
          spotify_id?: string | null;
          youtube_id?: string | null;
          apple_music_url?: string | null;
          spotify_url?: string | null;
          youtube_url?: string | null;
          album_cover_url?: string | null;
          album_cover_source_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          artist?: string;
          album?: string | null;
          release_year?: number | null;
          genre?: string | null;
          origin_country?: string | null;
          apple_music_id?: string | null;
          spotify_id?: string | null;
          youtube_id?: string | null;
          apple_music_url?: string | null;
          spotify_url?: string | null;
          youtube_url?: string | null;
          album_cover_url?: string | null;
          album_cover_source_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      lyrics: {
        Row: {
          id: string;
          song_id: string;
          original_text: string | null;
          korean_translation: string | null;
          translation_notes: string | null;
          ai_model_used: string | null;
          is_verified: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          song_id: string;
          original_text?: string | null;
          korean_translation?: string | null;
          translation_notes?: string | null;
          ai_model_used?: string | null;
          is_verified?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          song_id?: string;
          original_text?: string | null;
          korean_translation?: string | null;
          translation_notes?: string | null;
          ai_model_used?: string | null;
          is_verified?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lyrics_song_id_fkey";
            columns: ["song_id"];
            isOneToOne: true;
            referencedRelation: "songs";
            referencedColumns: ["id"];
          },
        ];
      };
      song_info: {
        Row: {
          id: string;
          song_id: string;
          description_ko: string | null;
          historical_context_ko: string | null;
          scripture_reference: string | null;
          ai_model_used: string | null;
          is_verified: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          song_id: string;
          description_ko?: string | null;
          historical_context_ko?: string | null;
          scripture_reference?: string | null;
          ai_model_used?: string | null;
          is_verified?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          song_id?: string;
          description_ko?: string | null;
          historical_context_ko?: string | null;
          scripture_reference?: string | null;
          ai_model_used?: string | null;
          is_verified?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "song_info_song_id_fkey";
            columns: ["song_id"];
            isOneToOne: true;
            referencedRelation: "songs";
            referencedColumns: ["id"];
          },
        ];
      };
      daily_picks: {
        Row: {
          id: string;
          song_id: string;
          pick_date: string;
          editor_note: string | null;
          status: string;
          published_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          song_id: string;
          pick_date: string;
          editor_note?: string | null;
          status?: string;
          published_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          song_id?: string;
          pick_date?: string;
          editor_note?: string | null;
          status?: string;
          published_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "daily_picks_song_id_fkey";
            columns: ["song_id"];
            isOneToOne: false;
            referencedRelation: "songs";
            referencedColumns: ["id"];
          },
        ];
      };
      user_favorites: {
        Row: {
          id: string;
          user_id: string;
          song_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          song_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          song_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_favorites_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_favorites_song_id_fkey";
            columns: ["song_id"];
            isOneToOne: false;
            referencedRelation: "songs";
            referencedColumns: ["id"];
          },
        ];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          expo_push_token: string;
          notify_at: string;
          is_active: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          expo_push_token: string;
          notify_at?: string;
          is_active?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          expo_push_token?: string;
          notify_at?: string;
          is_active?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      pipeline_runs: {
        Row: {
          id: string;
          song_id: string | null;
          status: string;
          steps: Json;
          error_log: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          song_id?: string | null;
          status?: string;
          steps?: Json;
          error_log?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          song_id?: string | null;
          status?: string;
          steps?: Json;
          error_log?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pipeline_runs_song_id_fkey";
            columns: ["song_id"];
            isOneToOne: false;
            referencedRelation: "songs";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

type PublicSchema = Database["public"];

export type Tables<TableName extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][TableName]["Row"];

export type TablesInsert<TableName extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][TableName]["Insert"];

export type TablesUpdate<TableName extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][TableName]["Update"];
