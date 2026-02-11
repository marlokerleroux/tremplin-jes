-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "street_address" TEXT,
    "city" TEXT,
    "postal_code" TEXT,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "accepted_privacy_policy" BOOLEAN NOT NULL DEFAULT false,
    "privacy_policy_accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "application_type" TEXT NOT NULL,
    "stage_name" TEXT NOT NULL,
    "group_members" JSONB,
    "biography" TEXT NOT NULL,
    "musical_style" TEXT NOT NULL,
    "instagram" TEXT,
    "how_did_you_hear" TEXT,
    "has_original_composition" BOOLEAN NOT NULL DEFAULT false,
    "is_sacem_registered" BOOLEAN,
    "allows_broadcast" BOOLEAN NOT NULL DEFAULT false,
    "has_stage_experience" BOOLEAN NOT NULL DEFAULT false,
    "stage_experience_details" TEXT,
    "preferred_audition_date" TEXT,
    "accepted_rules" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "time_slot_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_slots" (
    "id" UUID NOT NULL,
    "date" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "time_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technical_sheets" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "pdf_url" TEXT,
    "sound_engineer" TEXT,
    "instruments" JSONB,
    "microphones" JSONB,
    "monitoring" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "technical_sheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parental_authorizations" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "member_index" INTEGER NOT NULL DEFAULT 0,
    "member_name" TEXT,
    "pdf_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parental_authorizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audition_tracking" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "has_arrived" BOOLEAN NOT NULL DEFAULT false,
    "arrived_at" TIMESTAMP(3),
    "is_checked_in" BOOLEAN NOT NULL DEFAULT false,
    "checked_in_at" TIMESTAMP(3),
    "has_performed" BOOLEAN NOT NULL DEFAULT false,
    "performed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audition_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_config" (
    "id" UUID NOT NULL,
    "is_validated" BOOLEAN NOT NULL DEFAULT false,
    "venue" TEXT DEFAULT 'Espace Léo Ferré, Brest',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "smtp_config" (
    "id" UUID NOT NULL,
    "smtp_host" TEXT NOT NULL,
    "smtp_port" INTEGER NOT NULL DEFAULT 587,
    "smtp_username" TEXT NOT NULL,
    "smtp_password" TEXT NOT NULL,
    "smtp_from_email" TEXT NOT NULL,
    "smtp_from_name" TEXT NOT NULL DEFAULT 'Tremplin Jeunes en Scène',
    "smtp_secure" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "smtp_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "applications_user_id_key" ON "applications"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "applications_time_slot_id_key" ON "applications"("time_slot_id");

-- CreateIndex
CREATE UNIQUE INDEX "parental_authorizations_application_id_member_index_key" ON "parental_authorizations"("application_id", "member_index");

-- CreateIndex
CREATE UNIQUE INDEX "audition_tracking_application_id_key" ON "audition_tracking"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_time_slot_id_fkey" FOREIGN KEY ("time_slot_id") REFERENCES "time_slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technical_sheets" ADD CONSTRAINT "technical_sheets_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parental_authorizations" ADD CONSTRAINT "parental_authorizations_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audition_tracking" ADD CONSTRAINT "audition_tracking_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
