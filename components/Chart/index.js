import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import styles from './styles/index.module.scss';

export default function ChartContainer() {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const latestPriceRef = useRef(null);
  const areaSeriesRef = useRef(null);

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
    areaSeriesRef.current = chart.addAreaSeries({
      topColor: 'rgba(0, 255, 0, 0.5)',
      bottomColor: 'rgba(0, 255, 0, 0.1)',
      lineColor: 'rgba(0, 255, 0, 1)',
      lineType: 2,
      priceLineColor: 'green',
    });

    const handleResize = () => {
      chart.applyOptions({
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    chart.timeScale().fitContent();

    const socket = new WebSocket('wss://fstream.binance.com/ws/btcusdt@markPrice');

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const price = parseFloat(data.p);
      const time = Math.floor(Date.now() / 1000);

      if (areaSeriesRef.current) {
        areaSeriesRef.current.update({ time, value: price });
      }

      if (areaSeriesRef.current) {
        areaSeriesRef.current.setMarkers([
          {
            time,
            position: "inBar",
            color: 'green',
            shape: 'circle',
          },
        ]);
      }
      // latestPriceRef.current = price;
    };

    const interval = setInterval(() => {
      if (latestPriceRef.current !== null && seriesRef.current) {
        const time = Math.floor(Date.now() / 1000);
        seriesRef.current.update({ time, value: latestPriceRef.current });
      }
    }, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      socket.close();
      clearInterval(interval);
    };
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.title}>BTCUSDT Price Chart</div>
      <div className={styles.subtitle}>Real-time price updates</div>
      <div ref={chartContainerRef} className={styles.chart} />
    </div>
  );
};
