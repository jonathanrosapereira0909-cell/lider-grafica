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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      apontamentos: {
        Row: {
          created_at: string
          fim: string | null
          id: string
          inicio: string
          maquina_id: string
          motivo_perda_id: string | null
          observacoes: string | null
          os_id: string
          qtd_perdida: number
          qtd_produzida: number
          updated_at: string
          usuario_id: string
          version: number
        }
        Insert: {
          created_at?: string
          fim?: string | null
          id?: string
          inicio: string
          maquina_id: string
          motivo_perda_id?: string | null
          observacoes?: string | null
          os_id: string
          qtd_perdida?: number
          qtd_produzida?: number
          updated_at?: string
          usuario_id: string
          version?: number
        }
        Update: {
          created_at?: string
          fim?: string | null
          id?: string
          inicio?: string
          maquina_id?: string
          motivo_perda_id?: string | null
          observacoes?: string | null
          os_id?: string
          qtd_perdida?: number
          qtd_produzida?: number
          updated_at?: string
          usuario_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "apontamentos_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "maquinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apontamentos_motivo_perda_id_fkey"
            columns: ["motivo_perda_id"]
            isOneToOne: false
            referencedRelation: "motivos_perda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apontamentos_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apontamentos_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "os_lista"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apontamentos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          acao: string
          antes: Json | null
          depois: Json | null
          em: string
          id: number
          registro_id: string | null
          tabela: string
          usuario_id: string | null
        }
        Insert: {
          acao: string
          antes?: Json | null
          depois?: Json | null
          em?: string
          id?: never
          registro_id?: string | null
          tabela: string
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          antes?: Json | null
          depois?: Json | null
          em?: string
          id?: never
          registro_id?: string | null
          tabela?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      clientes: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          created_by: string | null
          id: string
          nome: string
          telefone: string | null
          tipo: string
          updated_at: string
          version: number
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          created_by?: string | null
          id?: string
          nome: string
          telefone?: string | null
          tipo: string
          updated_at?: string
          version?: number
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          created_by?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          tipo?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      maquinas: {
        Row: {
          ativo: boolean
          codigo: string
          id: string
          nome: string
          setor_id: string | null
        }
        Insert: {
          ativo?: boolean
          codigo: string
          id?: string
          nome: string
          setor_id?: string | null
        }
        Update: {
          ativo?: boolean
          codigo?: string
          id?: string
          nome?: string
          setor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maquinas_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "setores"
            referencedColumns: ["id"]
          },
        ]
      }
      motivos_perda: {
        Row: {
          ativo: boolean
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          id?: string
          nome?: string
        }
        Relationships: []
      }
      orcamentos: {
        Row: {
          cliente_id: string
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          numero: number
          status: string
          valor: number
        }
        Insert: {
          cliente_id: string
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          numero?: number
          status?: string
          valor?: number
        }
        Update: {
          cliente_id?: string
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          numero?: number
          status?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_servico: {
        Row: {
          acabamento: string | null
          cancelado_em: string | null
          cancelado_por: string | null
          cliente_id: string
          created_at: string
          created_by: string | null
          data_entrega: string | null
          data_os: string
          descricao_servico: string | null
          dimensao_modelo: string | null
          entregue_por: string | null
          expedido_registrado_por: string | null
          faturado_em: string | null
          faturado_por: string | null
          finalizado_em: string | null
          finalizado_por: string | null
          id: string
          liberado_entrega_em: string | null
          liberado_entrega_por: string | null
          material: string | null
          motivo_cancelamento: string | null
          numero: number
          numero_orcamento: string | null
          observacao_entrega: string | null
          observacoes: string | null
          posicao_atual: string | null
          prazo_entrega: string | null
          producao_finalizada_em: string | null
          producao_finalizada_por: string | null
          produto_categoria: string
          produto_codigo: string
          produto_id: string
          produto_nome: string
          quantidade_faturada: number | null
          quantidade_solicitada: number
          recebido_por: string | null
          responsavel_id: string | null
          status: Database["public"]["Enums"]["os_status"]
          updated_at: string
          valor: number | null
          version: number
        }
        Insert: {
          acabamento?: string | null
          cancelado_em?: string | null
          cancelado_por?: string | null
          cliente_id: string
          created_at?: string
          created_by?: string | null
          data_entrega?: string | null
          data_os?: string
          descricao_servico?: string | null
          dimensao_modelo?: string | null
          entregue_por?: string | null
          expedido_registrado_por?: string | null
          faturado_em?: string | null
          faturado_por?: string | null
          finalizado_em?: string | null
          finalizado_por?: string | null
          id?: string
          liberado_entrega_em?: string | null
          liberado_entrega_por?: string | null
          material?: string | null
          motivo_cancelamento?: string | null
          numero: number
          numero_orcamento?: string | null
          observacao_entrega?: string | null
          observacoes?: string | null
          posicao_atual?: string | null
          prazo_entrega?: string | null
          producao_finalizada_em?: string | null
          producao_finalizada_por?: string | null
          produto_categoria: string
          produto_codigo: string
          produto_id: string
          produto_nome: string
          quantidade_faturada?: number | null
          quantidade_solicitada: number
          recebido_por?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["os_status"]
          updated_at?: string
          valor?: number | null
          version?: number
        }
        Update: {
          acabamento?: string | null
          cancelado_em?: string | null
          cancelado_por?: string | null
          cliente_id?: string
          created_at?: string
          created_by?: string | null
          data_entrega?: string | null
          data_os?: string
          descricao_servico?: string | null
          dimensao_modelo?: string | null
          entregue_por?: string | null
          expedido_registrado_por?: string | null
          faturado_em?: string | null
          faturado_por?: string | null
          finalizado_em?: string | null
          finalizado_por?: string | null
          id?: string
          liberado_entrega_em?: string | null
          liberado_entrega_por?: string | null
          material?: string | null
          motivo_cancelamento?: string | null
          numero?: number
          numero_orcamento?: string | null
          observacao_entrega?: string | null
          observacoes?: string | null
          posicao_atual?: string | null
          prazo_entrega?: string | null
          producao_finalizada_em?: string | null
          producao_finalizada_por?: string | null
          produto_categoria?: string
          produto_codigo?: string
          produto_id?: string
          produto_nome?: string
          quantidade_faturada?: number | null
          quantidade_solicitada?: number
          recebido_por?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["os_status"]
          updated_at?: string
          valor?: number | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "ordens_servico_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          cliente_id: string
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          numero: number
          orcamento_id: string | null
          status: string
          valor: number
        }
        Insert: {
          cliente_id: string
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          numero?: number
          orcamento_id?: string | null
          status?: string
          valor?: number
        }
        Update: {
          cliente_id?: string
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          numero?: number
          orcamento_id?: string | null
          status?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      produto_categorias: {
        Row: {
          ativo: boolean
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          ativo?: boolean
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          ativo?: boolean
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      produtos: {
        Row: {
          acabamento: string | null
          ativo: boolean
          categoria_id: string
          codigo: string
          created_at: string
          created_by: string | null
          especificacao: string | null
          id: string
          material: string | null
          nome: string
          updated_at: string
          version: number
        }
        Insert: {
          acabamento?: string | null
          ativo?: boolean
          categoria_id: string
          codigo: string
          created_at?: string
          created_by?: string | null
          especificacao?: string | null
          id?: string
          material?: string | null
          nome: string
          updated_at?: string
          version?: number
        }
        Update: {
          acabamento?: string | null
          ativo?: boolean
          categoria_id?: string
          codigo?: string
          created_at?: string
          created_by?: string | null
          especificacao?: string | null
          id?: string
          material?: string | null
          nome?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "produtos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "produto_categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          nome?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      setores: {
        Row: {
          ativo: boolean
          id: string
          meta_diaria: number | null
          nome: string
          ordem: number
        }
        Insert: {
          ativo?: boolean
          id?: string
          meta_diaria?: number | null
          nome: string
          ordem?: number
        }
        Update: {
          ativo?: boolean
          id?: string
          meta_diaria?: number | null
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      os_lista: {
        Row: {
          acabamento: string | null
          atrasada: boolean | null
          cancelado_em: string | null
          cancelado_por: string | null
          cliente_codigo: string | null
          cliente_id: string | null
          cliente_nome: string | null
          created_at: string | null
          created_by: string | null
          data_entrega: string | null
          data_inicial: string | null
          data_os: string | null
          descricao_servico: string | null
          dimensao_modelo: string | null
          entregue_por: string | null
          expedido_registrado_por: string | null
          faturado_em: string | null
          faturado_por: string | null
          finalizado_em: string | null
          finalizado_por: string | null
          id: string | null
          liberado_entrega_em: string | null
          liberado_entrega_por: string | null
          maquina_ids: string[] | null
          material: string | null
          motivo_cancelamento: string | null
          numero: number | null
          numero_orcamento: string | null
          observacao_entrega: string | null
          observacoes: string | null
          posicao_atual: string | null
          prazo_entrega: string | null
          producao_finalizada_em: string | null
          producao_finalizada_por: string | null
          produto_categoria: string | null
          produto_codigo: string | null
          produto_id: string | null
          produto_nome: string | null
          quantidade_faturada: number | null
          quantidade_solicitada: number | null
          recebido_por: string | null
          responsavel_id: string | null
          responsavel_nome: string | null
          status: Database["public"]["Enums"]["os_status"] | null
          total_perdido: number | null
          total_produzido: number | null
          updated_at: string | null
          valor: number | null
          version: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ordens_servico_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _os_transicao: {
        Args: {
          _de: Database["public"]["Enums"]["os_status"][]
          _id: string
          _para: Database["public"]["Enums"]["os_status"]
        }
        Returns: {
          acabamento: string | null
          cancelado_em: string | null
          cancelado_por: string | null
          cliente_id: string
          created_at: string
          created_by: string | null
          data_entrega: string | null
          data_os: string
          descricao_servico: string | null
          dimensao_modelo: string | null
          entregue_por: string | null
          expedido_registrado_por: string | null
          faturado_em: string | null
          faturado_por: string | null
          finalizado_em: string | null
          finalizado_por: string | null
          id: string
          liberado_entrega_em: string | null
          liberado_entrega_por: string | null
          material: string | null
          motivo_cancelamento: string | null
          numero: number
          numero_orcamento: string | null
          observacao_entrega: string | null
          observacoes: string | null
          posicao_atual: string | null
          prazo_entrega: string | null
          producao_finalizada_em: string | null
          producao_finalizada_por: string | null
          produto_categoria: string
          produto_codigo: string
          produto_id: string
          produto_nome: string
          quantidade_faturada: number | null
          quantidade_solicitada: number
          recebido_por: string | null
          responsavel_id: string | null
          status: Database["public"]["Enums"]["os_status"]
          updated_at: string
          valor: number | null
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "ordens_servico"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      dashboard_producao: { Args: { _dia: string }; Returns: Json }
      definir_papel: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_member: { Args: { _user_id: string }; Returns: boolean }
      os_baixar: { Args: { _id: string }; Returns: undefined }
      os_cancelar: {
        Args: { _id: string; _motivo: string }
        Returns: undefined
      }
      os_expedir: {
        Args: {
          _data_entrega: string
          _entregue_por: string
          _id: string
          _observacao: string
          _recebido_por: string
        }
        Returns: undefined
      }
      os_faturar: { Args: { _id: string }; Returns: undefined }
      os_finalizar_producao: { Args: { _id: string }; Returns: undefined }
      os_liberar_entrega: { Args: { _id: string }; Returns: undefined }
      relatorio_perdas: {
        Args: { _agrupar: string; _fim: string; _inicio: string }
        Returns: {
          apontamentos: number
          maquina: string
          motivo: string
          perdido: number
          periodo: string
          produzido: number
        }[]
      }
    }
    Enums: {
      app_role: "gestor" | "producao"
      os_status:
        | "aguardando_producao"
        | "em_producao"
        | "producao_finalizada"
        | "faturado"
        | "aguardando_entrega"
        | "entregue"
        | "finalizado"
        | "cancelado"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["gestor", "producao"],
      os_status: [
        "aguardando_producao",
        "em_producao",
        "producao_finalizada",
        "faturado",
        "aguardando_entrega",
        "entregue",
        "finalizado",
        "cancelado",
      ],
    },
  },
} as const
