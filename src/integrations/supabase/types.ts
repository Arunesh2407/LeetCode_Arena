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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          elo_rating: number
          id: string
          leetcode_username: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          elo_rating?: number
          id?: string
          leetcode_username?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          elo_rating?: number
          id?: string
          leetcode_username?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      room_participants: {
        Row: {
          id: string
          joined_at: string
          room_id: string
          score: number
          solve_time_seconds: number | null
          status: Database["public"]["Enums"]["participant_status"]
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          room_id: string
          score?: number
          solve_time_seconds?: number | null
          status?: Database["public"]["Enums"]["participant_status"]
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          room_id?: string
          score?: number
          solve_time_seconds?: number | null
          status?: Database["public"]["Enums"]["participant_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_problems: {
        Row: {
          difficulty: Database["public"]["Enums"]["difficulty"]
          id: string
          leetcode_id: number
          room_id: string
          started_at: string
          title: string
          topics: string[]
          url: string
        }
        Insert: {
          difficulty: Database["public"]["Enums"]["difficulty"]
          id?: string
          leetcode_id: number
          room_id: string
          started_at?: string
          title: string
          topics?: string[]
          url: string
        }
        Update: {
          difficulty?: Database["public"]["Enums"]["difficulty"]
          id?: string
          leetcode_id?: number
          room_id?: string
          started_at?: string
          title?: string
          topics?: string[]
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_problems_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          code: string
          created_at: string
          host_user_id: string
          id: string
          max_players: number
          status: Database["public"]["Enums"]["room_status"]
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          host_user_id: string
          id?: string
          max_players?: number
          status?: Database["public"]["Enums"]["room_status"]
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          host_user_id?: string
          id?: string
          max_players?: number
          status?: Database["public"]["Enums"]["room_status"]
          updated_at?: string
        }
        Relationships: []
      }
      solved_problems: {
        Row: {
          difficulty: Database["public"]["Enums"]["difficulty"]
          id: string
          leetcode_id: number
          title: string
          topics: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          difficulty: Database["public"]["Enums"]["difficulty"]
          id?: string
          leetcode_id: number
          title: string
          topics?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          difficulty?: Database["public"]["Enums"]["difficulty"]
          id?: string
          leetcode_id?: number
          title?: string
          topics?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      topic_mastery: {
        Row: {
          id: string
          solved_count: number
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          solved_count?: number
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          solved_count?: number
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_room_code: { Args: never; Returns: string }
    }
    Enums: {
      difficulty: "Easy" | "Medium" | "Hard"
      participant_status: "idle" | "coding" | "submitted"
      room_status: "waiting" | "in_progress" | "completed"
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
    Enums: {
      difficulty: ["Easy", "Medium", "Hard"],
      participant_status: ["idle", "coding", "submitted"],
      room_status: ["waiting", "in_progress", "completed"],
    },
  },
} as const
