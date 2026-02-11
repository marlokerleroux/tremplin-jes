import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      email,
      password,
      firstName,
      lastName,
      streetAddress,
      city,
      postalCode,
      phone,
      acceptedPrivacyPolicy,
    } = body

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants" },
        { status: 400 },
      )
    }

    // Validate Brittany postal code
    const brittanyPostalCodes = ["29", "35", "22", "56"]
    const postalCodePrefix = postalCode?.substring(0, 2)
    if (!brittanyPostalCodes.includes(postalCodePrefix)) {
      return NextResponse.json(
        {
          error:
            "L'inscription au Tremplin Jeunes en Scène est réservée aux résidents bretons (codes postaux : 22, 29, 35, 56)",
        },
        { status: 400 },
      )
    }

    // Check if email already exists
    const existing = await prisma.profile.findUnique({
      where: { email },
    })
    if (existing) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email" },
        { status: 400 },
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const profile = await prisma.profile.create({
      data: {
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        street_address: streetAddress,
        city,
        postal_code: postalCode,
        phone,
        role: "user",
        accepted_privacy_policy: acceptedPrivacyPolicy || false,
        privacy_policy_accepted_at: acceptedPrivacyPolicy
          ? new Date()
          : null,
      },
    })

    return NextResponse.json({ success: true, userId: profile.id })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création du compte" },
      { status: 500 },
    )
  }
}
