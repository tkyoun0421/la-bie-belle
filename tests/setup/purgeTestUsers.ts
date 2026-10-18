import { purgeTestUsers } from "@tests/integration/cleanup";
import {
  takeRegistered,
  takeTracked,
} from "@tests/integration/testUserRegistry";

afterEach(() => {
  purgeTestUsers(takeTracked());
});

afterAll(() => {
  purgeTestUsers(takeRegistered());
});
