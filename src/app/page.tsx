import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>La Bie Belle</CardTitle>
          <CardDescription>프로젝트 스캐폴드가 준비되었습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button>시작하기</Button>
        </CardContent>
      </Card>
    </main>
  );
}
