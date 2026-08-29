export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      daily_picks: {
        Row: {
          created_at: string
          editor_note: string | null
          id: string
          pick_date: string
          published_at: string | null
          song_id: string
          status: string
        }
        Insert: {
          created_at?: string
          editor_note?: string | null
          id?: string
          pick_date: string
          published_at?: string | null
          song_id: string
          status?: string
        }
        Update: {
          created_at?: string
          editor_note?: string | null
          id?: string
          pick_date?: string
          published_at?: string | null
          song_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_picks_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      lyrics: {
        Row: {
          ai_model_used: string | null
          created_at: string
          id: string
          is_verified: boolean | null
          korean_translation: string | null
          original_text: string | null
          song_id: string
          source_url: string | null
          translation_notes: string | null
          updated_at: string
        }
        Insert: {
          ai_model_used?: string | null
          created_at?: string
          id?: string
          is_verified?: boolean | null
          korean_translation?: string | null
          original_text?: string | null
          song_id: string
          source_url?: string | null
          translation_notes?: string | null
          updated_at?: string
        }
        Update: {
          ai_model_used?: string | null
          created_at?: string
          id?: string
          is_verified?: boolean | null
          korean_translation?: string | null
          original_text?: string | null
          song_id?: string
          source_url?: string | null
          translation_notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lyrics_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: true
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_runs: {
        Row: {
          created_at: string
          error_log: string | null
          id: string
          song_id: string | null
          status: string
          steps: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_log?: string | null
          id?: string
          song_id?: string | null
          status?: string
          steps?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_log?: string | null
          id?: string
          song_id?: string | null
          status?: string
          steps?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_runs_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          auth_user_id: string
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          provider: string | null
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          provider?: string | null
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          provider?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string
          expo_push_token: string
          id: string
          is_active: boolean | null
          notify_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expo_push_token: string
          id?: string
          is_active?: boolean | null
          notify_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expo_push_token?: string
          id?: string
          is_active?: boolean | null
          notify_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      song_info: {
        Row: {
          ai_model_used: string | null
          created_at: string
          description_ko: string | null
          historical_context_ko: string | null
          id: string
          is_verified: boolean | null
          scripture_reference: string | null
          song_id: string
          updated_at: string
        }
        Insert: {
          ai_model_used?: string | null
          created_at?: string
          description_ko?: string | null
          historical_context_ko?: string | null
          id?: string
          is_verified?: boolean | null
          scripture_reference?: string | null
          song_id: string
          updated_at?: string
        }
        Update: {
          ai_model_used?: string | null
          created_at?: string
          description_ko?: string | null
          historical_context_ko?: string | null
          id?: string
          is_verified?: boolean | null
          scripture_reference?: string | null
          song_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_info_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: true
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      songs: {
        Row: {
          album: string | null
          album_cover_source_url: string | null
          album_cover_url: string | null
          apple_music_id: string | null
          apple_music_url: string | null
          artist: string
          created_at: string
          genre: string | null
          id: string
          origin_country: string | null
          release_year: number | null
          spotify_id: string | null
          spotify_url: string | null
          title: string
          updated_at: string
          youtube_id: string | null
          youtube_url: string | null
        }
        Insert: {
          album?: string | null
          album_cover_source_url?: string | null
          album_cover_url?: string | null
          apple_music_id?: string | null
          apple_music_url?: string | null
          artist: string
          created_at?: string
          genre?: string | null
          id?: string
          origin_country?: string | null
          release_year?: number | null
          spotify_id?: string | null
          spotify_url?: string | null
          title: string
          updated_at?: string
          youtube_id?: string | null
          youtube_url?: string | null
        }
        Update: {
          album?: string | null
          album_cover_source_url?: string | null
          album_cover_url?: string | null
          apple_music_id?: string | null
          apple_music_url?: string | null
          artist?: string
          created_at?: string
          genre?: string | null
          id?: string
          origin_country?: string | null
          release_year?: number | null
          spotify_id?: string | null
          spotify_url?: string | null
          title?: string
          updated_at?: string
          youtube_id?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string
          id: string
          song_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          song_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          song_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
