import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { View, type ViewProps } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { cn } from "@/shared/lib/utils";

/**
 * 집어서 다른 곳에 놓는 손짓이다. 근무표 날 상세가 저장소에서 처음 쓴다 — 자리 카드는 버리는
 * 영역으로, 줄 머리는 다른 줄 머리로 간다.
 *
 * **여기 사는 것은 손짓과 좌표뿐이다.** 놓아도 되는지는 부르는 쪽이 `canDrop`으로 답한다 —
 * 그 판정은 업무 규칙이라 `screens/scheduleAdmin/model/`의 순수 함수들이 갖는다(ADR-001).
 * 이 파일은 「지금 손가락 아래 무엇이 있나」까지만 안다.
 *
 * **자리는 집는 순간 다시 잰다.** 목록이 스크롤되면 처음 잰 좌표가 어긋나므로 `onLayout`에
 * 기대지 않고 `measureInWindow`를 집을 때마다 부른다.
 *
 * **따라가는 동안에는 duration이 없다.** `docs/2-design/design-system/foundation/motion.md`에
 * 직접 조작 조항이 없어 집는 순간과 놓는 순간에만 값을 건다.
 */

const LIFT_DELAY_MS = 300;

/** 집을 때 커지는 전환이다 — `--duration-fast`(tokens.md). */
const LIFT_DURATION_MS = 125;

const LIFT_SCALE = 1.03;

type Rect = { x: number; y: number; width: number; height: number };

export type DropState = "idle" | "over" | "over-blocked";

type DragContextValue = {
  draggingId: string | null;
  overId: string | null;
  blocked: boolean;
  registerTarget: (id: string, view: View | null) => void;
  begin: (id: string) => void;
  move: (x: number, y: number) => void;
  finish: () => void;
};

const DragContext = createContext<DragContextValue | null>(null);

function contains(rect: Rect, x: number, y: number): boolean {
  return (
    x >= rect.x &&
    x <= rect.x + rect.width &&
    y >= rect.y &&
    y <= rect.y + rect.height
  );
}

export type DragProviderProps = {
  onDrop: (dragId: string, dropId: string) => void;
  canDrop?: (dragId: string, dropId: string) => boolean;
  children: ReactNode;
};

export function DragProvider({ onDrop, canDrop, children }: DragProviderProps) {
  const views = useRef(new Map<string, View>()).current;
  const rects = useRef(new Map<string, Rect>()).current;
  const dragging = useRef<string | null>(null);
  const over = useRef<string | null>(null);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);

  const registerTarget = useCallback(
    (id: string, view: View | null) => {
      if (view === null) {
        views.delete(id);
        rects.delete(id);
        return;
      }

      views.set(id, view);
    },
    [rects, views],
  );

  const begin = useCallback(
    (id: string) => {
      rects.clear();
      dragging.current = id;
      setDraggingId(id);

      for (const [targetId, view] of views) {
        view.measureInWindow((x, y, width, height) => {
          rects.set(targetId, { x, y, width, height });
        });
      }
    },
    [rects, views],
  );

  const move = useCallback(
    (x: number, y: number) => {
      const dragId = dragging.current;

      if (dragId === null) {
        return;
      }

      let found: string | null = null;

      for (const [targetId, rect] of rects) {
        if (targetId !== dragId && contains(rect, x, y)) {
          found = targetId;
        }
      }

      over.current = found;
      setOverId(found);
      setBlocked(
        found !== null && canDrop !== undefined && !canDrop(dragId, found),
      );
    },
    [canDrop, rects],
  );

  const finish = useCallback(() => {
    const dragId = dragging.current;
    const dropId = over.current;
    const allowed =
      dragId !== null &&
      dropId !== null &&
      (canDrop === undefined || canDrop(dragId, dropId));

    dragging.current = null;
    over.current = null;
    setDraggingId(null);
    setOverId(null);
    setBlocked(false);

    if (allowed) {
      onDrop(dragId, dropId);
    }
  }, [canDrop, onDrop]);

  const value = useMemo(
    () => ({
      draggingId,
      overId,
      blocked,
      registerTarget,
      begin,
      move,
      finish,
    }),
    [draggingId, overId, blocked, registerTarget, begin, move, finish],
  );

  return <DragContext.Provider value={value}>{children}</DragContext.Provider>;
}

function useDrag(): DragContextValue {
  const value = useContext(DragContext);

  if (value === null) {
    throw new Error("DragProvider 안에서만 쓴다");
  }

  return value;
}

/** 집힌 것이 있으면 참이다 — 버리는 영역이 그때만 올라온다. */
export function useDragging(): boolean {
  return useDrag().draggingId !== null;
}

export function useDropState(id: string): DropState {
  const { overId, blocked } = useDrag();

  if (overId !== id) {
    return "idle";
  }

  return blocked ? "over-blocked" : "over";
}

export type DraggableProps = {
  id: string;
  disabled?: boolean;
  children: ReactNode;
};

/**
 * 길게 눌러야 집힌다. 끌기와 세로 스크롤이 같은 손짓이라 그 전까지는 목록이 움직여야 한다.
 */
export function Draggable({ id, disabled = false, children }: DraggableProps) {
  const { draggingId, begin, move, finish } = useDrag();
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const scale = useSharedValue(1);

  const lifted = draggingId === id;

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!disabled)
        .activateAfterLongPress(LIFT_DELAY_MS)
        .onStart(() => {
          scale.value = withTiming(LIFT_SCALE, {
            duration: LIFT_DURATION_MS,
          });
          runOnJS(begin)(id);
        })
        .onUpdate((event) => {
          offsetX.value = event.translationX;
          offsetY.value = event.translationY;
          runOnJS(move)(event.absoluteX, event.absoluteY);
        })
        .onFinalize(() => {
          offsetX.value = 0;
          offsetY.value = 0;
          scale.value = withTiming(1, { duration: LIFT_DURATION_MS });
          runOnJS(finish)();
        }),
    [begin, disabled, finish, id, move, offsetX, offsetY, scale],
  );

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: offsetX.value },
      { translateY: offsetY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <View>
      {lifted ? (
        <View className="absolute inset-0 rounded-lg border border-dashed border-stroke-neutral-muted" />
      ) : null}
      <GestureDetector gesture={pan}>
        <Animated.View
          style={style}
          className={cn(
            lifted && "z-10 rounded-lg border border-stroke-neutral-muted",
          )}
        >
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

export type DropTargetProps = ViewProps & {
  id: string;
  children: ReactNode;
};

/**
 * 받을 수 있을 때만 테두리가 선다. 받을 수 없으면 아무 일도 안 일어난다 — 색으로 거절을
 * 말하지 않는다(`schedule-admin.md`의 「잠금과 구조 변경」).
 */
export function DropTarget({
  id,
  className,
  children,
  ...rest
}: DropTargetProps) {
  const { registerTarget } = useDrag();
  const state = useDropState(id);

  const attach = useCallback(
    (view: View | null) => registerTarget(id, view),
    [id, registerTarget],
  );

  return (
    <View
      ref={attach}
      className={cn(
        state === "over" && "rounded-lg border border-stroke-brand-solid",
        className,
      )}
      {...rest}
    >
      {children}
    </View>
  );
}
