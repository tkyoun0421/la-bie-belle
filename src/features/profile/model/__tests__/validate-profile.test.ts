import { validateProfileForm } from "../validate-profile";

describe("validateProfileForm — 프로필 다섯 칸 중 값의 꼴이 있는 넷을 본다", () => {
  describe("이름은 공백만으로 안 된다 (ACC-002)", () => {
    it("공백만 있는 이름은 거부한다", () => {
      const errors = validateProfileForm({
        name: "   ",
        phone: "01000000001",
        birthDate: "19930421",
        gender: "female",
      });

      expect(typeof errors.name).toBe("string");
    });

    it("글자가 있는 이름은 통과한다", () => {
      const errors = validateProfileForm({
        name: "홍길동",
        phone: "01000000001",
        birthDate: "19930421",
        gender: "female",
      });

      expect(errors.name).toBeUndefined();
    });
  });

  describe("연락처는 010으로 시작하는 열한 자리다 (ACC-004)", () => {
    it("010으로 시작하는 열한 자리는 통과한다", () => {
      const errors = validateProfileForm({
        name: "홍길동",
        phone: "01000000001",
        birthDate: "19930421",
        gender: "female",
      });

      expect(errors.phone).toBeUndefined();
    });

    it("열 자리(한 자리 부족)는 거부한다", () => {
      const errors = validateProfileForm({
        name: "홍길동",
        phone: "0100000000",
        birthDate: "19930421",
        gender: "female",
      });

      expect(typeof errors.phone).toBe("string");
    });

    it("자릿수는 같아도 010으로 시작하지 않으면 거부한다", () => {
      const errors = validateProfileForm({
        name: "홍길동",
        phone: "01100000001",
        birthDate: "19930421",
        gender: "female",
      });

      expect(typeof errors.phone).toBe("string");
    });
  });

  describe("생년월일은 실존하는 여덟 자리다 (ACC-002)", () => {
    it("실존하는 날짜는 통과한다", () => {
      const errors = validateProfileForm({
        name: "홍길동",
        phone: "01000000001",
        birthDate: "19930421",
        gender: "female",
      });

      expect(errors.birthDate).toBeUndefined();
    });

    it("2026년 2월 29일처럼 실존하지 않는 날짜는 거부한다", () => {
      const errors = validateProfileForm({
        name: "홍길동",
        phone: "01000000001",
        birthDate: "20260229",
        gender: "female",
      });

      expect(typeof errors.birthDate).toBe("string");
    });

    it("13월처럼 실존하지 않는 달은 거부한다", () => {
      const errors = validateProfileForm({
        name: "홍길동",
        phone: "01000000001",
        birthDate: "19931301",
        gender: "female",
      });

      expect(typeof errors.birthDate).toBe("string");
    });
  });

  describe("성별은 여·남 둘뿐이다 (ACC-002)", () => {
    it("female은 통과한다", () => {
      const errors = validateProfileForm({
        name: "홍길동",
        phone: "01000000001",
        birthDate: "19930421",
        gender: "female",
      });

      expect(errors.gender).toBeUndefined();
    });

    it("male은 통과한다", () => {
      const errors = validateProfileForm({
        name: "홍길동",
        phone: "01000000001",
        birthDate: "19930421",
        gender: "male",
      });

      expect(errors.gender).toBeUndefined();
    });

    it("여·남 밖의 값은 거부한다", () => {
      const errors = validateProfileForm({
        name: "홍길동",
        phone: "01000000001",
        birthDate: "19930421",
        gender: "other" as unknown as "female" | "male",
      });

      expect(typeof errors.gender).toBe("string");
    });

    it("아직 안 고른 성별은 거부한다", () => {
      const errors = validateProfileForm({
        name: "홍길동",
        phone: "01000000001",
        birthDate: "19930421",
        gender: null,
      });

      expect(typeof errors.gender).toBe("string");
    });
  });
});
