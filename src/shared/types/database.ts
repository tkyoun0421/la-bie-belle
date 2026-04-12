import type {
  Database as GeneratedDatabase,
  Enums,
  Json,
  Tables,
  TablesUpdate,
} from "#/shared/types/database.generated";

type PublicSchema = GeneratedDatabase["public"];
type PositionsTable = PublicSchema["Tables"]["positions"];
type CreateEventFunction = PublicSchema["Functions"]["create_event"];
type CreateEventTemplateFunction =
  PublicSchema["Functions"]["create_event_template"];

type NormalizedCreateEventFunction = CreateEventFunction extends {
  Args: infer TArgs;
  Returns: infer TReturns;
}
  ? {
      Args: Omit<TArgs, "p_created_by"> & {
        p_created_by?: string | null;
      };
      Returns: TReturns;
    }
  : never;

type NormalizedCreateEventTemplateFunction = CreateEventTemplateFunction extends {
  Args: infer TArgs;
  Returns: infer TReturns;
}
  ? {
      Args: Omit<TArgs, "p_created_by"> & {
        p_created_by?: string | null;
      };
      Returns: TReturns;
    }
  : never;

export type Database = Omit<GeneratedDatabase, "public"> & {
  public: Omit<PublicSchema, "Functions" | "Tables"> & {
    Functions: Omit<
      PublicSchema["Functions"],
      "create_event" | "create_event_template"
    > & {
      create_event: NormalizedCreateEventFunction;
      create_event_template: NormalizedCreateEventTemplateFunction;
    };
    Tables: Omit<PublicSchema["Tables"], "positions"> & {
      positions: Omit<PositionsTable, "Insert"> & {
        Insert: Omit<PositionsTable["Insert"], "sort_order"> & {
          sort_order?: number;
        };
      };
    };
  };
};

export type { Json };

export type TableRow<TableName extends keyof Database["public"]["Tables"]> =
  Tables<TableName>;

export type TableInsert<
  TableName extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][TableName]["Insert"];

export type TableUpdate<
  TableName extends keyof Database["public"]["Tables"],
> = TablesUpdate<TableName>;

export type DatabaseEnum<EnumName extends keyof Database["public"]["Enums"]> =
  Enums<EnumName>;
