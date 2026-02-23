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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          created_at: string
          email: string
          id: string
          installment_months: number | null
          package_id: string
          passport_number: string
          payment_method: string
          phone: string
          special_requests: string | null
          status: string
          traveller_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          installment_months?: number | null
          package_id: string
          passport_number: string
          payment_method: string
          phone: string
          special_requests?: string | null
          status?: string
          traveller_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          installment_months?: number | null
          package_id?: string
          passport_number?: string
          payment_method?: string
          phone?: string
          special_requests?: string | null
          status?: string
          traveller_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      discussions: {
        Row: {
          body: string
          category: string
          created_at: string
          id: string
          points: number
          title: string
          updated_at: string
          user_id: string
          views: number
        }
        Insert: {
          body: string
          category: string
          created_at?: string
          id?: string
          points?: number
          title: string
          updated_at?: string
          user_id: string
          views?: number
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          id?: string
          points?: number
          title?: string
          updated_at?: string
          user_id?: string
          views?: number
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          bookings: boolean
          community: boolean
          contributions: boolean
          created_at: string
          id: string
          membership: boolean
          sponsorship: boolean
          store: boolean
          system_notifications: boolean
          user_id: string
        }
        Insert: {
          bookings?: boolean
          community?: boolean
          contributions?: boolean
          created_at?: string
          id?: string
          membership?: boolean
          sponsorship?: boolean
          store?: boolean
          system_notifications?: boolean
          user_id: string
        }
        Update: {
          bookings?: boolean
          community?: boolean
          contributions?: boolean
          created_at?: string
          id?: string
          membership?: boolean
          sponsorship?: boolean
          store?: boolean
          system_notifications?: boolean
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          color: string
          id: string
          order_id: string
          product_id: string
          quantity: number
          size: string
          unit_price: number
        }
        Insert: {
          color: string
          id?: string
          order_id: string
          product_id: string
          quantity?: number
          size: string
          unit_price: number
        }
        Update: {
          color?: string
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          size?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          discount: number
          id: string
          status: string
          stripe_session_id: string | null
          subtotal: number
          total: number
          user_id: string
        }
        Insert: {
          created_at?: string
          discount?: number
          id?: string
          status?: string
          stripe_session_id?: string | null
          subtotal: number
          total: number
          user_id: string
        }
        Update: {
          created_at?: string
          discount?: number
          id?: string
          status?: string
          stripe_session_id?: string | null
          subtotal?: number
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      package_features: {
        Row: {
          feature: string
          id: string
          package_id: string
          sort_order: number
        }
        Insert: {
          feature: string
          id?: string
          package_id: string
          sort_order?: number
        }
        Update: {
          feature?: string
          id?: string
          package_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "package_features_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          accommodation: string
          created_at: string
          departure: string
          duration: string
          group_size: string
          guide: string
          id: string
          is_popular: boolean
          meals: string
          name: string
          price: number
        }
        Insert: {
          accommodation: string
          created_at?: string
          departure: string
          duration: string
          group_size: string
          guide: string
          id?: string
          is_popular?: boolean
          meals: string
          name: string
          price: number
        }
        Update: {
          accommodation?: string
          created_at?: string
          departure?: string
          duration?: string
          group_size?: string
          guide?: string
          id?: string
          is_popular?: boolean
          meals?: string
          name?: string
          price?: number
        }
        Relationships: []
      }
      points_ledger: {
        Row: {
          action: string
          created_at: string
          id: string
          points: number
          reference_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          points: number
          reference_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          points?: number
          reference_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          created_at: string
          discussion_id: string | null
          id: string
          reply_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          discussion_id?: string | null
          id?: string
          reply_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          discussion_id?: string | null
          id?: string
          reply_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_discussion_id_fkey"
            columns: ["discussion_id"]
            isOneToOne: false
            referencedRelation: "discussions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_reply_id_fkey"
            columns: ["reply_id"]
            isOneToOne: false
            referencedRelation: "replies"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          color_name: string
          color_value: string
          id: string
          product_id: string
          size: string
        }
        Insert: {
          color_name: string
          color_value: string
          id?: string
          product_id: string
          size: string
        }
        Update: {
          color_name?: string
          color_value?: string
          id?: string
          product_id?: string
          size?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          created_at: string
          id: string
          image_emoji: string | null
          is_limited: boolean
          name: string
          price: number
          rating: number
          reviews: number
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          image_emoji?: string | null
          is_limited?: boolean
          name: string
          price: number
          rating?: number
          reviews?: number
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          image_emoji?: string | null
          is_limited?: boolean
          name?: string
          price?: number
          rating?: number
          reviews?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          membership_status: string
          next_billing_date: string | null
          phone: string | null
          points_total: number
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          membership_status?: string
          next_billing_date?: string | null
          phone?: string | null
          points_total?: number
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          membership_status?: string
          next_billing_date?: string | null
          phone?: string | null
          points_total?: number
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      replies: {
        Row: {
          body: string
          created_at: string
          discussion_id: string
          id: string
          is_best_answer: boolean
          likes: number
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          discussion_id: string
          id?: string
          is_best_answer?: boolean
          likes?: number
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          discussion_id?: string
          id?: string
          is_best_answer?: boolean
          likes?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "replies_discussion_id_fkey"
            columns: ["discussion_id"]
            isOneToOne: false
            referencedRelation: "discussions"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          status: string
          stripe_payment_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          status?: string
          stripe_payment_id?: string | null
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          status?: string
          stripe_payment_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          goal_amount: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          goal_amount?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          goal_amount?: number
          id?: string
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
      get_wallet_stats: { Args: { p_user_id: string }; Returns: Json }
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
