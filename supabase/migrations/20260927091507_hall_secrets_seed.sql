-- 홀마다 첫 QR 코드를 심는다. `rotate_qr`을 한 번도 안 부른 상태가 없어야 관리자 QR 화면에
-- 「아직 뽑은 적이 없다」는 자리가 안 생긴다
-- (docs/2-design/modules/attendance/design.md 의 「QR」).
--
-- 값은 `rotate_qr`이 쓰는 것과 같은 난수 16바이트 hex다. 이미 행이 있으면 건드리지 않는다 —
-- 벽에 붙은 종이가 그 값으로 서 있을 수 있다.
insert into public.hall_secrets (hall_id, qr_code)
select id, encode(extensions.gen_random_bytes(16), 'hex')
from public.halls
on conflict (hall_id) do nothing;
