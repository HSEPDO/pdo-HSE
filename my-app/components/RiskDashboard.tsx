"use client";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from "recharts";

type Props = {
  riskLevel: number;
  riskFactors: { name: string; value: number }[];
};

export default function RiskDashboard({ riskLevel, riskFactors }: Props) {
  // ✅ Gauge color by risk
  let gaugeColor = "#22c55e"; // green
  if (riskLevel > 70) gaugeColor = "#ef4444"; // red
  else if (riskLevel > 40) gaugeColor = "#f97316"; // orange

  const gaugeData = [
    { name: "Risk", value: riskLevel },
    { name: "Remaining", value: 100 - riskLevel },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-white rounded-xl shadow">
      {/* Gauge Chart */}
      <div className="flex flex-col items-center">
        <h2 className="text-lg font-bold mb-2 text-gray-700">Overall Risk</h2>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={gaugeData}
              dataKey="value"
              startAngle={180}
              endAngle={0}
              innerRadius={70}
              outerRadius={100}
            >
              <Cell fill={gaugeColor} />
              <Cell fill="#e5e7eb" /> {/* gray background */}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <p className="text-3xl font-bold -mt-16" style={{ color: gaugeColor }}>
          {riskLevel}
        </p>
        <p className="text-gray-600">Risk Level (%)</p>
      </div>

      {/* Risk Factors Bar Chart */}
      <div>
        <h2 className="text-lg font-bold mb-2 text-gray-700">Risk Factors</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            layout="vertical"
            data={riskFactors}
            margin={{ top: 20, right: 20, left: 40, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} />
            <YAxis dataKey="name" type="category" />
            <Tooltip />
            <Bar dataKey="value" fill="#3b82f6" radius={[0, 8, 8, 0]}>
              <LabelList dataKey="value" position="right" fill="#111827" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
