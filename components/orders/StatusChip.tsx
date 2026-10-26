import type { OrderStatus } from "@prisma/client";
import { STATUS_LABEL } from "@/lib/orders";

const STYLE: Record<OrderStatus, string> = {
  PAID: "bg-[#e6f4ea] text-amz-success",
  SHIPPED: "bg-[#e7f1fb] text-[#0c447c]",
  PENDING: "bg-[#fff4e5] text-[#8a4b00]",
  CANCELLED: "bg-[#f0f2f2] text-amz-muted",
};

export function StatusChip({ status }: { status: OrderStatus }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STYLE[status]}`}>{STATUS_LABEL[status]}</span>;
}
