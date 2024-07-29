"use client";

import { signIn } from "@/utils/supabase/actions";
import Link from "next/link";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { z } from "zod";

const SignIn = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const schema = z.object({
      email: z.string().email({ message: "Invalid email address" }),
      password: z
        .string()
        .min(6, { message: "Password must be at least 6 characters long" })
    });

    const result = schema.safeParse(formData);

    if (!result.success) {
      result.error.errors.forEach((err) => {
        toast.error(err.message);
      });

      return;
    }

    const { email, password } = formData;

    try {
      await signIn({ email, password });
    } catch (error) {
      toast.error("Failed to sign in. Please check your credentials.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="form card row flow-column-wrap align-start"
    >
      <h1>Sign in to your account</h1>
      <fieldset>
        <label htmlFor="email">Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </fieldset>
      <fieldset>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
        />
      </fieldset>
      <button type="submit" className="action primary">
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
