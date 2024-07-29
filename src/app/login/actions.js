"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export const login = async (formData) => {
  const supabase = createClient();

  const data = {
    email: formData.get("email"),
    password: formData.get("password")
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect("/");
};

export const signup = async (formData) => {
  const supabase = createClient();

  const data = {
    email: formData.get("email"),
    password: formData.get("password")
  };

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect("/");
};
