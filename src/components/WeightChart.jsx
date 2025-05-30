import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format, subDays } from 'date-fns';
import { ja } from 'date-fns/locale';

// Chart.jsのコンポーネントを登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const WeightChart = ({ weights }) => {
  // 過去30日間のデータを準備
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), 29 - i);
    return {
      date: date.toISOString(),
      label: format(date, 'M/d', { locale: ja })
    };
  });

  // 各日付の体重データをマッピング
  const chartData = last30Days.map(day => {
    const dayStart = new Date(day.date).setHours(0, 0, 0, 0);
    const record = weights.find(w => {
      const recordDate = new Date(w.date).setHours(0, 0, 0, 0);
      return recordDate === dayStart;
    });
    return record ? record.weight : null;
  });

  const data = {
    labels: last30Days.map(d => d.label),
    datasets: [
      {
        label: '体重',
        data: chartData,
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.1,
        spanGaps: true // データがない日は線を繋がない
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: '過去30日間の体重推移'
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return context.parsed.y ? `${context.parsed.y.toFixed(1)} kg` : '';
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value) {
            return value + ' kg';
          }
        }
      }
    }
  };

  // データがない場合
  if (weights.length === 0) {
    return (
      <div className="weight-chart">
        <div className="no-data">
          <p>まだ体重データがありません</p>
          <p>体重を記録するとグラフが表示されます</p>
        </div>
      </div>
    );
  }

  return (
    <div className="weight-chart">
      <div className="chart-container">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default WeightChart;