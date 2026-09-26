import { Redirect } from "expo-router";
import {
  Bell,
  CalendarDays,
  Home,
  User,
  Wallet,
  type LucideIcon,
} from "lucide-react-native";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { isCatalogVisible } from "@/shared/lib/catalog-visibility";
import type { ShiftWindow } from "@/shared/lib/day-band";
import { AdminSwitch } from "@/shared/ui/AdminSwitch";
import { AppBar } from "@/shared/ui/AppBar";
import { Avatar } from "@/shared/ui/Avatar";
import { Badge } from "@/shared/ui/Badge";
import { BellIcon } from "@/shared/ui/BellIcon";
import { BottomCTA } from "@/shared/ui/BottomCTA";
import { BottomSheet } from "@/shared/ui/BottomSheet";
import { Button } from "@/shared/ui/Button";
import { Card, CardHeader } from "@/shared/ui/Card";
import { CelebrationCircle } from "@/shared/ui/CelebrationCircle";
import { DayBand } from "@/shared/ui/DayBand";
import { Dialog } from "@/shared/ui/Dialog";
import { Divider } from "@/shared/ui/Divider";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Icon } from "@/shared/ui/Icon";
import { Illustration, Tossface } from "@/shared/ui/Illustration";
import { Input } from "@/shared/ui/Input";
import { ListRow } from "@/shared/ui/ListRow";
import { MiniCalendar } from "@/shared/ui/MiniCalendar";
import { MorePopover, MorePopoverItem } from "@/shared/ui/MorePopover";
import { NoticeBlock } from "@/shared/ui/NoticeBlock";
import { RatioBand } from "@/shared/ui/RatioBand";
import { RowBars } from "@/shared/ui/RowBars";
import { ScheduleDayCell } from "@/shared/ui/ScheduleDayCell";
import { Screen } from "@/shared/ui/Screen";
import { Segment } from "@/shared/ui/Segment";
import { Skeleton, SkeletonLine } from "@/shared/ui/Skeleton";
import { Switch } from "@/shared/ui/Switch";
import { TabBar } from "@/shared/ui/TabBar";
import { Tabs } from "@/shared/ui/Tabs";
import { Text } from "@/shared/ui/Text";
import { Toast } from "@/shared/ui/Toast";
import { TrendChart } from "@/shared/ui/TrendChart";

/**
 * 조각을 한 줄로 늘어놓고 눈으로 보는 자리다. 절 제목과 순서는
 * `docs/2-design/design-system/components.md`를 그대로 따른다 — 새 조각이 그 문서에 서면
 * 여기도 같은 자리에 선다. Map은 네이티브 모듈이라 빠져 있다(ui-kit spec 「범위」).
 *
 * **개발 빌드에만 선다.** Expo Router는 파일이 있으면 경로를 만들어서 프로덕션 번들에서
 * 라우트를 뺄 길이 없다 — 그래서 화면이 판정을 받아 `Redirect`를 그린다. 판정이
 * `src/shared/lib/catalog-visibility.ts`에 사는 것은 `__DEV__` 전역이 대역을 안 받아
 * 여기서는 확인할 수 없기 때문이다.
 *
 * 라이트와 다크는 기기 설정을 그대로 따른다 — `globals.css`가 이미 두 벌을 낸다.
 */

const SHIFT: ShiftWindow = {
  start: new Date("2026-09-12T10:00:00+09:00"),
  end: new Date("2026-09-12T19:00:00+09:00"),
};

const NOW = new Date("2026-09-12T15:34:00+09:00");

const CHECKED_IN_AT = new Date("2026-09-12T10:54:00+09:00");

const TAB_ITEMS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "home", label: "홈", icon: Home },
  { key: "schedule", label: "근무표", icon: CalendarDays },
  { key: "payroll", label: "급여", icon: Wallet },
  { key: "me", label: "나", icon: User },
];

