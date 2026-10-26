import { Logo } from "@/components/Logo";

// Sign-in and register: centered card, logo above, no store header (like the live site).
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center bg-white px-4 pb-10 pt-3">
      <Logo dark className="mb-4" />
      <main className="w-full max-w-[350px]">{children}</main>
      <footer className="mt-10 w-full max-w-[700px] border-t border-[#e7e7e7] pt-6 text-center text-[11px] text-amz-muted">
        A portfolio rebuild. Not affiliated with Amazon. Test login: demo@example.com / password123
      </footer>
    </div>
  );
}
