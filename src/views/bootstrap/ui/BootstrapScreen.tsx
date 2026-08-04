export function BootstrapScreen({ serverBoundaryReady }: { serverBoundaryReady: boolean }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col justify-center gap-3 p-6">
      <p className="text-sm text-gray-600">라비에벨</p>
      <h1 className="text-2xl font-bold">프로젝트 기반이 준비됐습니다</h1>
      <p className="text-base text-gray-700">
        Next.js App Router, TypeScript, Tailwind CSS가 동작합니다. 화면과 디자인 토큰은 다음
        task에서 붙입니다.
      </p>
      <p className="text-sm text-gray-600">
        서버 경계: {serverBoundaryReady ? "정상" : "확인 필요"}
      </p>
    </main>
  );
}
