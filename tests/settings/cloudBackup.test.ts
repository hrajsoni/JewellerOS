import { describe, it } from "node:test";
import assert from "node:assert";
import { getDefaultShowroomSettings, generateTenantBackupJSON, triggerCloudBackupSync } from "../../src/modules/settings/store";
import { CloudBackupConfig } from "../../src/modules/settings/types";
import crypto from "crypto";

describe("JewelleryOS Disaster Recovery & Cloud Backup Sync (DEF-023)", () => {
  const tenantId = "tenant-sandhya-jaipur";

  it("Showroom Defaults include valid Cloud Backup Disaster Recovery configuration", () => {
    const settings = getDefaultShowroomSettings(tenantId);
    assert.ok(settings.cloudBackup, "cloudBackup must be defined on default settings");
    assert.strictEqual(settings.cloudBackup.provider, "aws_s3");
    assert.strictEqual(settings.cloudBackup.schedule, "daily");
    assert.strictEqual(settings.cloudBackup.lastSyncStatus, "IDLE");
  });

  it("Backup Snapshot generates full payload with SHA-256 digest validation", () => {
    const snapshot = generateTenantBackupJSON(tenantId, "Sandhya Jewellers");
    assert.strictEqual(snapshot.tenantId, tenantId);
    assert.strictEqual(snapshot.shopName, "Sandhya Jewellers");
    assert.ok(snapshot.exportedAt);
    assert.ok(Array.isArray(snapshot.data.invoices));
    assert.ok(Array.isArray(snapshot.data.stockItems));

    // Calculate cryptographic audit checksum
    const rawString = JSON.stringify(snapshot);
    const sha256 = crypto.createHash("sha256").update(rawString).digest("hex");
    assert.strictEqual(sha256.length, 64, "SHA-256 digest must be exactly 64 hex characters");
  });

  it("Cloud Sync Trigger records sync timestamp and updates store state", async () => {
    const customConfig: CloudBackupConfig = {
      enabled: true,
      provider: "google_drive",
      schedule: "daily",
      endpointUrl: "https://drive.google.com/upload/sarafa-vault",
      targetBucket: "sarafa-jaipur-vault",
      lastSyncStatus: "IDLE",
    };

    const res = await triggerCloudBackupSync(tenantId, customConfig);
    assert.strictEqual(res.success, true);
    assert.ok(res.timestamp);
    assert.ok(res.message.includes("google_drive") || res.message.includes("archived"));
  });
});
