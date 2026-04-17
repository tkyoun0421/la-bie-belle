"use client";

import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { Loader2, Users, Calendar, Clock } from "lucide-react";
import { useReplacementsQuery } from "#/queries/replacements/hooks/useReplacementsQuery";
import { useReplacementApplicationsQuery } from "#/queries/replacements/hooks/useReplacementApplicationsQuery";
import { useApplyToReplacementMutation } from "#/mutations/replacements/hooks/useApplyToReplacementMutation";
import { useApproveReplacementMutation } from "#/mutations/replacements/hooks/useApproveReplacementMutation";
import { Badge } from "#/shared/components/ui/badge";
import { Button } from "#/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/shared/components/ui/card";
import { ConfirmDialog } from "#/shared/components/common/ConfirmDialog";
import { useState } from "react";
import type { ReplacementListItem } from "#/entities/replacements/models/schemas/replacementRequest";

export function ReplacementsScreen() {
  const actor = { userId: "mock-user-id", role: "admin" };
  const replacementsQuery = useReplacementsQuery();
  const replacements = replacementsQuery.data ?? [];
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const isAdminOrManager = actor?.role === "admin" || actor?.role === "manager";

  if (replacementsQuery.isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1180px] flex-col gap-6 px-4 py-8 md:px-8">
      <section className="overflow-hidden rounded-[32px] border border-[var(--border-soft)] bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_52%,#d97706_100%)] px-6 py-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] md:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-100">
          Replacements
        </p>
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              대타 모집 목록
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-200 md:text-base">
              배정이 취소된 공석에 대해 새로운 지원자를 모집하거나 승인합니다.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-600" />
            진행 중인 대타 요청 ({replacements.length})
          </h2>
          
          {replacements.length === 0 ? (
            <Card className="border-dashed bg-muted/20">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground">현재 열려 있는 대타 요청이 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {replacements.map((replacement) => (
                <ReplacementCard
                  key={replacement.id}
                  replacement={replacement}
                  isSelected={selectedRequestId === replacement.id}
                  onClick={() => setSelectedRequestId(replacement.id)}
                  isManager={isAdminOrManager}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-600" />
            지원자 목록
          </h2>
          
          {selectedRequestId ? (
            <ReplacementCandidatesPanel
              requestId={selectedRequestId}
              isManager={isAdminOrManager}
            />
          ) : (
            <Card className="bg-muted/10 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-muted-foreground">대타 요청을 선택하면<br />지원자 목록이 여기에 표시됩니다.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}

function ReplacementCard({ 
  replacement, 
  isSelected, 
  onClick,
  isManager,
}: { 
  replacement: ReplacementListItem; 
  isSelected: boolean;
  onClick: () => void;
  isManager: boolean;
}) {
  const applyMutation = useApplyToReplacementMutation();
  
  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    applyMutation.mutate({ replacementRequestId: replacement.id });
  };

  const formattedDate = format(parseISO(replacement.eventDate), "M월 d일 (EEE)", { locale: ko });

  return (
    <Card 
      className={`cursor-pointer transition-all hover:border-amber-500/50 ${isSelected ? 'border-amber-500 ring-1 ring-amber-500 shadow-md' : 'border-border/60 bg-background/60'}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <div className="space-y-1">
            <CardTitle className="text-lg">{replacement.eventTitle}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Badge variant="outline" className="font-semibold text-amber-700 border-amber-200 bg-amber-50">
                {replacement.positionName}
              </Badge>
            </CardDescription>
          </div>
          <Badge className={replacement.status === 'open' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}>
            {replacement.status === 'open' ? '모집 중' : replacement.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-y-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{replacement.timeLabel}</span>
          </div>
        </div>
        
        {!isManager && (
          <div className="mt-4 pt-4 border-t">
            <Button 
              className="w-full bg-amber-600 hover:bg-amber-700 text-white" 
              size="sm"
              disabled={applyMutation.isPending}
              onClick={handleApply}
            >
              {applyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              대타 지원하기
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ReplacementCandidate {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  appliedAt: string;
}

function ReplacementCandidatesPanel({ requestId, isManager }: { requestId: string; isManager: boolean }) {
  const candidatesQuery = useReplacementApplicationsQuery(requestId);
  const approveMutation = useApproveReplacementMutation();
  const [candidateToApprove, setCandidateToApprove] = useState<ReplacementCandidate | null>(null);

  const candidates = (candidatesQuery.data ?? []) as ReplacementCandidate[];

  const handleApproveConfirm = () => {
    if (!candidateToApprove) return;
    
    approveMutation.mutate({
      replacementRequestId: requestId,
      userId: candidateToApprove.userId
    }, {
      onSuccess: () => {
        setCandidateToApprove(null);
      }
    });
  };

  if (candidatesQuery.isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {candidates.length === 0 ? (
        <p className="text-center py-8 text-sm text-muted-foreground border rounded-xl bg-muted/5">
          아직 지원자가 없습니다.
        </p>
      ) : (
        candidates.map((candidate) => (
          <Card key={candidate.id} className="border-border/60 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-bold text-foreground truncate">{candidate.userName}</p>
                <p className="text-xs text-muted-foreground truncate">{candidate.userEmail}</p>
                <p className="mt-1 text-[10px] text-muted-foreground uppercase">
                  지원일: {format(parseISO(candidate.appliedAt), "HH:mm")}
                </p>
              </div>
              
              {isManager && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="shrink-0 h-8 text-xs border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                  onClick={() => setCandidateToApprove(candidate)}
                  disabled={approveMutation.isPending}
                >
                  승인
                </Button>
              )}
            </CardContent>
          </Card>
        ))
      )}

      <ConfirmDialog
        open={candidateToApprove !== null}
        onOpenChange={(open) => !open && setCandidateToApprove(null)}
        title="대타 승인"
        description={`"${candidateToApprove?.userName}" 멤버를 대타로 승인하시겠습니까? 승인 즉시 배정됩니다.`}
        confirmLabel="승인하기"
        onConfirm={handleApproveConfirm}
      />
    </div>
  );
}
