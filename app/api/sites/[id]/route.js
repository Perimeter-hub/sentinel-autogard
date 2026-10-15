import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";

export async function GET(request, { params }) {
  const { id } = await params;

  try {
    const result = await db.query(`
      SELECT id, name, status, country_code, address, latitude, longitude,
             perimeter_meters, area_square_meters,
             ST_AsGeoJSON(perimeter) AS perimeter,
             ST_AsGeoJSON(centroid) AS centroid,
             metadata, created_at, updated_at
      FROM sites
      WHERE id = $1
    `, [id]);

    if (!result.rowCount) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    return NextResponse.json({ data: result.rows[0] });
  } catch (error) {
    console.error("Site fetch failed", error);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
