-- CreateTable
CREATE TABLE "machine_counters" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "thresholdValue" DOUBLE PRECISION,
    "thresholdInterval" DOUBLE PRECISION,
    "triggerTitle" TEXT,
    "triggerDescription" TEXT,
    "triggerPriority" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "machine_counters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machine_counter_readings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "counterId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedBy" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "machine_counter_readings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "machine_counters_tenantId_machineId_idx" ON "machine_counters"("tenantId", "machineId");

-- CreateIndex
CREATE INDEX "machine_counter_readings_tenantId_counterId_idx" ON "machine_counter_readings"("tenantId", "counterId");

-- AddForeignKey
ALTER TABLE "machine_counters" ADD CONSTRAINT "machine_counters_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_counter_readings" ADD CONSTRAINT "machine_counter_readings_counterId_fkey" FOREIGN KEY ("counterId") REFERENCES "machine_counters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
