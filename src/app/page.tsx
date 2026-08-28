import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/shared/lib/create-supabase-server-client";
import { getCurrentUser } from "@/shared/lib/get-current-user";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

export default async function Home() {
  const user = await getCurrentUser(
    createSupabaseServerClient(await cookies()),
  );

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>La Bie Belle</CardTitle>
          <CardDescription>프로젝트 스캐폴드가 준비되었습니다.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-4">
          <p className="text-sm text-muted-foreground">
            {user ? user.email : "로그인하지 않았습니다"}
          </p>
          <Button>시작하기</Button>
        </CardContent>
      </Card>
    </main>
  );
}
