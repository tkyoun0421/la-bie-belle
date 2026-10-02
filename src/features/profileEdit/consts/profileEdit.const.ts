/** 사진이 올라가는 스토리지 버킷 이름이다 — 개발과 운영이 같은 이름을 쓴다. */
export const AVATARS_BUCKET = "avatars";

/**
 * 올릴 사진을 줄이는 자다. 정본은
 * `docs/2-design/modules/account/design.md`의 「사진 저장」이다.
 *
 * 원본을 그대로 올리면 요즘 기기 사진이 몇 MB씩 간다 — 목록의 작은 원과 「나」의 큰 원이
 * 쓰는 최대 지름이 512고 그 위는 보이지 않는다.
 */

export const PHOTO_EDGE = 512;

export const PHOTO_QUALITY = 0.8;

export const PHOTO_CONTENT_TYPE = "image/jpeg";

export const PHOTO_EXTENSION = "jpg";
