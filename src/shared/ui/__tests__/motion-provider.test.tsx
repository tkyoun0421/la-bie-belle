import { cleanup, render, screen } from "@testing-library/react";
import { m, motion } from "motion/react";
import { afterEach, describe, expect, it } from "vitest";

import { MotionProvider, useMotionTokens } from "@/shared/ui/motion-provider";

afterEach(cleanup);

describe("MotionProvider", () => {
  it("프로바이더 아래에서 m.* 컴포넌트가 정상 렌더된다", () => {
    render(
      <MotionProvider>
        <m.div data-testid="target">movable</m.div>
      </MotionProvider>,
    );

    expect(screen.getByTestId("target")).toHaveTextContent("movable");
  });

  it("프로바이더 아래에서 motion.* 컴포넌트를 쓰면 오류를 던진다", () => {
    function BadConsumer() {
      return <motion.div>bad</motion.div>;
    }

    expect(() =>
      render(
        <MotionProvider>
          <BadConsumer />
        </MotionProvider>,
      ),
    ).toThrow(/motion/i);
  });

  it("프로바이더 밖에서 useMotionTokens을 호출하면 명확하게 실패한다", () => {
    function Consumer() {
      useMotionTokens();
      return null;
    }

    expect(() => render(<Consumer />)).toThrow(/MotionProvider/);
  });
});
