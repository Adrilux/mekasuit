-- CreateTable
CREATE TABLE "machine_attachments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "machine_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "machine_attachments_tenantId_machineId_idx" ON "machine_attachments"("tenantId", "machineId");

-- AddForeignKey
ALTER TABLE "machine_attachments" ADD CONSTRAINT "machine_attachments_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
