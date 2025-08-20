# Photo Optimization Strategy

## 1. Problem Definition

The application currently uploads and stores a single, high-resolution version of user and group photos. When a page with multiple images is loaded (e.g., the family tree), the Next.js server must fetch each of these potentially large images (up to 10MB) from the storage provider (DigitalOcean Spaces). This process is inefficient and leads to:

*   **High Latency**: The server spends significant time downloading large files before sending them to the client.
*   **Increased Bandwidth Usage**: Both server-to-storage and server-to-client data transfer are higher than necessary.
*   **Poor User Experience**: Pages with many images load slowly, especially on mobile devices with slower network connections.

## 2. Goal

The primary goal is to improve the performance and efficiency of image delivery across the application. We will achieve this by generating multiple, pre-sized versions of each image upon upload and serving the most appropriate size for a given context (e.g., a small thumbnail for an avatar).

## 3. Proposed Solutions

Two solutions were considered to manage the different image sizes.

### Solution A: Naming Convention

This approach involves storing only the original image's URL in the database and inferring the URLs for other sizes using a consistent naming convention.

*   **Example**:
    *   Original: `.../some_id.jpeg`
    *   Medium: `.../some_id_medium.jpeg`
    *   Thumbnail: `.../some_id_thumb.jpeg`

*   **Pros**:
    *   Simpler to implement initially.
    *   Avoids changes to the database schema, so no migration is needed.

*   **Cons**:
    *   Less resilient. If a specific size fails to generate during upload, it will result in a broken image link.
    *   Requires extra logic to handle potential failures (e.g., checking if a file exists before rendering), which adds complexity.

### Solution B: Separate Database Fields

This approach involves modifying the `Photo` model in the database to include distinct fields for each image size.

*   **Example `schema.prisma`**:
    ```prisma
    model Photo {
      // ... existing fields
      url String // Original, full-resolution URL
      url_medium String?
      url_thumb String?
    }
    ```

*   **Pros**:
    *   **Robust and Explicit**: The database serves as a definitive record of which image sizes are available.
    *   **Scalable**: Easy to add new image sizes in the future by adding more fields.
    *   **Error-Proof**: Eliminates the risk of broken links, as the application will only request URLs that are confirmed to exist in the database.

*   **Cons**:
    *   Requires a database schema change and a migration.
    *   Involves a slightly more complex initial setup.

## 4. Recommendation

**The recommended approach is Solution B: Separate Database Fields.**

While it requires a database migration, this solution is more robust, scalable, and maintainable in the long run. It provides a reliable source of truth for image assets and prevents the application from attempting to fetch resources that don't exist. This architectural choice will lead to a more stable and predictable system as the application grows.

### Implementation Plan

1.  **Update Schema**: Add `url_medium` and `url_thumb` fields to the `Photo` model in `prisma/schema.prisma`.
2.  **Migrate Database**: Run `prisma migrate dev` to apply the schema changes.
3.  **Modify Upload Logic**: Update the `uploadFile` function in `src/lib/storage.ts` to generate and upload three versions (original, medium, thumbnail) of each image using the `sharp` library.
4.  **Audit Photo Usage**: Search the codebase to identify all locations where photo URLs are retrieved from the database. This will inform the necessary changes for the next step.
5.  **Update Data Fetching**: Modify all identified data access functions to fetch the appropriate image URL (`url`, `url_medium`, or `url_thumb`) based on the context of the view.
6.  **Backfill Script (Optional)**: Create a script to process existing photos and generate the new sizes.
