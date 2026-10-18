import { RUN_ID_ENV } from "@tests/integration/testUserMark";
import { currentRunId } from "@tests/integration/testUserRegistry";

console.log(`${RUN_ID_ENV}=${currentRunId()}`);
