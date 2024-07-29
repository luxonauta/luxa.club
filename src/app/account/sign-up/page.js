"use client";

import { signUp } from "@/utils/supabase/actions";
import Link from "next/link";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { z } from "zod";

const SignUp = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const schema = z.object({
      username: z
        .string()
        .min(3, { message: "Username must be at least 3 characters long" }),
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

    const { username, email, password } = formData;
    try {
      const result = await signUp({ username, email, password });
      if (result.success) {
        toast.success(result.success);
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to sign up. Please try again.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="form card row flow-column-wrap align-start"
    >
      <h1>Sign Up to Luxa Club!</h1>
      <fieldset>
        <label htmlFor="username">Username:</label>
        <input
          id="username"
          name="username"
          type="text"
          value={formData.username}
          onChange={handleChange}
          required
        />
      </fieldset>
      <fieldset>
        <label htmlFor="email">Email:</label>
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
        <label htmlFor="password">Password:</label>
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
