import { PayView } from "@/views/pay/ui/PayView";
import { PAY_WITH_ITEMS } from "@/views/pay/ui/pay.mock";

export default function PayPage() {
  return <PayView {...PAY_WITH_ITEMS} />;
}
