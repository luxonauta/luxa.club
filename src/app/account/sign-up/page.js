import { signUp } from "@/utils/supabase/actions";
import Link from "next/link";

const SignUp = () => {
  return (
    <form className="form card row flow-column-wrap align-start">
      <h1>Sign Up to Luxa Club!</h1>
      <fieldset>
        <label htmlFor="username">Username:</label>
        <input id="username" name="username" type="text" required />
      </fieldset>
      <fieldset>
        <label htmlFor="email">Email:</label>
        <input id="email" name="email" type="email" required />
      </fieldset>
      <fieldset>
        <label htmlFor="password">Password:</label>
        <input id="password" name="password" type="password" required />
      </fieldset>
      <button formAction={signUp} className="action primary">
        Sign up
      </button>
      <span>
        👋🏻 Already have an account?{" "}
        <Link href="/account/sign-in" className="link">
          Sign in
        </Link>
      </span>
    </form>
  );
};

export default SignUp;
