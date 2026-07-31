/**
 * Aus dem Supabase-Projekt generierte Typen.
 *
 * Nach jeder Schemaänderung neu erzeugen:
 *   npx supabase gen types typescript --linked > src/types/database.types.ts
 * und anschließend den Alias-Block am Dateiende wieder anfügen.
 */

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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          bank_type: Database["public"]["Enums"]["bank_type"]
          created_at: string
          iban_masked: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bank_type?: Database["public"]["Enums"]["bank_type"]
          created_at?: string
          iban_masked?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bank_type?: Database["public"]["Enums"]["bank_type"]
          created_at?: string
          iban_masked?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          active: boolean
          category_id: string
          created_at: string
          id: string
          monthly_limit: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          category_id: string
          created_at?: string
          id?: string
          monthly_limit: number
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          category_id?: string
          created_at?: string
          id?: string
          monthly_limit?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: string
          is_system: boolean
          kind: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          is_system?: boolean
          kind?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          is_system?: boolean
          kind?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      category_rules: {
        Row: {
          category_id: string
          created_at: string
          hit_count: number
          id: string
          match_type: Database["public"]["Enums"]["rule_match_type"]
          match_value: string
          priority: number
          source: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category_id: string
          created_at?: string
          hit_count?: number
          id?: string
          match_type: Database["public"]["Enums"]["rule_match_type"]
          match_value: string
          priority?: number
          source?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string
          hit_count?: number
          id?: string
          match_type?: Database["public"]["Enums"]["rule_match_type"]
          match_value?: string
          priority?: number
          source?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "category_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      import_batches: {
        Row: {
          account_id: string | null
          committed_at: string | null
          created_at: string
          detected_format: Database["public"]["Enums"]["bank_type"]
          duplicate_count: number
          error_message: string | null
          filename: string
          id: string
          imported_count: number
          row_count: number
          status: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          committed_at?: string | null
          created_at?: string
          detected_format?: Database["public"]["Enums"]["bank_type"]
          duplicate_count?: number
          error_message?: string | null
          filename: string
          id?: string
          imported_count?: number
          row_count?: number
          status?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          committed_at?: string | null
          created_at?: string
          detected_format?: Database["public"]["Enums"]["bank_type"]
          duplicate_count?: number
          error_message?: string | null
          filename?: string
          id?: string
          imported_count?: number
          row_count?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_batches_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          currency: string
          display_name: string | null
          id: string
          locale: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          display_name?: string | null
          id: string
          locale?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          display_name?: string | null
          id?: string
          locale?: string
          updated_at?: string
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          created_at: string
          description: string
          dismissed: boolean
          fingerprint: string
          id: string
          payload: Json
          period_end: string
          period_start: string
          severity: string
          title: string
          type: Database["public"]["Enums"]["insight_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          dismissed?: boolean
          fingerprint: string
          id?: string
          payload?: Json
          period_end: string
          period_start: string
          severity?: string
          title: string
          type: Database["public"]["Enums"]["insight_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          dismissed?: boolean
          fingerprint?: string
          id?: string
          payload?: Json
          period_end?: string
          period_start?: string
          severity?: string
          title?: string
          type?: Database["public"]["Enums"]["insight_type"]
          user_id?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string
          detail: Json
          event_type: string
          id: number
          ip_hash: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          detail?: Json
          event_type: string
          id?: never
          ip_hash?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          detail?: Json
          event_type?: string
          id?: never
          ip_hash?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          booking_date: string
          category_confidence: number | null
          category_id: string | null
          category_source: Database["public"]["Enums"]["category_source"]
          counterparty_iban: string | null
          counterparty_name: string | null
          created_at: string
          currency: string
          dedupe_hash: string
          id: string
          import_batch_id: string | null
          notes: string | null
          purpose: string | null
          updated_at: string
          user_id: string
          value_date: string | null
        }
        Insert: {
          account_id: string
          amount: number
          booking_date: string
          category_confidence?: number | null
          category_id?: string | null
          category_source?: Database["public"]["Enums"]["category_source"]
          counterparty_iban?: string | null
          counterparty_name?: string | null
          created_at?: string
          currency?: string
          dedupe_hash: string
          id?: string
          import_batch_id?: string | null
          notes?: string | null
          purpose?: string | null
          updated_at?: string
          user_id: string
          value_date?: string | null
        }
        Update: {
          account_id?: string
          amount?: number
          booking_date?: string
          category_confidence?: number | null
          category_id?: string | null
          category_source?: Database["public"]["Enums"]["category_source"]
          counterparty_iban?: string | null
          counterparty_name?: string | null
          created_at?: string
          currency?: string
          dedupe_hash?: string
          id?: string
          import_batch_id?: string | null
          notes?: string | null
          purpose?: string | null
          updated_at?: string
          user_id?: string
          value_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
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
      bank_type:
        | "sparkasse"
        | "dkb"
        | "ing"
        | "comdirect"
        | "volksbank"
        | "n26"
        | "generic"
      category_source: "rule" | "ai" | "manual" | "uncategorized"
      insight_type:
        | "category_increase"
        | "savings_potential"
        | "subscription_detected"
        | "unusual_spending"
        | "savings_rate"
      rule_match_type:
        | "keyword"
        | "merchant_exact"
        | "merchant_contains"
        | "iban"
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

export const Constants = {
  public: {
    Enums: {
      bank_type: [
        "sparkasse",
        "dkb",
        "ing",
        "comdirect",
        "volksbank",
        "n26",
        "generic",
      ],
      category_source: ["rule", "ai", "manual", "uncategorized"],
      insight_type: [
        "category_increase",
        "savings_potential",
        "subscription_detected",
        "unusual_spending",
        "savings_rate",
      ],
      rule_match_type: [
        "keyword",
        "merchant_exact",
        "merchant_contains",
        "iban",
      ],
    },
  },
} as const

// ---------------------------------------------------------------------------
// Anwendungsseitige Aliase
//
// Kurznamen für die Enums, damit der Anwendungscode nicht überall
// Enums<"..."> schreiben muss. Nach einer Neugenerierung wieder anfügen.
// ---------------------------------------------------------------------------

export type BankType = Enums<"bank_type">
export type CategorySource = Enums<"category_source">
export type RuleMatchType = Enums<"rule_match_type">
export type InsightType = Enums<"insight_type">

/** In der Datenbank ein CHECK-Constraint, daher nicht als Enum generiert. */
export type CategoryKind = "expense" | "income" | "transfer"
