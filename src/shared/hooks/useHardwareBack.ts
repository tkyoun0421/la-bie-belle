import { useEffect } from "react";
import { BackHandler } from "react-native";

/**
 * 안드로이드 기기 뒤로를 가로챈다. 시트가 열려 있을 때 뒤로를 누르면 화면이 통째로 빠지는
 * 것이 아니라 위에 뜬 것만 닫혀야 한다.
 *
 * **`null`을 주면 안 건다.** 닫을 것이 무엇인지는 controller가 알고 이 자리는 그 손을
 * 기기에 잇기만 한다. 손을 걸어둔 채 `false`를 돌려주는 길도 있지만, 그러면 「안 가로챘다」와
 * 「가로채서 닫았다」가 한 손에 섞인다.
 *
 * `BackHandler`를 인자로 받는 까닭은
 * [`wireAutoRefresh`](../../features/auth/lib/wireAutoRefresh.lib.ts)와 같다 — 러너가
 * `react-native`를 절대경로로 리매핑해서 이 파일 안의 import는 늘 실물을 문다. 기본값에
 * 실물을 두면 부르는 쪽은 그대로다.
 */

export type BackPressSource = {
  addEventListener: (
    event: "hardwareBackPress",
    listener: () => boolean,
  ) => { remove: () => void };
};

export function useHardwareBack(
  onBack: (() => boolean) | null,
  source: BackPressSource = BackHandler,
): void {
  useEffect(() => {
    if (onBack === null) {
      return;
    }

    const subscription = source.addEventListener("hardwareBackPress", onBack);

    return () => subscription.remove();
  }, [onBack, source]);
}
