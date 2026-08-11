import { RouteTransition } from "@/shared/ui/route-transition";
import { PayView } from "@/views/pay/ui/PayView";
import { PAY_WITH_ITEMS } from "@/views/pay/ui/pay.mock";

export default function PayPage() {
  return (
    <RouteTransition>
      <PayView {...PAY_WITH_ITEMS} />
    </RouteTransition>
  );
}
