import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const { data, error } = await supabase
      .from("audition_tracking")
      .select("*")

    if (error) {
      console.error("Error loading audition tracking:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in audition tracking GET:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const body = await request.json()
    const { applicationId, hasArrived, isCheckedIn, hasPerformed } = body

    if (!applicationId) {
      return NextResponse.json({ error: "applicationId requis" }, { status: 400 })
    }

    const now = new Date().toISOString()

    // Check if record exists
    const { data: existing } = await supabase
      .from("audition_tracking")
      .select("*")
      .eq("application_id", applicationId)
      .single()

    const updateData = {
      has_arrived: hasArrived,
      arrived_at: hasArrived ? (existing?.arrived_at || now) : null,
      is_checked_in: isCheckedIn,
      checked_in_at: isCheckedIn ? (existing?.checked_in_at || now) : null,
      has_performed: hasPerformed,
      performed_at: hasPerformed ? (existing?.performed_at || now) : null,
      updated_at: now,
    }

    if (existing) {
      const { data, error } = await supabase
        .from("audition_tracking")
        .update(updateData)
        .eq("application_id", applicationId)
        .select()
        .single()

      if (error) {
        console.error("Error updating audition tracking:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, data })
    } else {
      const { data, error } = await supabase
        .from("audition_tracking")
        .insert({
          application_id: applicationId,
          ...updateData,
        })
        .select()
        .single()

      if (error) {
        console.error("Error inserting audition tracking:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, data })
    }
  } catch (error) {
    console.error("Error in audition tracking API:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const body = await request.json()
    const { applicationId, notes } = body

    if (!applicationId) {
      return NextResponse.json({ error: "applicationId requis" }, { status: 400 })
    }

    const now = new Date().toISOString()

    // Check if record exists
    const { data: existing } = await supabase
      .from("audition_tracking")
      .select("*")
      .eq("application_id", applicationId)
      .single()

    if (existing) {
      const { data, error } = await supabase
        .from("audition_tracking")
        .update({ notes, updated_at: now })
        .eq("application_id", applicationId)
        .select()
        .single()

      if (error) {
        console.error("Error updating notes:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, data })
    } else {
      const { data, error } = await supabase
        .from("audition_tracking")
        .insert({
          application_id: applicationId,
          notes,
          updated_at: now,
        })
        .select()
        .single()

      if (error) {
        console.error("Error inserting notes:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, data })
    }
  } catch (error) {
    console.error("Error in audition tracking PATCH:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
