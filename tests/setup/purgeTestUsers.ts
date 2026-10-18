import { purgeTestUsers } from "@tests/integration/cleanup";
import {
  takeRegisteredUsers,
  takeTrackedUsers,
} from "@tests/integration/testUserRegistry";

afterEach(() => {
  purgeTestUsers(takeTrackedUsers());
});

afterAll(() => {
  purgeTestUsers(takeRegisteredUsers());
});
