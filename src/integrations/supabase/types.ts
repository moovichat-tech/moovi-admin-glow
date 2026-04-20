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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      afiliados: {
        Row: {
          cliques_basico: number
          cliques_premium: number
          cliques_pro: number
          comissao_percentual: number
          created_at: string
          id: string
          link_rastreio: string
          nome: string
          pix_chave: string
          rede_social: string | null
          saldo_a_pagar: number
          updated_at: string
          user_id: string
          vencimento_acesso: string | null
          vendas: number
          whatsapp: string
        }
        Insert: {
          cliques_basico?: number
          cliques_premium?: number
          cliques_pro?: number
          comissao_percentual?: number
          created_at?: string
          id?: string
          link_rastreio: string
          nome: string
          pix_chave: string
          rede_social?: string | null
          saldo_a_pagar?: number
          updated_at?: string
          user_id: string
          vencimento_acesso?: string | null
          vendas?: number
          whatsapp: string
        }
        Update: {
          cliques_basico?: number
          cliques_premium?: number
          cliques_pro?: number
          comissao_percentual?: number
          created_at?: string
          id?: string
          link_rastreio?: string
          nome?: string
          pix_chave?: string
          rede_social?: string | null
          saldo_a_pagar?: number
          updated_at?: string
          user_id?: string
          vencimento_acesso?: string | null
          vendas?: number
          whatsapp?: string
        }
        Relationships: []
      }
      assinaturas: {
        Row: {
          asaas_customer_id: string
          asaas_subscription_id: string
          ciclo: string
          created_at: string
          data_cancelamento: string | null
          data_inicio: string | null
          email: string | null
          id: string
          motivo_cancelamento: string | null
          nome: string | null
          plano: string | null
          proximo_vencimento: string | null
          raw_payload: Json | null
          status: string
          telefone: string | null
          updated_at: string
          valor: number
        }
        Insert: {
          asaas_customer_id: string
          asaas_subscription_id: string
          ciclo?: string
          created_at?: string
          data_cancelamento?: string | null
          data_inicio?: string | null
          email?: string | null
          id?: string
          motivo_cancelamento?: string | null
          nome?: string | null
          plano?: string | null
          proximo_vencimento?: string | null
          raw_payload?: Json | null
          status?: string
          telefone?: string | null
          updated_at?: string
          valor?: number
        }
        Update: {
          asaas_customer_id?: string
          asaas_subscription_id?: string
          ciclo?: string
          created_at?: string
          data_cancelamento?: string | null
          data_inicio?: string | null
          email?: string | null
          id?: string
          motivo_cancelamento?: string | null
          nome?: string | null
          plano?: string | null
          proximo_vencimento?: string | null
          raw_payload?: Json | null
          status?: string
          telefone?: string | null
          updated_at?: string
          valor?: number
        }
        Relationships: []
      }
      feedbacks_cancelamento: {
        Row: {
          comentario: string | null
          created_at: string
          data_cancelamento: string
          id: string
          motivo: string
          nome: string | null
          origem: string
          plano: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          comentario?: string | null
          created_at?: string
          data_cancelamento?: string
          id?: string
          motivo: string
          nome?: string | null
          origem?: string
          plano?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          comentario?: string | null
          created_at?: string
          data_cancelamento?: string
          id?: string
          motivo?: string
          nome?: string | null
          origem?: string
          plano?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pagamentos: {
        Row: {
          asaas_customer_id: string | null
          asaas_payment_id: string
          asaas_subscription_id: string | null
          created_at: string
          data_criacao: string | null
          data_pagamento: string | null
          data_vencimento: string | null
          id: string
          metodo: string | null
          raw_payload: Json | null
          status: string
          telefone: string | null
          updated_at: string
          valor: number
          valor_liquido: number | null
        }
        Insert: {
          asaas_customer_id?: string | null
          asaas_payment_id: string
          asaas_subscription_id?: string | null
          created_at?: string
          data_criacao?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          id?: string
          metodo?: string | null
          raw_payload?: Json | null
          status?: string
          telefone?: string | null
          updated_at?: string
          valor?: number
          valor_liquido?: number | null
        }
        Update: {
          asaas_customer_id?: string | null
          asaas_payment_id?: string
          asaas_subscription_id?: string | null
          created_at?: string
          data_criacao?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          id?: string
          metodo?: string | null
          raw_payload?: Json | null
          status?: string
          telefone?: string | null
          updated_at?: string
          valor?: number
          valor_liquido?: number | null
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          created_at: string
          data_renovacao: string | null
          gateway_pagamento: string | null
          id: string
          plano: string
          status: string
          telefone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_renovacao?: string | null
          gateway_pagamento?: string | null
          id?: string
          plano?: string
          status?: string
          telefone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_renovacao?: string | null
          gateway_pagamento?: string | null
          id?: string
          plano?: string
          status?: string
          telefone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_events_asaas: {
        Row: {
          created_at: string
          error: string | null
          event_id: string
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          event_id: string
          event_type: string
          id?: string
          payload: Json
          processed_at?: string | null
        }
        Update: {
          created_at?: string
          error?: string | null
          event_id?: string
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
        }
        Relationships: []
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
