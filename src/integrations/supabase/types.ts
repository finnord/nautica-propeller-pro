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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      bom_items: {
        Row: {
          component_id: string | null
          compound_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          propeller_id: string | null
          quantity: number
          unit: string | null
          volume_cm3: number | null
        }
        Insert: {
          component_id?: string | null
          compound_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          propeller_id?: string | null
          quantity: number
          unit?: string | null
          volume_cm3?: number | null
        }
        Update: {
          component_id?: string | null
          compound_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          propeller_id?: string | null
          quantity?: number
          unit?: string | null
          volume_cm3?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bom_items_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_items_compound_id_fkey"
            columns: ["compound_id"]
            isOneToOne: false
            referencedRelation: "compounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_items_propeller_id_fkey"
            columns: ["propeller_id"]
            isOneToOne: false
            referencedRelation: "propellers"
            referencedColumns: ["id"]
          },
        ]
      }
      changelog: {
        Row: {
          action: string
          changed_at: string | null
          changed_by: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          reason: string | null
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          reason?: string | null
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          reason?: string | null
          record_id?: string
          table_name?: string
        }
        Relationships: []
      }
      components: {
        Row: {
          category: string | null
          component_name: string
          created_at: string | null
          id: string
          lead_time: number | null
          part_number: string
          supplier: string | null
          unit_cost: number | null
        }
        Insert: {
          category?: string | null
          component_name: string
          created_at?: string | null
          id?: string
          lead_time?: number | null
          part_number: string
          supplier?: string | null
          unit_cost?: number | null
        }
        Update: {
          category?: string | null
          component_name?: string
          created_at?: string | null
          id?: string
          lead_time?: number | null
          part_number?: string
          supplier?: string | null
          unit_cost?: number | null
        }
        Relationships: []
      }
      compounds: {
        Row: {
          color: string | null
          compound_code: string
          compound_name: string
          cost_per_kg: number | null
          created_at: string | null
          density: number | null
          hardness: string | null
          id: string
          supplier: string | null
        }
        Insert: {
          color?: string | null
          compound_code: string
          compound_name: string
          cost_per_kg?: number | null
          created_at?: string | null
          density?: number | null
          hardness?: string | null
          id?: string
          supplier?: string | null
        }
        Update: {
          color?: string | null
          compound_code?: string
          compound_name?: string
          cost_per_kg?: number | null
          created_at?: string | null
          density?: number | null
          hardness?: string | null
          id?: string
          supplier?: string | null
        }
        Relationships: []
      }
      cross_references: {
        Row: {
          competitor_model: string | null
          created_at: string | null
          id: string
          notes: string | null
          propeller_id: string | null
          reference_code: string
          reference_type: string
        }
        Insert: {
          competitor_model?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          propeller_id?: string | null
          reference_code: string
          reference_type: string
        }
        Update: {
          competitor_model?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          propeller_id?: string | null
          reference_code?: string
          reference_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "cross_references_propeller_id_fkey"
            columns: ["propeller_id"]
            isOneToOne: false
            referencedRelation: "propellers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          annual_revenue_eur: number | null
          contacts: Json | null
          created_at: string
          id: string
          name: string
          notes: string | null
          updated_at: string
          vat_number: string | null
          website: string | null
        }
        Insert: {
          annual_revenue_eur?: number | null
          contacts?: Json | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
          vat_number?: string | null
          website?: string | null
        }
        Update: {
          annual_revenue_eur?: number | null
          contacts?: Json | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
          vat_number?: string | null
          website?: string | null
        }
        Relationships: []
      }
      drawings: {
        Row: {
          created_at: string | null
          drawing_number: string
          drawing_type: string | null
          file_url: string | null
          id: string
          propeller_id: string | null
          revision: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          drawing_number: string
          drawing_type?: string | null
          file_url?: string | null
          id?: string
          propeller_id?: string | null
          revision?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          drawing_number?: string
          drawing_type?: string | null
          file_url?: string | null
          id?: string
          propeller_id?: string | null
          revision?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "drawings_propeller_id_fkey"
            columns: ["propeller_id"]
            isOneToOne: false
            referencedRelation: "propellers"
            referencedColumns: ["id"]
          },
        ]
      }
      hubs: {
        Row: {
          bore_diameter: number | null
          created_at: string | null
          hub_length: number | null
          hub_type: string
          id: string
          keyway_size: string | null
          material: string | null
          propeller_id: string | null
        }
        Insert: {
          bore_diameter?: number | null
          created_at?: string | null
          hub_length?: number | null
          hub_type: string
          id?: string
          keyway_size?: string | null
          material?: string | null
          propeller_id?: string | null
        }
        Update: {
          bore_diameter?: number | null
          created_at?: string | null
          hub_length?: number | null
          hub_type?: string
          id?: string
          keyway_size?: string | null
          material?: string | null
          propeller_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hubs_propeller_id_fkey"
            columns: ["propeller_id"]
            isOneToOne: false
            referencedRelation: "propellers"
            referencedColumns: ["id"]
          },
        ]
      }
      price_list_items: {
        Row: {
          created_at: string
          id: string
          margin_euro: number | null
          margin_percent: number | null
          min_quantity: number | null
          notes: string | null
          price_list_id: string
          pricing_method: string
          propeller_id: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          margin_euro?: number | null
          margin_percent?: number | null
          min_quantity?: number | null
          notes?: string | null
          price_list_id: string
          pricing_method?: string
          propeller_id: string
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          margin_euro?: number | null
          margin_percent?: number | null
          min_quantity?: number | null
          notes?: string | null
          price_list_id?: string
          pricing_method?: string
          propeller_id?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_list_items_price_list_id_fkey"
            columns: ["price_list_id"]
            isOneToOne: false
            referencedRelation: "price_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_list_items_propeller_id_fkey"
            columns: ["propeller_id"]
            isOneToOne: false
            referencedRelation: "propellers"
            referencedColumns: ["id"]
          },
        ]
      }
      price_lists: {
        Row: {
          created_at: string
          currency: string
          customer_id: string
          id: string
          list_name: string
          notes: string | null
          updated_at: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_id: string
          id?: string
          list_name: string
          notes?: string | null
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          customer_id?: string
          id?: string
          list_name?: string
          notes?: string | null
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_lists_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      propellers: {
        Row: {
          blades: number | null
          created_at: string | null
          description: string | null
          diameter: number | null
          id: string
          material_type: string | null
          model: string
          pitch: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          blades?: number | null
          created_at?: string | null
          description?: string | null
          diameter?: number | null
          id?: string
          material_type?: string | null
          model: string
          pitch?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          blades?: number | null
          created_at?: string | null
          description?: string | null
          diameter?: number | null
          id?: string
          material_type?: string | null
          model?: string
          pitch?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rfq: {
        Row: {
          created_at: string
          customer_id: string
          expiry_date: string | null
          id: string
          notes: string | null
          rfq_date: string
          rfq_number: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          expiry_date?: string | null
          id?: string
          notes?: string | null
          rfq_date?: string
          rfq_number: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          expiry_date?: string | null
          id?: string
          notes?: string | null
          rfq_date?: string
          rfq_number?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfq_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_lines: {
        Row: {
          created_at: string
          external_code: string | null
          id: string
          line_number: number
          notes: string | null
          propeller_id: string | null
          quantity: number
          quoted_at: string | null
          quoted_price: number | null
          rfq_id: string
          target_price: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          external_code?: string | null
          id?: string
          line_number: number
          notes?: string | null
          propeller_id?: string | null
          quantity: number
          quoted_at?: string | null
          quoted_price?: number | null
          rfq_id: string
          target_price?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          external_code?: string | null
          id?: string
          line_number?: number
          notes?: string | null
          propeller_id?: string | null
          quantity?: number
          quoted_at?: string | null
          quoted_price?: number | null
          rfq_id?: string
          target_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfq_lines_propeller_id_fkey"
            columns: ["propeller_id"]
            isOneToOne: false
            referencedRelation: "propellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_lines_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfq"
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
