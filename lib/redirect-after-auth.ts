import { createClient } from "@/lib/supabase/client"

export async function redirectAfterAuth(): Promise<string> {
  const supabase = createClient()

  try {
    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return "/dashboard"
    }

    // Get the user's profile to check their role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return "/dashboard"
    }

    // Redirect to admin if user is admin, otherwise to dashboard
    return profile.role === "admin" ? "/admin" : "/dashboard"
  } catch (error) {
    console.error("[v0] Error checking user role:", error)
    return "/dashboard"
  }
}
