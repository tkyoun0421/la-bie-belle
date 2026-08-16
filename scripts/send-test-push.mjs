import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

function fail(message) {
  process.stderr.write(`[send-test-push] ${message}\n`);
  process.exit(1);
}

function readEnv(name) {
  const value = process.env[name];
  if (!value) {
    fail(`${name} 환경변수가 없습니다. .env를 확인하세요.`);
  }
  return value;
}

const supabaseUrl = readEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");
const vapidPublicKey = readEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY");
const vapidPrivateKey = readEnv("VAPID_PRIVATE_KEY");
const vapidSubject = readEnv("VAPID_SUBJECT");

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

const supabase = createClient(supabaseUrl, serviceRoleKey);

const targetProfileId = process.argv[2] ?? null;

let query = supabase
  .from("push_subscriptions")
  .select("id, endpoint, p256dh, auth")
  .is("disabled_at", null);

if (targetProfileId !== null) {
  query = query.eq("profile_id", targetProfileId);
}

const { data: subscriptions, error: listError } = await query;

if (listError) {
  fail(`구독 목록 조회에 실패했습니다: ${listError.message}`);
}

if (subscriptions.length === 0) {
  process.stdout.write("[send-test-push] 발송 대상 구독이 없습니다.\n");
  process.exit(0);
}

const payload = JSON.stringify({
  title: "라비에벨 테스트 발송",
  body: "dev 스크립트에서 보낸 테스트 푸시예요.",
  target: { screen: "pay" },
});

let sentCount = 0;
let disabledCount = 0;
let failedCount = 0;

for (const subscription of subscriptions) {
  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: { p256dh: subscription.p256dh, auth: subscription.auth },
  };

  try {
    await webpush.sendNotification(pushSubscription, payload);
    sentCount += 1;
  } catch (error) {
    const statusCode = error?.statusCode;
    if (statusCode === 404 || statusCode === 410) {
      const { error: disableError } = await supabase
        .from("push_subscriptions")
        .update({ disabled_at: new Date().toISOString() })
        .eq("id", subscription.id);
      if (disableError) {
        failedCount += 1;
        process.stderr.write(
          `[send-test-push] 구독 ${subscription.id} 비활성화 실패: ${disableError.message}\n`,
        );
      } else {
        disabledCount += 1;
      }
      continue;
    }
    failedCount += 1;
    process.stderr.write(
      `[send-test-push] 구독 ${subscription.id} 발송 실패(${statusCode ?? "unknown"}): ${error?.message ?? error}\n`,
    );
  }
}

process.stdout.write(
  `[send-test-push] 대상 ${subscriptions.length}건 중 성공 ${sentCount}건, 만료 처리 ${disabledCount}건, 실패 ${failedCount}건\n`,
);
