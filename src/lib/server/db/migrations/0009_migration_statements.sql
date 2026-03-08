CREATE TYPE "public"."file_type_enum" AS ENUM('standard', 'spend-plan');
ALTER TABLE "files" ALTER COLUMN "file_type" SET DEFAULT 'standard'::"public"."file_type_enum";
ALTER TABLE "files" ALTER COLUMN "file_type" SET DATA TYPE "public"."file_type_enum" USING "file_type"::"public"."file_type_enum";
ALTER TABLE "files" ALTER COLUMN "file_type" SET NOT NULL;