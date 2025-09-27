import { NextResponse } from "next/server";

// Allowed incident types
type IncidentType = "Nearmiss" | "Asset damage" | "Injury" | "Fatality";

// Request body structure
interface RiskBody {
  age?: number;
  gender?: "Male" | "Female" | "Other";
  job_title?: string;
  experience_level?: string;
  years_of_service?: number;

  department?: "Rig" | "Workshop" | "Wellhead" | "Transport" | "Office";
  task_type?: "Lifting" | "Drilling" | "Transport" | "Maintenance" | "Office";
  work_type?: string;
  location?: string;
  work_hours?: number;

  temperature?: number;
  humidity?: number;
  noise_level?: number;

  safety_training?: boolean;
  ppe_usage?: boolean;
  previous_incidents?: IncidentType[];
  equipment_condition?: "Good" | "Needs Maintenance" | "Faulty";
  weather_impact?: "Clear" | "Dust" | "Rain" | "ExtremeHeat";
  workload_level?: "Normal" | "High" | "Extreme";
  communication_quality?: "Good" | "Fair" | "Poor";
  supervisor_presence?: boolean;
}

// Utility: safe weight lookup
function weightBy<T extends string>(
  value: T | undefined,
  map: Record<T, number>,
  fallback = 0
): number {
  if (!value) return fallback;
  return map[value] ?? fallback;
}

// Main POST handler
export async function POST(req: Request) {
  const body: RiskBody = await req.json();
  let score = 0;
  const reasons: string[] = [];

  // 🕒 Work hours
  if ((body.work_hours ?? 0) > 12) {
    score += 2;
    reasons.push("Long work hours (>12)");
  }

  // 🌡️ Environment
  if ((body.temperature ?? 0) >= 45) {
    score += 2;
    reasons.push("Extreme heat (≥45°C)");
  }
  if ((body.humidity ?? 0) >= 80) {
    score += 1;
    reasons.push("High humidity (≥80%)");
  }
  if ((body.noise_level ?? 0) >= 85) {
    score += 1;
    reasons.push("High noise (≥85 dB)");
  }

  // 🦺 Safety & compliance
  if (body.ppe_usage === false) {
    score += 3;
    reasons.push("PPE not used");
  }
  if (body.safety_training === false) {
    score += 2;
    reasons.push("No safety training");
  }
  if (body.supervisor_presence === false) {
    score += 1;
    reasons.push("No supervisor present");
  }

  // 🛠 Equipment condition
  score += weightBy(body.equipment_condition, {
    Good: 0,
    "Needs Maintenance": 2,
    Faulty: 3,
  });
  if (body.equipment_condition === "Needs Maintenance")
    reasons.push("Equipment needs maintenance");
  if (body.equipment_condition === "Faulty")
    reasons.push("Faulty equipment");

  // ☁️ Weather
  score += weightBy(body.weather_impact, {
    Clear: 0,
    Dust: 1,
    Rain: 1,
    ExtremeHeat: 2,
  });
  if (body.weather_impact && body.weather_impact !== "Clear")
    reasons.push(`Weather impact: ${body.weather_impact}`);

  // 📊 Workload & communication
  score += weightBy(body.workload_level, {
    Normal: 0,
    High: 1,
    Extreme: 2,
  });
  if (body.workload_level && body.workload_level !== "Normal")
    reasons.push(`Workload: ${body.workload_level}`);

  score += weightBy(body.communication_quality, {
    Good: 0,
    Fair: 1,
    Poor: 2,
  });
  if (body.communication_quality && body.communication_quality !== "Good")
    reasons.push(`Communication: ${body.communication_quality}`);

  // 🏭 Department
  score += weightBy(body.department, {
    Rig: 2,
    Workshop: 1,
    Wellhead: 2,
    Transport: 1,
    Office: 0,
  });
  if (body.department) reasons.push(`Department: ${body.department}`);

  // 🔧 Task type
  score += weightBy(body.task_type, {
    Lifting: 2,
    Drilling: 2,
    Transport: 1,
    Maintenance: 1,
    Office: 0,
  });
  if (body.task_type) reasons.push(`Task type: ${body.task_type}`);

  // 📜 Previous incidents
  if (body.previous_incidents?.length) {
    const weights: Record<IncidentType, number> = {
      Nearmiss: 1,
      "Asset damage": 2,
      Injury: 3,
      Fatality: 5,
    };

    const histScore = body.previous_incidents.reduce((s, it) => {
      return s + (weights[it] ?? 0);
    }, 0);

    score += Math.min(histScore, 5); // cap at 5
    reasons.push(`Incident history: ${body.previous_incidents.join(", ")}`);
  }

  // 🎯 Final risk level
  let risk: "Low" | "Medium" | "High" = "Low";
  if (score >= 8) risk = "High";
  else if (score >= 4) risk = "Medium";

  return NextResponse.json({ risk, score, reasons });
}
