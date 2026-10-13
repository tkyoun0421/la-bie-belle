import { jest } from "@jest/globals";
import { Linking } from "react-native";
import { openPhone } from "@/shared/lib/openPhone.lib";

const openURL = jest.fn(async (_url: string) => true);

beforeEach(() => {
  openURL.mockClear();
  Object.assign(Linking, { openURL });
});

describe("openPhone — 전화 앱을 연다", () => {
  it("번호 앞에 tel: 을 붙여 연다", () => {
    openPhone("010-0000-0001");

    expect(openURL).toHaveBeenCalledWith("tel:010-0000-0001");
  });
});
