import { DomainError } from "@/shared/api/errors";
import { setHallLocation } from "@/entities/attendance/dals/set-hall-location";
import {
  createAdminUser,
  createApprovedUser,
  execSql,
  type AdminUser,
  type ApprovedUser,
} from "@tests/integration/postgres";

describe("setHallLocation dal — set_hall_location을 부르고 오류를 DomainError로 올린다(AC-07)", () => {
  let admin: AdminUser;
  let worker: ApprovedUser;
  let hallId: string;
  let originalHall: { lat: number; lng: number; radiusM: number };

  beforeAll(async () => {
    admin = await createAdminUser();
    worker = await createApprovedUser();

    const { data, error } = await admin.client
      .from("halls")
      .select("id, lat, lng, radius_m")
      .single<{ id: string; lat: number; lng: number; radius_m: number }>();
    if (error || !data) {
      throw error ?? new Error("홀을 못 찾았다");
    }
    hallId = data.id;
    originalHall = { lat: data.lat, lng: data.lng, radiusM: data.radius_m };
  });

  afterAll(() => {
    execSql(
      "update public.halls set lat = :'lat', lng = :'lng', radius_m = :'radius_m' where id = :'hall_id';\n",
      {
        lat: String(originalHall.lat),
        lng: String(originalHall.lng),
        radius_m: String(originalHall.radiusM),
        hall_id: hallId,
      },
    );
  });

  it("성공하면 halls의 좌표·반경이 실제로 바뀐다", async () => {
    await setHallLocation(admin.client, {
      lat: 37.42,
      lng: 127.11,
      radiusM: 120,
    });

    const { data, error } = await admin.client
      .from("halls")
      .select("lat, lng, radius_m")
      .eq("id", hallId)
      .single<{ lat: number; lng: number; radius_m: number }>();

    expect(error).toBeNull();
    expect(data?.lat).toBeCloseTo(37.42, 5);
    expect(data?.lng).toBeCloseTo(127.11, 5);
    expect(data?.radius_m).toBe(120);
  });

  it("반경이 0 이하면 DomainError('bad_radius')를 던진다", async () => {
    let caught: unknown;
    try {
      await setHallLocation(admin.client, {
        lat: 37.42,
        lng: 127.11,
        radiusM: 0,
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DomainError);
    expect((caught as DomainError).code).toBe("bad_radius");
  });

  it("관리자가 아니면 DomainError('not_allowed')를 던진다", async () => {
    let caught: unknown;
    try {
      await setHallLocation(worker.client, {
        lat: 37.42,
        lng: 127.11,
        radiusM: 120,
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DomainError);
    expect((caught as DomainError).code).toBe("not_allowed");
  });
});
