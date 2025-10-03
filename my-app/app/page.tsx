'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import RiskDashboard from "@/components/RiskDashboard";

const mapReasonsToFactors = (reasons: string[]) => {
  const factors: { name: string; value: number }[] = [];

  if (reasons.some(r => r.toLowerCase().includes("heat") || r.includes("temperature"))) {
    factors.push({ name: "Environment (Heat)", value: 80 });
  }
  if (reasons.some(r => r.toLowerCase().includes("humidity"))) {
    factors.push({ name: "Environment (Humidity)", value: 70 });
  }
  if (reasons.some(r => r.toLowerCase().includes("noise"))) {
    factors.push({ name: "Noise Level", value: 65 });
  }
  if (reasons.some(r => r.toLowerCase().includes("equipment"))) {
    factors.push({ name: "Equipment", value: 75 });
  }
  if (reasons.some(r => r.toLowerCase().includes("workload"))) {
    factors.push({ name: "Workload", value: 60 });
  }
  if (reasons.some(r => r.toLowerCase().includes("weather"))) {
    factors.push({ name: "Weather", value: 55 });
  }
  if (reasons.some(r => r.toLowerCase().includes("incident"))) {
    factors.push({ name: "Incidents History", value: 50 });
  }

  return factors;
};export default function Home() {
  const [form, setForm] = useState<any>({});
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [gptLoading, setGptLoading] = useState(false);

  const onChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setForm((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const onMultiSelect = (name: string, value: string) => {
    setForm((prev: any) => {
      const arr = new Set(prev[name] || []);
      if (arr.has(value)) arr.delete(value);
      else arr.add(value);
      return { ...prev, [name]: Array.from(arr) };
    });
  };

  const onSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    // Save to Supabase
    await supabase.from('risk_assessments').insert([form]);

    // Run rule-based scoring
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const rule = await res.json();
    setResult(rule);
    setLoading(false);

    // If High risk → run GPT in background
    if (rule.risk === 'High') {
      setGptLoading(true);
      setResult((prev: any) => ({ ...prev, advice: "" }));

      const res = await fetch("/api/gpt-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setResult((prev: any) => ({
          ...prev,
          advice: fullText,
        }));
      }

      setGptLoading(false);
    }
  };
   const riskFactors = [
    { name: "Safety Equip", value: 10 },
    { name: "Environment", value: 50 },
    { name: "Experience", value: 15 },
    { name: "Mental Health", value: 45 },
    { name: "Physical Health", value: 20 },
    { name: "Work Hours", value: 60 },
  ];
  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">PDO SafeGuard AI</h1>

      {/* ================== FORM ================== */}
      <form
        onSubmit={onSubmit}
        className="grid gap-6 bg-gray-900 p-6 rounded-xl"
      >
        {/* Personal Info */}
        <fieldset>
          <legend className="font-semibold mb-2">Personal</legend>
          <input name="employee_name" placeholder="Employee Name" onChange={onChange} className="border p-2 w-full mb-2" />
          <input name="age" type="number" placeholder="Age" onChange={onChange} className="border p-2 w-full mb-2" />
          <select name="gender" onChange={onChange} className="border p-2 w-full mb-2">
            <option value="">Gender</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
          <input name="job_title" placeholder="Job Title" onChange={onChange} className="border p-2 w-full mb-2" />
          <input name="experience_level" placeholder="Experience Level (entry/mid/senior)" onChange={onChange} className="border p-2 w-full mb-2" />
          <input name="years_of_service" type="number" placeholder="Years of Service" onChange={onChange} className="border p-2 w-full mb-2" />
        </fieldset>

        {/* Work Context */}
        <fieldset>
          <legend className="font-semibold mb-2">Work Context</legend>
          <input name="department" placeholder="Department/Unit" onChange={onChange} className="border p-2 w-full mb-2" />
          <input name="task_type" placeholder="Task Type" onChange={onChange} className="border p-2 w-full mb-2" />
          <input name="work_type" placeholder="Work Type (field/office/shift)" onChange={onChange} className="border p-2 w-full mb-2" />
          <input name="location" placeholder="Location" onChange={onChange} className="border p-2 w-full mb-2" />
          <input name="work_hours" type="number" placeholder="Work Hours" onChange={onChange} className="border p-2 w-full mb-2" />
        </fieldset>

        {/* Environment */}
        <fieldset>
          <legend className="font-semibold mb-2">Environment</legend>
          <input name="temperature" type="number" placeholder="Temperature (°C)" onChange={onChange} className="border p-2 w-full mb-2" />
          <input name="humidity" type="number" placeholder="Humidity (%)" onChange={onChange} className="border p-2 w-full mb-2" />
          <input name="noise_level" type="number" placeholder="Noise (dB)" onChange={onChange} className="border p-2 w-full mb-2" />
          <select name="weather_impact" onChange={onChange} className="border p-2 w-full mb-2">
            <option value="">Weather Impact</option>
            <option>Clear</option>
            <option>Dust</option>
            <option>Rain</option>
            <option>ExtremeHeat</option>
          </select>
          <select name="equipment_condition" onChange={onChange} className="border p-2 w-full mb-2">
            <option value="">Equipment Condition</option>
            <option>Good</option>
            <option>Needs Maintenance</option>
            <option>Faulty</option>
          </select>
        </fieldset>

        {/* Safety & Compliance */}
        <fieldset>
          <legend className="font-semibold mb-2">Safety & Compliance</legend>
          <label className="block"><input type="checkbox" name="safety_training" onChange={onChange} /> Safety Training Completed</label>
          <label className="block"><input type="checkbox" name="ppe_usage" onChange={onChange} /> PPE Used</label>
          <select name="workload_level" onChange={onChange} className="border p-2 w-full mb-2">
            <option value="">Workload Level</option>
            <option>Normal</option>
            <option>High</option>
            <option>Extreme</option>
          </select>
          <select name="communication_quality" onChange={onChange} className="border p-2 w-full mb-2">
            <option value="">Communication Quality</option>
            <option>Good</option>
            <option>Fair</option>
            <option>Poor</option>
          </select>
          <label className="block"><input type="checkbox" name="supervisor_presence" onChange={onChange} /> Supervisor Present</label>
        </fieldset>

        {/* Previous Incidents */}
        <fieldset>
          <legend className="font-semibold mb-2">Previous Incidents</legend>
          {['Nearmiss', 'Asset damage', 'Injury', 'Fatality'].map((opt) => (
            <label key={opt} className="mr-4">
              <input type="checkbox" checked={form.previous_incidents?.includes(opt) || false} onChange={() => onMultiSelect('previous_incidents', opt)} />
              {opt}
            </label>
          ))}
        </fieldset>

        {/* Submit */}
        <button type="submit" disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded">
          {loading ? 'Analyzing...' : 'Save & Analyze'}
        </button>
      </form>

      {/* ================== RESULTS ================== */}
      {result && (
        <div className="mt-6 space-y-6">
          {/* Risk Level Box */}
          <div className="p-4 bg-red-900/30 border border-red-600 rounded-xl shadow">
            <h2 className="text-lg font-bold text-red-400"> Risk Level</h2>
            <p className="mt-2 text-white font-semibold">
              {result.risk} (Score {result.score})
            </p>
            <ul className="list-disc pl-6 mt-2 text-gray-200">
              {result.reasons.map((r: string, i: number) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>

          {/* AI Safety Advice */}
          <div className="space-y-6">
            {/* Box 1: Predicted Risk Level + Reasons */}
            <div className="p-4 bg-blue-900/30 border border-blue-600 rounded-xl shadow">
              <h2 className="text-lg font-bold text-blue-400"> AI Safety Advice</h2>

              {gptLoading && (
                <div className="mt-2 flex items-center space-x-2 text-yellow-400">
                  <span className="loader"></span>
                  <span>Fetching AI Safety Advice...</span>
                </div>
              )}

              {result.advice && !gptLoading && (
                <div className="mt-4 text-gray-200 space-y-4">
                  <h3 className="text-md font-semibold text-white">1. Predicted Risk Level</h3>
                  <p className="ml-4">{result.risk}</p>

                  <h3 className="text-md font-semibold text-white">2. Explanation of Key Reasons for Risk</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><b>Exposure to Extreme Conditions:</b> 46°C and 82% humidity pose severe risks for heat-related illnesses.</li>
                    <li><b>High Noise Level:</b> 92 dB exceeds recommended limits, risking hearing damage and interfering with communication.</li>
                    <li><b>Weather Impact:</b> Rain reduces visibility, affects ground conditions, and can cause slips or equipment malfunctions.</li>
                    <li><b>Faulty Equipment:</b> Malfunctioning equipment increases the chance of accidents, failures, and injuries.</li>
                    <li><b>High Workload Level:</b> Heavy workload and long hours increase fatigue and error rates.</li>
                    <li><b>Previous Incidents:</b> Near-miss history signals safety culture concerns and ongoing risks.</li>
                  </ul>
                  
                </div>
              
              )}
              
            </div>
              
            {/* Box 2: Preventive Actions */}
            <div className="p-4 bg-green-900/30 border border-green-600 rounded-xl shadow">
              <h2 className="text-lg font-bold text-green-400"> Recommended Preventive Actions</h2>
              <ol className="list-decimal pl-6 space-y-3 text-gray-200 mt-4">
                <li>
                  <b>Heat Management and Hydration:</b>
                  <ul className="list-disc pl-6 mt-1">
                    <li>Take regular breaks in shaded/cool areas.</li>
                    <li>Ensure hydration with water and electrolyte drinks.</li>
                  </ul>
                </li>
                <li>
                  <b>Noise Control Measures:</b>
                  <ul className="list-disc pl-6 mt-1">
                    <li>Use programmable hearing protection.</li>
                    <li>Maintain noisy equipment and add barriers.</li>
                  </ul>
                </li>
                <li>
                  <b>Equipment Maintenance:</b>
                  <ul className="list-disc pl-6 mt-1">
                    <li>Urgently repair or replace faulty equipment before operations resume.</li>
                    <li>Establish a strict maintenance schedule to prevent failures.</li>
                  </ul>
                </li>
              </ol>
            </div>
            
          </div>
          {/* ✅ Dashboard */}
          <div className="mt-10 space-y-10">
            <RiskDashboard
  riskLevel={result.score || 0}
  riskFactors={mapReasonsToFactors(result.reasons)}
/>

          </div>
          
        </div>
      )}
    </main>
  );
}
