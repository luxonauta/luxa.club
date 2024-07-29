"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { toast } from "react-hot-toast";
import { z } from "zod";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

/**
 * Sign in a user using the provided email and password.
 *
 * @param {Object} data - The data for signing in.
 * @param {string} data.email - The email of the user.
 * @param {string} data.password - The password of the user.
 * @returns {Promise<void>}
 */
export const signIn = async (data) => {
  const supabase = createClient();

  const result = signInSchema.safeParse(data);

  if (!result.success) {
    result.error.errors.forEach((err) => {
      toast.error(err.message);
    });
    return;
  }

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    toast.error("Failed to sign in. Please check your credentials.");
    return;
  }

  revalidatePath("/", "layout");
  redirect("/");
};

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  username: z.string().min(3)
});

/**
 * Sign up a new user with the provided email, password, and username.
 *
 * @param {Object} data - The data for signing up.
 * @param {string} data.email - The email of the new user.
 * @param {string} data.password - The password of the new user.
 * @param {string} data.username - The username of the new user.
 * @returns {Promise<void>}
 */
export const signUp = async (data) => {
  const supabase = createClient();

  const result = signUpSchema.safeParse(data);

  if (!result.success) {
    result.error.errors.forEach((err) => {
      toast.error(err.message);
    });
    return;
  }

  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        username: data.username
      }
    }
  });

  if (error) {
    toast.error("Failed to sign up. Please try again.");
    return;
  }

  revalidatePath("/", "layout");
  redirect("/");
};
