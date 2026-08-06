const MAILPIT_URL = "http://127.0.0.1:54324";
const POLL_TIMEOUT_MS = 10_000;
const POLL_INTERVAL_MS = 300;
const MAGIC_LINK_PATTERN = /Log In \( (http:\/\/[^ )]+) \)/;

type MailpitSearchResult = { messages: Array<{ ID: string }> };
type MailpitMessage = { Text?: string; HTML?: string };

async function searchMessagesTo(email: string): Promise<Array<{ ID: string }>> {
  const response = await fetch(
    `${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`,
  );
  if (!response.ok) {
    throw new Error(`mailpit search failed with status ${response.status}`);
  }
  const result = (await response.json()) as MailpitSearchResult;
  return result.messages;
}

async function fetchMessageBody(id: string): Promise<string> {
  const response = await fetch(`${MAILPIT_URL}/api/v1/message/${id}`);
  if (!response.ok) {
    throw new Error(`mailpit message fetch failed with status ${response.status}`);
  }
  const message = (await response.json()) as MailpitMessage;
  return message.Text ?? message.HTML ?? "";
}

export async function findMagicLinkUrl(email: string): Promise<string> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const messages = await searchMessagesTo(email);
    const latest = messages.at(-1);
    if (latest !== undefined) {
      const body = await fetchMessageBody(latest.ID);
      const match = body.match(MAGIC_LINK_PATTERN);
      const url = match?.[1];
      if (url !== undefined) {
        return url;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error(`${email}로 보낸 magic link 메일을 시간 안에 찾지 못했습니다.`);
}
