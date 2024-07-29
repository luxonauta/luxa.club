import { signIn } from "@/utils/supabase/actions";
import Link from "next/link";

const SignIn = () => {
  return (
    <form className="form card row flow-column-wrap align-start">
      <h1>Sign in to your account</h1>
      <fieldset>
        <label htmlFor="email">Email address</label>
        <input id="email" name="email" type="email" required />
      </fieldset>
      <fieldset>
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required />
      </fieldset>
      <button formAction={signIn} className="action primary">
        Sign in
      </button>
      <span>
        🐣 New to Luxa Club?{" "}
        <Link href="/account/sign-up" className="link">
          Create an account
        </Link>
      </span>
    </form>
  );
};

export default SignIn;
