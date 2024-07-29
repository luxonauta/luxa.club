"use server";

import { createClient } from "@/utils/supabase/server";
import { z } from "zod";

/**
 * Validation schema for sign in.
 */
const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

/**
 * Signs in a user.
 * @param {Object} data - User sign-in data.
 * @param {string} data.email - User email.
 * @param {string} data.password - User password.
 * @returns {Object} Result of the sign-in attempt.
 */
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

/**
 * Validation schema for sign up.
 */
const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  username: z.string().min(3)
});

/**
 * Signs up a new user.
 * @param {Object} data - User sign-up data.
 * @param {string} data.email - User email.
 * @param {string} data.password - User password.
 * @param {string} data.username - User username.
 * @returns {Object} Result of the sign-up attempt.
 */
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

/**
 * Signs out the current user.
 * @returns {Object} Result of the sign-out attempt.
 */
export const signOut = async () => {
  const supabase = createClient();
  await supabase.auth.signOut();
  return { success: "👋🏻 Bye bye! See you soon." };
};

/**
 * Gets the current session user.
 * @returns {Object} The current session user.
 */
export const getSession = async () => {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user;
};

/**
 * Upserts the user's scores.
 * @param {number} projectAScore - Score for Project A.
 * @param {number} projectBScore - Score for Project B.
 * @returns {Object} Result of the upsert operation.
 */
export const upsertScore = async (projectAScore, projectBScore) => {
  const supabase = createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!userData) {
    throw new Error("User not authenticated");
  }

  const userId = userData.user.id;
  const username = userData.user.user_metadata.username;

  const { data, error } = await supabase.from("leaderboard").upsert(
    {
      user_id: userId,
      username: username,
      project_a_score: projectAScore,
      project_b_score: projectBScore
    },
    { onConflict: ["user_id"] }
  );

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * Retrieves the leaderboard.
 * @returns {Object[]} The leaderboard data.
 */
export const getLeaderboard = async () => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("leaderboard")
    .select("*")
    .order("total_score", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
