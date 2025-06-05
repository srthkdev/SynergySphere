import { addImageBase64Fields } from "../lib/db/migrations/add_image_base64_fields";

async function runMigrations() {
  console.log("Starting migrations...");
  
  try {
    // Run the migration to add image base64 fields
    const result = await addImageBase64Fields();
    
    if (result.success) {
      console.log("All migrations completed successfully!");
    } else {
      console.error("Migration failed:", result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error("Error running migrations:", error);
    process.exit(1);
  }
}

runMigrations(); 