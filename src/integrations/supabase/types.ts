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
      activity_log: {
        Row: {
          activity_type: string
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          external_url: string | null
          id: string
          metadata: Json | null
          project_id: string | null
          stage: Database["public"]["Enums"]["pipeline_stage"] | null
          title: string
          tool_used: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          external_url?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string | null
          stage?: Database["public"]["Enums"]["pipeline_stage"] | null
          title: string
          tool_used?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          external_url?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string | null
          stage?: Database["public"]["Enums"]["pipeline_stage"] | null
          title?: string
          tool_used?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string | null
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          revoked_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          revoked_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          revoked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      constraint_profiles: {
        Row: {
          builder_tools: string[] | null
          created_at: string | null
          existing_assets: string[] | null
          id: string
          notes: string | null
          risk_tolerance: string | null
          target_revenue_model: string[] | null
          tech_stack: string[] | null
          time_budget_hours_per_week: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          builder_tools?: string[] | null
          created_at?: string | null
          existing_assets?: string[] | null
          id?: string
          notes?: string | null
          risk_tolerance?: string | null
          target_revenue_model?: string[] | null
          tech_stack?: string[] | null
          time_budget_hours_per_week?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          builder_tools?: string[] | null
          created_at?: string | null
          existing_assets?: string[] | null
          id?: string
          notes?: string | null
          risk_tolerance?: string | null
          target_revenue_model?: string[] | null
          tech_stack?: string[] | null
          time_budget_hours_per_week?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      context_parking: {
        Row: {
          breadcrumb: string
          form_state: Json | null
          id: string
          is_active: boolean | null
          notes: string | null
          page_route: string | null
          parked_at: string | null
          project_id: string
          resumed_at: string | null
          stage: Database["public"]["Enums"]["pipeline_stage"]
          user_id: string
        }
        Insert: {
          breadcrumb: string
          form_state?: Json | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          page_route?: string | null
          parked_at?: string | null
          project_id: string
          resumed_at?: string | null
          stage: Database["public"]["Enums"]["pipeline_stage"]
          user_id: string
        }
        Update: {
          breadcrumb?: string
          form_state?: Json | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          page_route?: string | null
          parked_at?: string | null
          project_id?: string
          resumed_at?: string | null
          stage?: Database["public"]["Enums"]["pipeline_stage"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "context_parking_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      decisions: {
        Row: {
          chosen_evaluation_id: string | null
          confidence: number | null
          created_at: string | null
          decided_at: string | null
          decision: string | null
          id: string
          project_id: string
          ranking: Json | null
          reasoning: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chosen_evaluation_id?: string | null
          confidence?: number | null
          created_at?: string | null
          decided_at?: string | null
          decision?: string | null
          id?: string
          project_id: string
          ranking?: Json | null
          reasoning?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chosen_evaluation_id?: string | null
          confidence?: number | null
          created_at?: string | null
          decided_at?: string | null
          decision?: string | null
          id?: string
          project_id?: string
          ranking?: Json | null
          reasoning?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decisions_chosen_evaluation_id_fkey"
            columns: ["chosen_evaluation_id"]
            isOneToOne: false
            referencedRelation: "evaluations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          build_effort_score: number | null
          competition_score: number | null
          competitors: string | null
          complexity_notes: string | null
          created_at: string | null
          differentiation: string | null
          estimated_weeks: number | null
          id: string
          market_growth: string | null
          market_size_estimate: string | null
          market_size_score: number | null
          overall_score: number | null
          pain_description: string | null
          pain_frequency: string | null
          pain_severity_score: number | null
          project_id: string
          research_notes: string | null
          revenue_estimate: string | null
          revenue_model: string | null
          revenue_score: number | null
          signal_id: string | null
          status: string | null
          tech_fit_notes: string | null
          tech_fit_score: number | null
          tech_requirements: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          build_effort_score?: number | null
          competition_score?: number | null
          competitors?: string | null
          complexity_notes?: string | null
          created_at?: string | null
          differentiation?: string | null
          estimated_weeks?: number | null
          id?: string
          market_growth?: string | null
          market_size_estimate?: string | null
          market_size_score?: number | null
          overall_score?: number | null
          pain_description?: string | null
          pain_frequency?: string | null
          pain_severity_score?: number | null
          project_id: string
          research_notes?: string | null
          revenue_estimate?: string | null
          revenue_model?: string | null
          revenue_score?: number | null
          signal_id?: string | null
          status?: string | null
          tech_fit_notes?: string | null
          tech_fit_score?: number | null
          tech_requirements?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          build_effort_score?: number | null
          competition_score?: number | null
          competitors?: string | null
          complexity_notes?: string | null
          created_at?: string | null
          differentiation?: string | null
          estimated_weeks?: number | null
          id?: string
          market_growth?: string | null
          market_size_estimate?: string | null
          market_size_score?: number | null
          overall_score?: number | null
          pain_description?: string | null
          pain_frequency?: string | null
          pain_severity_score?: number | null
          project_id?: string
          research_notes?: string | null
          revenue_estimate?: string | null
          revenue_model?: string | null
          revenue_score?: number | null
          signal_id?: string | null
          status?: string | null
          tech_fit_notes?: string | null
          tech_fit_score?: number | null
          tech_requirements?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          id: string
          onboarded: boolean | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          onboarded?: boolean | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          onboarded?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          color: string | null
          created_at: string | null
          current_stage: Database["public"]["Enums"]["pipeline_stage"]
          description: string | null
          id: string
          is_focused: boolean | null
          name: string
          project_notes: string | null
          project_type: Database["public"]["Enums"]["project_type"]
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          current_stage?: Database["public"]["Enums"]["pipeline_stage"]
          description?: string | null
          id?: string
          is_focused?: boolean | null
          name: string
          project_notes?: string | null
          project_type?: Database["public"]["Enums"]["project_type"]
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          current_stage?: Database["public"]["Enums"]["pipeline_stage"]
          description?: string | null
          id?: string
          is_focused?: boolean | null
          name?: string
          project_notes?: string | null
          project_type?: Database["public"]["Enums"]["project_type"]
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      signals: {
        Row: {
          ai_assessment: Json | null
          body: string | null
          created_at: string | null
          id: string
          project_id: string | null
          score: number | null
          score_reasoning: string | null
          source: Database["public"]["Enums"]["signal_source"]
          source_metadata: Json | null
          source_url: string | null
          status: Database["public"]["Enums"]["signal_status"]
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_assessment?: Json | null
          body?: string | null
          created_at?: string | null
          id?: string
          project_id?: string | null
          score?: number | null
          score_reasoning?: string | null
          source?: Database["public"]["Enums"]["signal_source"]
          source_metadata?: Json | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["signal_status"]
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_assessment?: Json | null
          body?: string | null
          created_at?: string | null
          id?: string
          project_id?: string | null
          score?: number | null
          score_reasoning?: string | null
          source?: Database["public"]["Enums"]["signal_source"]
          source_metadata?: Json | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["signal_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          notes: string | null
          project_id: string
          stage: Database["public"]["Enums"]["pipeline_stage"]
          started_at: string | null
          status: Database["public"]["Enums"]["stage_status"]
          time_budget_seconds: number | null
          time_spent_seconds: number | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          project_id: string
          stage: Database["public"]["Enums"]["pipeline_stage"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["stage_status"]
          time_budget_seconds?: number | null
          time_spent_seconds?: number | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          stage?: Database["public"]["Enums"]["pipeline_stage"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["stage_status"]
          time_budget_seconds?: number | null
          time_spent_seconds?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stage_progress_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          phase: string | null
          priority: Database["public"]["Enums"]["task_priority"] | null
          project_id: string
          sort_order: number | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          phase?: string | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          project_id: string
          sort_order?: number | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          phase?: string | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          project_id?: string
          sort_order?: number | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          duration_seconds: number | null
          ended_at: string | null
          id: string
          label: string | null
          project_id: string
          stage: Database["public"]["Enums"]["pipeline_stage"]
          started_at: string
          user_id: string
        }
        Insert: {
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          label?: string | null
          project_id: string
          stage: Database["public"]["Enums"]["pipeline_stage"]
          started_at?: string
          user_id: string
        }
        Update: {
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          label?: string | null
          project_id?: string
          stage?: Database["public"]["Enums"]["pipeline_stage"]
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
      pipeline_stage: "capture" | "score" | "evaluate" | "decide" | "execute"
      project_status: "active" | "paused" | "completed" | "archived"
      project_type: "niche_eval" | "client_seo" | "custom"
      signal_source: "reddit" | "g2" | "manual" | "web_clip" | "import" | "mcp"
      signal_status: "inbox" | "scored" | "promoted" | "archived"
      stage_status: "not_started" | "in_progress" | "completed" | "skipped"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "todo" | "in_progress" | "blocked" | "done"
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
      pipeline_stage: ["capture", "score", "evaluate", "decide", "execute"],
      project_status: ["active", "paused", "completed", "archived"],
      project_type: ["niche_eval", "client_seo", "custom"],
      signal_source: ["reddit", "g2", "manual", "web_clip", "import", "mcp"],
      signal_status: ["inbox", "scored", "promoted", "archived"],
      stage_status: ["not_started", "in_progress", "completed", "skipped"],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["todo", "in_progress", "blocked", "done"],
    },
  },
} as const
