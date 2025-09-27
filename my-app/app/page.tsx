'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function Home() {
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

  // 1️⃣ Save to Supabase
  await supabase.from('risk_assessments').insert([form]);

  // 2️⃣ Run rule-based scoring (fast)
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  });
  const rule = await res.json();

  // 👉 Show rule-based results immediately
  setResult(rule);
  setLoading(false);

  // 3️⃣ If risk = High → run GPT in background with streaming
if (rule.risk === 'High') {
  setGptLoading(true);
  setResult((prev: any) => ({ ...prev, advice: "" })); // reset advice

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
    advice: fullText, // 👈 live update
  }));
}


  setGptLoading(false);
}

};


  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">PDO SafeGuard AI</h1>

      <form
        onSubmit={onSubmit}
        className="grid gap-6 bg-gray-900 p-6 rounded-xl"
      >
        {/* Personal Info */}
        <fieldset>
          <legend className="font-semibold mb-2">Personal</legend>
          <input
            name="employee_name"
            placeholder="Employee Name"
            onChange={onChange}
            className="border p-2 w-full mb-2"
          />
          <input
            name="age"
            type="number"
            placeholder="Age"
            onChange={onChange}
            className="border p-2 w-full mb-2"
          />
          <select
            name="gender"
            onChange={onChange}
            className="border p-2 w-full mb-2"
          >
            <option value="">Gender</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
          <input
            name="job_title"
            placeholder="Job Title"
            onChange={onChange}
            className="border p-2 w-full mb-2"
          />
          <input
            name="experience_level"
            placeholder="Experience Level (entry/mid/senior)"
            onChange={onChange}
            className="border p-2 w-full mb-2"
          />
          <input
            name="years_of_service"
            type="number"
            placeholder="Years of Service"
            onChange={onChange}
            className="border p-2 w-full mb-2"
          />
        </fieldset>

        {/* Work Context */}
        <fieldset>
          <legend className="font-semibold mb-2">Work Context</legend>
          <input
            name="department"
            placeholder="Department/Unit"
            onChange={onChange}
            className="border p-2 w-full mb-2"
          />
          <input
            name="task_type"
            placeholder="Task Type"
            onChange={onChange}
            className="border p-2 w-full mb-2"
          />
          <input
            name="work_type"
            placeholder="Work Type (field/office/shift)"
            onChange={onChange}
            className="border p-2 w-full mb-2"
          />
          <input
            name="location"
            placeholder="Location"
            onChange={onChange}
            className="border p-2 w-full mb-2"
          />
          <input
            name="work_hours"
            type="number"
            placeholder="Work Hours"
            onChange={onChange}
            className="border p-2 w-full mb-2"
          />
        </fieldset>

        {/* Environment */}
        <fieldset>
          <legend className="font-semibold mb-2">Environment</legend>
          <input
            name="temperature"
            type="number"
            placeholder="Temperature (°C)"
            onChange={onChange}
            className="border p-2 w-full mb-2"
          />
          <input
            name="humidity"
            type="number"
            placeholder="Humidity (%)"
            onChange={onChange}
            className="border p-2 w-full mb-2"
          />
          <input
            name="noise_level"
            type="number"
            placeholder="Noise (dB)"
            onChange={onChange}
            className="border p-2 w-full mb-2"
          />
          <select
            name="weather_impact"
            onChange={onChange}
            className="border p-2 w-full mb-2"
          >
            <option value="">Weather Impact</option>
            <option>Clear</option>
            <option>Dust</option>
            <option>Rain</option>
            <option>ExtremeHeat</option>
          </select>
          <select
            name="equipment_condition"
            onChange={onChange}
            className="border p-2 w-full mb-2"
          >
            <option value="">Equipment Condition</option>
            <option>Good</option>
            <option>Needs Maintenance</option>
            <option>Faulty</option>
          </select>
        </fieldset>

        {/* Safety & Compliance */}
        <fieldset>
          <legend className="font-semibold mb-2">Safety & Compliance</legend>
          <label className="block">
            <input type="checkbox" name="safety_training" onChange={onChange} />{" "}
            Safety Training Completed
          </label>
          <label className="block">
            <input type="checkbox" name="ppe_usage" onChange={onChange} /> PPE
            Used
          </label>
          <select
            name="workload_level"
            onChange={onChange}
            className="border p-2 w-full mb-2"
          >
            <option value="">Workload Level</option>
            <option>Normal</option>
            <option>High</option>
            <option>Extreme</option>
          </select>
          <select
            name="communication_quality"
            onChange={onChange}
            className="border p-2 w-full mb-2"
          >
            <option value="">Communication Quality</option>
            <option>Good</option>
            <option>Fair</option>
            <option>Poor</option>
          </select>
          <label className="block">
            <input
              type="checkbox"
              name="supervisor_presence"
              onChange={onChange}
            />{" "}
            Supervisor Present
          </label>
        </fieldset>

        {/* Previous Incidents */}
        <fieldset>
          <legend className="font-semibold mb-2">Previous Incidents</legend>
          {['Nearmiss', 'Asset damage', 'Injury', 'Fatality'].map((opt) => (
            <label key={opt} className="mr-4">
              <input
                type="checkbox"
                checked={form.previous_incidents?.includes(opt) || false}
                onChange={() => onMultiSelect('previous_incidents', opt)}
              />
              {opt}
            </label>
          ))}
        </fieldset>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          {loading ? 'Analyzing...' : 'Save & Analyze'}
        </button>
      </form>

      {result && (
        <div className="mt-6 p-4 bg-gray-800 rounded-xl">
          <b>Risk Level:</b> {result.risk} (Score {result.score})
          <ul className="list-disc pl-6">
            {result.reasons.map((r: string, i: number) => (
              <li key={i}>{r}</li>
            ))}
          </ul>

          {/* GPT advice section */}
          {gptLoading && (
            <div className="mt-4 flex items-center space-x-2 text-yellow-400">
              <span className="loader"></span>
              <span>Fetching AI Safety Advice...</span>
            </div>
          )}

          {result.advice && !gptLoading && (
            <div className="mt-4">
              <b>AI Safety Advice:</b>
              <p className="whitespace-pre-line">{result.advice}</p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
