import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import styles from './styles/index.module.scss';

export default function ChartContainer() {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        background: { type: 'solid', color: 'black' },
        textColor: 'white',
      },
      grid: {
        vertLines: { color: 'black' },
        horzLines: { color: 'black' },
      },
      rightPriceScale: {
        borderColor: '#444',
        textColor: 'white',
      },
      timeScale: {
        borderColor: '#444',
        textColor: 'white',
      },
    });

    chartRef.current = chart;
    seriesRef.current = chart.addLineSeries();

    const handleResize = () => {
      chart.applyOptions({
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    const socket = new WebSocket('wss://fstream.binance.com/ws/btcusdt@markPrice');

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const price = parseFloat(data.p);
      const time = Math.floor(Date.now() / 1000);

      if (seriesRef.current) {
        seriesRef.current.update({ time, value: price });
      }
    };

    return () => socket.close();
  }, []);

  return <div ref={chartContainerRef} className={styles.chartContainer} />;
};