const TREND_POINTS = [
  { month: 1, value: 92 },
  { month: 2, value: 104 },
  { month: 3, value: null },
  { month: 4, value: 118 },
  { month: 5, value: 126 },
  { month: 6, value: 112 },
  { month: 7, value: 140 },
  { month: 8, value: 133 },
  { month: 9, value: 151 },
  { month: 10, value: 148 },
  { month: 11, value: 160 },
  { month: 12, value: 155 },
];

const ROW_BAR_ITEMS = [
  { key: "hall", value: 42, row: <Text className="text-sm">홀 42시간</Text> },
  {
    key: "kitchen",
    value: 27,
    row: <Text className="text-sm">주방 27시간</Text>,
  },
  {
    key: "parking",
    value: 9,
    row: <Text className="text-sm">주차 9시간</Text>,
  },
];

const RATIO_SHARES = [
  { key: "on-time", label: "출근", value: 21 },
  { key: "late", label: "지각", value: 3 },
  { key: "absent", label: "결근", value: 1 },
];

const MINI_CALENDAR_DAYS = {
  3: { marked: true },
  4: { marked: true },
  10: { marked: true },
  17: { marked: true },
  18: { marked: true },
  24: { marked: true },
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-3 px-5 py-6">
      <Text className="font-semibold text-xl text-fg-neutral">{title}</Text>
      <View className="gap-3">{children}</View>
    </View>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-2">
      <Text className="text-xs text-fg-neutral-subtle">{label}</Text>
      <View className="flex-row flex-wrap items-center gap-2">{children}</View>
    </View>
  );
}

function Stack({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-2">
      <Text className="text-xs text-fg-neutral-subtle">{label}</Text>
      {children}
    </View>
  );
}

