import { PieChart, Pie, Cell } from 'recharts';
import { useTranslation } from 'react-i18next';
import './AttendanceDonutChart.css';

const SEGMENT_COLORS = [
  { key: 'paid', color: '#16C784' },
  { key: 'due', color: 'var(--danger)' },
  { key: 'discount', color: 'var(--warning)' },
];

function FinanceDonutChart({ paid, due, discount, centerValue, centerLabel }) {
  const { t } = useTranslation();
  const counts = { paid, due, discount };
  const data = SEGMENT_COLORS.map((s) => ({ ...s, label: t(`finance.donutChart.${s.key}`), value: counts[s.key] }));
  const hasAnyValue = data.some((d) => d.value > 0);

  return (
    <div className="adc-wrap">
      <div className="adc-chart">
        <PieChart width={188} height={188}>
          <Pie
            data={hasAnyValue ? data : [{ key: 'empty', color: '#F1F4F6', value: 1 }]}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={62}
            outerRadius={88}
            paddingAngle={data.filter((d) => d.value > 0).length > 1 ? 3 : 0}
            startAngle={90}
            endAngle={-270}
            stroke="none"
          >
            {(hasAnyValue ? data : [{ key: 'empty', color: '#F1F4F6' }]).map((d) => (
              <Cell key={d.key} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
        <div className="adc-center">
          <div className="adc-center-value">{centerValue}</div>
          <div className="adc-center-label">{centerLabel}</div>
        </div>
      </div>

      <div className="adc-legend">
        {data.map((d) => (
          <div className="adc-legend-row" key={d.key}>
            <span className="adc-legend-dot" style={{ background: d.color }}></span>
            <span className="adc-legend-label">{d.label} (${d.value.toLocaleString()})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FinanceDonutChart;
