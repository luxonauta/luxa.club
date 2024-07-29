"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "@/utils/supabase/actions";
import { toast } from "react-hot-toast";

const ClientHeader = ({ session }) => {
  const router = useRouter();

  const handleSignOut = async () => {
    const result = await signOut();

    if (result?.success) {
      toast(result.success);
      router.push("/account/sign-in");
    } else {
      toast("😦 Failed to sign out...");
    }
  };

  return (
    <header>
      <nav>
        <ul>
          <li>
            <Link href="/">
              <span>Home</span>
            </Link>
          </li>
          {session ? (
            <li>
              <button onClick={handleSignOut}>
                <span>Sign out</span>
              </button>
            </li>
          ) : (
            <li>
              <Link href="/account/sign-in">
                <span>Sign in</span>
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default ClientHeader;