export default function Catalog() {
  const [switchOn, setSwitchOn] = useState(true);
  const [tab, setTab] = useState("all");
  const [segment, setSegment] = useState("month");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  if (!isCatalogVisible(__DEV__)) {
    return <Redirect href="/" />;
  }

  return (
    <ScrollView className="flex-1 bg-bg-neutral-sunken">
      <Section title="글자">
        <Stack label="크기 여덟 — 화면은 `text-*`가 아니라 size로 말한다">
          <Text size="xs">xs · 부가 텍스트</Text>
          <Text size="sm">sm · 본문 아래 줄</Text>
          <Text size="base">base · 본문</Text>
          <Text size="lg">lg · 굳은 값</Text>
          <Text size="xl">xl · 화면 제목</Text>
          <Text size="2xl">2xl · 서비스 이름</Text>
          <Text size="3xl">3xl</Text>
          <Text size="4xl">4xl</Text>
        </Stack>
        <Stack label="색 여덟">
          <Text tone="neutral">neutral · 본문</Text>
          <Text tone="muted">muted · 아래 줄</Text>
          <Text tone="subtle">subtle · 안내</Text>
          <Text tone="disabled">disabled · 안 눌리는 것</Text>
          <Text tone="brand">brand · 배지 글자</Text>
          <Text tone="positive">positive · 승인됨</Text>
          <Text tone="critical">critical · 인도 줄</Text>
        </Stack>
        <Stack label="굵기 넷">
          <Text weight="regular">regular</Text>
          <Text weight="medium">medium</Text>
          <Text weight="semibold">semibold</Text>
          <Text weight="bold">bold</Text>
        </Stack>
        <Stack label="숫자 정렬 — 켜면 자릿수 폭이 고정된다">
          <Text size="lg">010-0000-0001</Text>
          <Text size="lg" numeric>
            010-0000-0001
          </Text>
        </Stack>
      </Section>

      <Section title="아이콘">
        <Row label="본문 옆 · 부가 텍스트 옆 · 앱바">
          <Icon icon={Bell} size={17} />
          <Icon icon={Bell} size={13} className="text-fg-neutral-subtle" />
          <Icon icon={Bell} size={28} />
        </Row>
      </Section>

      <Section title="Button">
        <Row label="변형 다섯">
          <Button variant="primary">확정하기</Button>
          <Button variant="secondary">보내기</Button>
          <Button variant="outline">고르기</Button>
          <Button variant="ghost">더 보기</Button>
          <Button variant="destructive">탈퇴</Button>
        </Row>
        <Row label="높이 셋">
          <Button size="sm">36</Button>
          <Button size="md">40</Button>
          <Button size="lg">48</Button>
        </Row>
        <Row label="작은 버튼 · 비활성 · 스피너">
          <Button size="compact" variant="secondary">
            지금 신청
          </Button>
          <Button disabled>비활성</Button>
          <Button loading>보내는 중</Button>
        </Row>
        <Row label="정사각 아이콘 버튼">
          <Button square variant="secondary" size="md">
            <Icon icon={Bell} size={20} />
          </Button>
        </Row>
      </Section>

      <Section title="BottomCTA">
        <BottomCTA
          scrollable
          note={<Text className="text-sm">홀에서 누르면 위치로 확인해요</Text>}
        >
          <Button variant="primary">출근 인증하기</Button>
        </BottomCTA>
      </Section>

      <Section title="앱바">
        <Stack label="제목형">
          <AppBar title="근무 신청" onBack={() => {}} />
        </Stack>
        <Stack label="허브형 — 제목이 작고 오른쪽에 종과 스위치">
          <AppBar
            kind="hub"
            title="9월 12일 토요일"
            right={
              <View className="flex-row items-center gap-2">
                <BellIcon unread />
                <AdminSwitch destination="admin" />
              </View>
            }
          />
        </Stack>
      </Section>

      <Section title="관리자 스위치">
        <Row label="관리자로 · 근무자로">
          <AdminSwitch destination="admin" />
          <AdminSwitch destination="worker" />
        </Row>
      </Section>

      <Section title="종 아이콘">
        <Row label="안 읽음 있음 · 없음">
          <BellIcon unread />
          <BellIcon />
        </Row>
      </Section>

      <Section title="탭 바">
        <TabBar items={TAB_ITEMS} current="home" />
      </Section>

      <Section title="ListRow">
        <Card>
          <ListRow
            title="9월 12일 토요일"
            detail="홀 · 10:00–19:00"
            value="9시간"
          />
          <ListRow
            title="근무 시간 기본값"
            value="10:00–19:00"
            chevron
            divider
          />
          <ListRow
            title="새 근무표가 확정됐어요"
            detail="방금"
            unread
            divider
          />
          <ListRow title="알림" detail="켜짐" chevron divider />
        </Card>
      </Section>

      <Section title="하나 고르는 목록">
        <Card>
          <ListRow title="갑자기 일이 생겼어요" selected />
          <ListRow title="몸이 아파요" divider />
          <ListRow title="다른 일정이 겹쳤어요" divider />
        </Card>
      </Section>

      <Section title="Card">
        <Card>
          <CardHeader
            title="이번 주 근무"
            leading={<Tossface codepoint="1F4C5" />}
          />
          <Text className="text-sm text-fg-neutral-muted">세 번, 24시간</Text>
        </Card>
      </Section>

      <Section title="Skeleton">
        <Stack label="카드 덩이 — shimmer">
          <Skeleton testID="catalog-skeleton" className="h-24" />
        </Stack>
        <Stack label="동작 줄이기 — 덩이만">
          <Skeleton
            reduceMotion
            testID="catalog-skeleton-still"
            className="h-24"
          />
        </Stack>
        <Stack label="글 막대 — 제목 60% · 본문 90%">
          <SkeletonLine className="w-3/5" />
          <SkeletonLine className="w-[90%]" />
        </Stack>
      </Section>

      <Section title="Avatar">
        <Row label="24 · 40 · 64, 사진 없으면 첫 글자">
          <Avatar name="김민수" size={24} />
          <Avatar name="이도윤" size={40} />
          <Avatar name="박서연" size={64} />
        </Row>
        <Stack label="축하하는 순간의 큰 원 — 둘레에 조각 여덟">
          <CelebrationCircle name="박서연" className="self-center" />
        </Stack>
      </Section>

      <Section title="화면 바닥과 가는 선">
        <Row label="바닥 둘 — 카드가 서는 sunken(기본) · 한 장면 화면의 plain">
          <View className="h-16 w-24 overflow-hidden rounded-md border border-stroke-neutral">
            <Screen />
          </View>
          <View className="h-16 w-24 overflow-hidden rounded-md border border-stroke-neutral">
            <Screen floor="plain" />
          </View>
        </Row>
        <Stack label="가는 선 — 위아래 여백은 부르는 쪽이 준다">
          <Divider className="my-5" />
        </Stack>
      </Section>

      <Section title="Illustration">
        <Row label="3D 큰 자리 · 작은 자리 — 파일이 없으면 빈 자리">
          <Illustration scene="all-clear" size="small" />
        </Row>
        <Row label="토스페이스 — 한 가지 크기">
          <Tossface codepoint="1F4C5" />
          <Tossface codepoint="1F4B0" />
          <Tossface codepoint="23F0" />
          <Tossface codepoint="1F514" />
        </Row>
      </Section>

      <Section title="Badge">
        <Row label="변형 여섯">
          <Badge variant="neutral" label="마감" />
          <Badge variant="brand" label="내 근무" />
          <Badge variant="positive" label="승인됨" />
          <Badge variant="critical" label="거절됨" />
          <Badge variant="sky" label="교육" />
          <Badge variant="warning" label="지각" />
        </Row>
        <Row label="크기 둘 — 값 옆의 sm · 홀로 서는 md">
          <Badge variant="brand" label="내 근무" />
          <Badge variant="brand" size="md" label="승인 기다리는 중" />
        </Row>
        <Row label="점 — 상태가 곧 갈릴 자리에만">
          <Badge variant="brand" size="md" dot label="승인 기다리는 중" />
          <Badge variant="neutral" size="md" label="아직 연결 전" />
        </Row>
      </Section>

      <Section title="Input">
        <Stack label="기본 · 오류">
          <Input label="이름" placeholder="이름을 적어주세요" />
          <Input
            label="전화번호"
            value="010-0000-000"
            error="열한 자리를 다 적어주세요"
          />
        </Stack>
      </Section>

      <Section title="스위치">
        <Row label="켬 · 끔">
          <Switch value={switchOn} onValueChange={setSwitchOn} />
          <Switch value={false} onValueChange={() => {}} />
        </Row>
      </Section>

      <Section title="Tabs">
        <Tabs
          items={[
            { value: "all", label: "전체" },
            { value: "mine", label: "내 근무" },
            { value: "done", label: "지난 근무" },
          ]}
          value={tab}
          onChange={setTab}
        />
      </Section>

      <Section title="세그먼트">
        <Segment
          options={[
            { value: "month", label: "달" },
            { value: "week", label: "주" },
          ]}
          value={segment}
          onChange={setSegment}
        />
      </Section>

      <Section title="알림 블록">
        <NoticeBlock kind="info">신청은 8일까지 받아요</NoticeBlock>
        <NoticeBlock kind="success">근무표가 확정됐어요</NoticeBlock>
        <NoticeBlock kind="warning">아직 알림을 안 켰어요</NoticeBlock>
        <NoticeBlock kind="error">근무표를 못 읽었어요</NoticeBlock>
      </Section>

      <Section title="토스트">
        <Toast kind="success">저장했어요</Toast>
        <Toast kind="info">신청을 보냈어요</Toast>
        <Stack label="동작 줄이기 — 이동 없이 자리에서">
          <Toast kind="success" distance={0}>
            저장했어요
          </Toast>
        </Stack>
      </Section>

      <Section title="Dialog와 바텀시트">
        <Row label="가운데 Dialog">
          <Button variant="secondary" onPress={() => setDialogOpen(true)}>
            Dialog 열기
          </Button>
        </Row>
        <Dialog
          visible={dialogOpen}
          title="근무 취소를 승인할까요?"
          confirmLabel="승인"
          onConfirm={() => setDialogOpen(false)}
          onClose={() => setDialogOpen(false)}
        >
          <Text className="text-sm text-fg-neutral-muted">
            승인하면 그 자리가 다시 열려요
          </Text>
        </Dialog>
        <Stack label="바텀시트 면 — 위쪽 두 모서리만 둥글다">
          <BottomSheet distance={0}>
            <Text className="font-semibold text-lg text-fg-neutral">
              사유 보내기
            </Text>
          </BottomSheet>
        </Stack>
      </Section>

      <Section title="더보기 팝오버">
        <View className="relative items-end">
          <Button
            square
            size="md"
            variant="ghost"
            onPress={() => setPopoverOpen(!popoverOpen)}
          >
            <Icon icon={Bell} size={20} />
          </Button>
          <MorePopover open={popoverOpen}>
            <MorePopoverItem
              label="퇴사 처리"
              onPress={() => setPopoverOpen(false)}
            />
            <MorePopoverItem
              label="차단"
              irreversible
              onPress={() => setPopoverOpen(false)}
            />
          </MorePopover>
        </View>
      </Section>

      <Section title="근무표 날짜 칸">
        <Row label="근무자 조회 여섯">
          <ScheduleDayCell day={3} state="assigned" />
          <ScheduleDayCell day={4} state="requested" />
          <ScheduleDayCell day={5} state="open" />
          <ScheduleDayCell day={6} state="closed" />
          <ScheduleDayCell day={7} state="unconfirmed" />
          <ScheduleDayCell day={8} state="picked" />
        </Row>
        <Row label="오늘이 얹힌다 · 이 달 밖 칸은 빈칸">
          <ScheduleDayCell day={12} state="assigned" isToday />
          <ScheduleDayCell day={12} state="open" isToday />
          <ScheduleDayCell day={null} state="closed" />
        </Row>
        <Row label="관리자 편집 셋">
          <ScheduleDayCell day={9} state="closed" />
          <ScheduleDayCell day={10} state="admin-open" applicationCount={3} />
          <ScheduleDayCell day={11} state="admin-picked" />
        </Row>
      </Section>

      <Section title="하루 띠">
        <Stack label="근무 중 — 인증 눈금이 찍힌 자리">
          <Card>
            <DayBand
              shift={SHIFT}
              now={NOW}
              checkInAt={CHECKED_IN_AT}
              progressLabel="62% 지났어요"
              remainingLabel="3시간 25분 남았어요"
              startLabel="10:00"
              endLabel="19:00"
            />
          </Card>
        </Stack>
        <Stack label="확정 전 — 점선 트랙만, 네 귀퉁이가 없다">
          <Card>
            <DayBand shift={SHIFT} now={NOW} isConfirmed={false} />
          </Card>
        </Stack>
      </Section>

      <Section title="추이 그래프">
        <Card>
          <TrendChart
            points={TREND_POINTS}
            selectedMonth={9}
            valueLabel="151시간"
          />
        </Card>
      </Section>

      <Section title="줄 막대">
        <Card>
          <RowBars items={ROW_BAR_ITEMS} />
        </Card>
      </Section>

      <Section title="비율 띠">
        <Card>
          <RatioBand shares={RATIO_SHARES} />
        </Card>
      </Section>

      <Section title="미니 달력">
        <Card>
          <MiniCalendar
            year={2026}
            month={9}
            today={NOW}
            days={MINI_CALENDAR_DAYS}
          />
        </Card>
        <Stack label="여섯 줄이 필요한 달">
          <Card>
            <MiniCalendar year={2026} month={3} />
          </Card>
        </Stack>
      </Section>

      <Section title="빈 상태">
        <Card>
          <EmptyState
            scene="no-members"
            title="아직 직원이 없어요"
            description="가입을 승인하면 여기 서요"
          />
        </Card>
        <Stack label="한 문장으로 끝나면 제목이 없다">
          <Card>
            <EmptyState
              scene="no-applications"
              description="기다리는 사람이 없어요"
            />
          </Card>
        </Stack>
      </Section>
    </ScrollView>
  );
}
