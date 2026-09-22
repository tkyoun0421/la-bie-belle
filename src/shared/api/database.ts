import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/api/database-types";

export type { Database };

/**
 * `dals`가 받는 클라이언트. 생성 타입을 물려서 표·뷰·함수 이름과 열 타입이 검사를 받는다.
 *
 * 생성 타입을 안 물린 `SupabaseClient`는 스키마가 `any`라 `from("없는표")`도 통과한다.
 * 그래서 클라이언트를 받는 자리는 전부 이 이름을 쓴다 — 정본은
 * [`data-access.md` 「생성 타입」](../../../docs/2-design/system/data-access.md#생성-타입)이다.
 */
export type Db = SupabaseClient<Database>;
