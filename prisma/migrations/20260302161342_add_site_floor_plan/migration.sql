-- AlterTable
ALTER TABLE "custom_reports" ALTER COLUMN "filters" DROP DEFAULT;

-- AlterTable
ALTER TABLE "sites" ADD COLUMN     "floorPlanImage" TEXT,
ADD COLUMN     "machinePins" JSONB;
