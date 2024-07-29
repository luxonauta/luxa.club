"use server";

import { createClient } from "@/utils/supabase/server";
import { z } from "zod";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const signIn = async (data) => {
  const supabase = createClient();

  const result = signInSchema.safeParse(data);

  if (!result.success) {
    return { error: result.error.errors };
  }

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: "Failed to sign in. Please check your credentials." };
  }

  return { success: "👋🏻 Hey there! Welcome back." };
};

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  username: z.string().min(3)
});

export const signUp = async (data) => {
  const supabase = createClient();

  const result = signUpSchema.safeParse(data);

  if (!result.success) {
    return { error: result.error.errors };
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
    return { error: "Failed to sign up. Please try again." };
  }

  return { success: "Account created successfully!" };
};

export const signOut = async () => {
  const supabase = createClient();
  await supabase.auth.signOut();
  return { success: "👋🏻 Bye bye! See you soon." };
};

export const getSession = async () => {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
};
