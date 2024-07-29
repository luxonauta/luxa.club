"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export const signIn = async (formData) => {
  const supabase = createClient();

  const data = {
    email: formData.get("email"),
    password: formData.get("password")
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    redirect("/account/error");
  }

  revalidatePath("/", "layout");
  redirect("/");
};

export const signUp = async (formData) => {
  const supabase = createClient();

  const data = {
    email: formData.get("email"),
    password: formData.get("password"),
    options: {
      data: {
        username: formData.get("username")
      }
    }
  };

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    redirect("/account/error");
  }

  revalidatePath("/", "layout");
  redirect("/");
};
