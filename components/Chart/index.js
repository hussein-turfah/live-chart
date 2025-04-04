import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import styles from './styles/index.module.scss';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAnglesDown, faAnglesUp } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';

export default function ChartContainer() {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const latestPriceRef = useRef(null);
  const areaSeriesRef = useRef(null);
  const priceTrendRef = useRef('green');
  const [latestPrice, setLatestPrice] = useState(null);
  const [dailyStats, setDailyStats] = useState({
    high: null,
    low: null,
    volume: null,
  });

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
      topColor: 'rgba(255, 217, 0, 0.15)',
      bottomColor: 'rgba(255, 217, 0, 0.04)',
      lineColor: 'yellow',
      lineType: 2,
      priceLineColor: priceTrendRef.current,
      lineWidth: 2,
      priceLineStyle: 3,
      lastPriceAnimation: 1,
    });

    const fetchHistoricalData = async () => {
      const now = Math.floor(Date.now() / 1000);
      const tenMinutesAgo = now - 600;

      try {
        const response = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1s&startTime=${tenMinutesAgo * 1000}&endTime=${now * 1000}&limit=600`
        );
        const data = await response.json();

        const formattedData = data.map((candle) => ({
          time: candle[0] / 1000,
          value: parseFloat(candle[4]),
        }));

        areaSeriesRef.current.setData(formattedData);
      } catch (error) {
        console.error('Error fetching historical data:', error);
      }
    };

    fetchHistoricalData();

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

      if (latestPriceRef.current !== null) {
        if (price > latestPriceRef.current) {
          priceTrendRef.current = 'green';
        } else if (price < latestPriceRef.current) {
          priceTrendRef.current = 'red';
        }

        if (areaSeriesRef.current) {
          areaSeriesRef.current.applyOptions({
            priceLineColor: priceTrendRef.current,
          });
        }
      }

      if (areaSeriesRef.current) {
        areaSeriesRef.current.update({ time, value: price });
      }
      latestPriceRef.current = price;
      setLatestPrice(price);
    };

    const interval = setInterval(() => {
      if (latestPriceRef.current !== null && areaSeriesRef.current) {
        const time = Math.floor(Date.now() / 1000);
        areaSeriesRef.current.update({ time, value: latestPriceRef.current });
      }
    }, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      socket.close();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT');
        const data = await res.json();

        setDailyStats({
          high: parseFloat(data.highPrice),
          low: parseFloat(data.lowPrice),
          volume: parseFloat(data.quoteVolume),
        });
      } catch (err) {
        console.error('Failed to fetch 24h stats:', err);
      }
    };

    fetchStats();

    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <Image
          src={'https://s2.coinmarketcap.com/static/img/coins/128x128/1.png'}
          alt='Bitcoin Logo'
          width={32}
          height={32}
          priority
        />
        {priceTrendRef.current === 'green' ? (
          <FontAwesomeIcon icon={faAnglesUp} className={styles.upIcon} />
        ) : (
          <FontAwesomeIcon icon={faAnglesDown} className={styles.downIcon} />
        )}
        {latestPrice !== null && (
          <span
            className={classNames(styles.price, {
              [styles.priceUp]: priceTrendRef.current === 'green',
              [styles.priceDown]: priceTrendRef.current === 'red',
            })}
          >
            {latestPrice.toLocaleString('en-US', {
              currency: 'USD',
              style: 'currency',
            })}
          </span>
        )}
        <div className={styles.priceDetails}>
          <div className={styles.symbol}>
            BTC
            <div
              className={styles.pointSeparator}
            />
            <span className={styles.symbolText}>Bitcoin</span>
          </div>
          <div className={styles.priceChange}>
            <span>
              24h Vol:{" "}
              <span className={styles.volumeValue}>
                {dailyStats.volume
                  ? `${(dailyStats.volume / 1_000_000).toFixed(0)}M`
                  : '--'}
              </span>
            </span>
            <div className={styles.pointSeparator} />
            <span>
              H:{" "}
              <span className={styles.highValue}>
                {dailyStats.high?.toLocaleString() ?? '--'}
              </span>
            </span>
            <div className={styles.pointSeparator} />
            <span>
              L:{" "}
              <span className={styles.lowValue}>
                {dailyStats.low?.toLocaleString() ?? '--'}
              </span>
            </span>
          </div>
        </div>
      </div>
      <div ref={chartContainerRef} className={styles.chart} />
    </div>
  );
}
