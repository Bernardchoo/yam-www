import useTreasury from "hooks/useTreasury";
import useYam from "hooks/useYam";
import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Box, Button, Card, CardActions, CardContent, CardTitle, Container, Spacer, useTheme } from "react-neu";
import { useWallet } from "use-wallet";
import {
  treasuryEvents,
  getDPIPrices,
  scalingFactors,
  getDPIPrice,
  getCurrentBlock,
  getWETHPrice,
  getYUSDPrice,
  getINDEXCOOPPrice,
  getIndexCoopLP,
  getIndexCoopLPRewards,
  getSushiRewards,
  getSUSHIPrice,
} from "yam-sdk/utils";
import { OptionInterface, SeriesInterface, TimeSeries } from "types/Charts";
import YamLoader from "components/YamLoader";
import Chart from "react-apexcharts";
import Split from "components/Split";
import UnlockWalletModal from "components/UnlockWalletModal";
import numeral from "numeral";

const Charts: React.FC = () => {
  const yam = useYam();
  const [unlockModalIsOpen, setUnlockModalIsOpen] = useState(false);
  const [optsScaling, setOptsScaling] = useState<OptionInterface>();
  const [seriesScaling, setSeriesScaling] = useState<SeriesInterface[]>();
  const [optsReserves, setOptsReserves] = useState<OptionInterface>();
  const [seriesReserves, setSeriesReserves] = useState<SeriesInterface[]>();
  const [optsSold, setOptsSold] = useState<OptionInterface>();
  const [seriesSold, setSeriesSold] = useState<SeriesInterface[]>();
  const [optsMinted, setOptsMinted] = useState<OptionInterface>();
  const [seriesMinted, setSeriesMinted] = useState<SeriesInterface[]>();
  const [treasuryValues, setTreasuryValues] = useState<any>();
  const { darkMode, colors } = useTheme();
  const { totalYUsdValue, totalWETHValue, totalDPIValue } = useTreasury();

  const { status } = useWallet();
  const defaultRebaseRange = 14;

  const fetchTreasury = useCallback(async () => {
    if (!yam) {
      return;
    }
    const { reservesAdded, yamsSold, yamsFromReserves, yamsToReserves, blockNumbers, blockTimes } = await treasuryEvents(yam);
    setTreasuryValues({
      reservesAdded,
      yamsSold,
      yamsFromReserves,
      yamsToReserves,
      blockNumbers,
      blockTimes,
    });
  }, [yam, setTreasuryValues]);

  useEffect(() => {
    if (status !== "connected" || !yam || !treasuryValues) {
      return;
    }
    fetchScaling();
    fetchReserves();
    fetchSold();
    fetchMinted();
  }, [darkMode, status, yam, treasuryValues]);

  const fetchScaling = useCallback(async () => {
    if (!yam) {
      return;
    }
    const { factors, blockNumbers, blockTimes } = await scalingFactors(yam);
    let data: TimeSeries[] = [];
    for (let i = 0; i < factors.length; i++) {
      const tmp: TimeSeries = {
        x: blockNumbers[i],
        // x: blockTimes[i],
        y: factors[i],
      };
      data.push(tmp);
    }
    const series: SeriesInterface[] = [
      {
        name: "Scaling Factor",
        data: data ? data.slice(factors.length - defaultRebaseRange * 2) : [],
      },
    ];
    let theme;
    let labelColor;
    let borderColor;
    if (darkMode) {
      theme = "dark";
      labelColor = colors.grey[600];
      borderColor = colors.grey[900];
    } else {
      theme = "light";
      labelColor = colors.grey[600];
      borderColor = colors.grey[600];
    }

    const options: OptionInterface = {
      chart: {
        background: "#ffffff00",
        type: "line",
        height: 350,
      },
      stroke: {
        curve: "stepline",
        // curve: "smooth",
      },
      dataLabels: {
        enabled: false,
      },
      markers: {
        hover: {
          sizeOffset: 5,
        },
      },
      colors: ["#c60c4d"],
      xaxis: {
        // type: "datetime",
        labels: {
          style: {
            colors: labelColor,
          },
          // formatter: (value: any) => {
          //   return getTimestampDate({ ts: value });
          // },
        },
        axisBorder: {
          show: false,
        },
        title: {
          // text: "Block Number",
          style: {
            color: labelColor,
          },
        },
      },
      yaxis: {
        min: 0,
        labels: {
          style: {
            colors: labelColor,
          },
          formatter: (value: any) => {
            return "x" + numeral(value).format("0.00a");
          },
        },
        axisBorder: {
          show: false,
        },
        title: {
          style: {
            color: labelColor,
          },
        },
      },
      grid: {
        borderColor: borderColor,
        padding: {
          right: 5,
          left: 5,
        },
      },
      theme: {
        mode: theme,
      },
    };

    setSeriesScaling(series);
    setOptsScaling(options);
  }, [setOptsScaling, setSeriesScaling, darkMode, status, yam, treasuryValues]);

  const fetchReserves = useCallback(async () => {
    if (!yam || !totalDPIValue || !treasuryValues) {
      return;
    }
    if (!totalYUsdValue || !totalWETHValue || !totalDPIValue) {
      return;
    }

    const currentBlock = (await getCurrentBlock(yam)).number;
    const wethPrice = await getWETHPrice();
    const yusdPrice = await getYUSDPrice();
    const dpiPrice = await getDPIPrice();
    const indexPrice = await getINDEXCOOPPrice();
    const sushiPrice = await getSUSHIPrice();
    const DPIBalance = totalDPIValue;
    // const indexCoopLP = await getIndexCoopLP(yam);
    const indexCoopLPRewards = (await getIndexCoopLPRewards(yam)) || 0;
    const SushiRewards = (await getSushiRewards(yam)) || 0;

    const reservesHistory = [
      {
        info: "DPI Purchase",
        block: 11133885,
        yUSD: 1.15 * (1896995 + 215518 + 184500),
        DPI: 3351 * 75,
        WETH: 0,
        INDEXLP: 0,
        INDEX: 0,
        Sushi: 0,
      },
      {
        info: "Comps",
        block: 11160087,
        yUSD: 1.15 * (1896995 + 215518),
        DPI: 3351 * 72,
        WETH: 0,
        INDEXLP: 0,
        INDEX: 0,
        Sushi: 0,
      },
      {
        info: "Sushi",
        block: 11243912,
        yUSD: 1.18 * 1896995,
        DPI: 434 * 90,
        WETH: 201 * 468,
        INDEXLP: 0,
        INDEX: 0,
        Sushi: SushiRewards * sushiPrice,
      },
      {
        info: "ETH Purchase",
        block: 11244494,
        yUSD: 1.18 * 1896995,
        DPI: 3351 * 80,
        WETH: 555 * 464,
        INDEXLP: 0,
        INDEX: 0,
        Sushi: SushiRewards * sushiPrice,
      },
      {
        info: "INDEXLP Pool",
        block: 11289910,
        yUSD: 1.19 * 1896995,
        DPI: 434 * 104,
        WETH: 201 * 480,
        INDEXLP: 2929 * 104 + 640 * 480,
        INDEX: 36 * 11.6,
        Sushi: SushiRewards * sushiPrice,
      },
      {
        info: "INDEX Pool",
        block: 11289910,
        yUSD: 1.19 * 1896995,
        DPI: 434 * 104,
        WETH: 201 * 480,
        INDEXLP: 2929 * 104 + 640 * 480,
        INDEX: 36 * 11.6,
        Sushi: SushiRewards * sushiPrice,
      },
      {
        info: "present",
        block: currentBlock + 5000,
        yUSD: yusdPrice * totalYUsdValue,
        DPI: DPIBalance * dpiPrice,
        WETH: totalWETHValue * wethPrice,
        INDEXLP: 2929 * dpiPrice + 640 * wethPrice,
        INDEX: indexCoopLPRewards * indexPrice,
        Sushi: SushiRewards * sushiPrice,
      },
    ];

    let now = Math.floor(Date.now() / 1000);
    let reserves: TimeSeries[] = [];
    let reservesDPI: TimeSeries[] = [];
    let reservesETH: TimeSeries[] = [];
    let reservesINDEXLP: TimeSeries[] = [];
    let reservesINDEX: TimeSeries[] = [];
    let reservesSushi: TimeSeries[] = [];
    let running = 0;
    for (let i = 0; i < treasuryValues.reservesAdded.length; i++) {
      running += treasuryValues.reservesAdded[i];
      // if (treasuryValues.blockNumbers[i] > 10946646) { // live remove (only for reserves)
      //   const tmp: TimeSeries = {
      //     // x: treasuryValues.blockNumbers[i],
      //     x: treasuryValues.blockTimes[i],
      //     y: totalYUsdValue * yUSDRate, // get pastEvents on blocknumber 11133885 (1603739830) for yUSD in reserve
      //   };
      //   reserves.push(tmp);
      // } else {
      // }
      if (
        treasuryValues.blockNumbers[i] <= 11133885
        // && treasuryValues.blockNumbers[i] >= currentBlock
      ) {
        const tmp: TimeSeries = {
          x: treasuryValues.blockNumbers[i],
          y: running * yusdPrice,
        };
        reserves.push(tmp);

        const tmpDPI: TimeSeries = {
          x: treasuryValues.blockNumbers[i],
          y: 0,
        };
        reservesDPI.push(tmpDPI);

        const tmpETH: TimeSeries = {
          x: treasuryValues.blockNumbers[i],
          y: 0,
        };
        reservesETH.push(tmpETH);

        const tmpINDEXLP: TimeSeries = {
          x: treasuryValues.blockNumbers[i],
          y: 0,
        };
        reservesINDEXLP.push(tmpINDEXLP);

        const tmpINDEX: TimeSeries = {
          x: treasuryValues.blockNumbers[i],
          y: 0,
        };
        reservesINDEX.push(tmpINDEX);

        const tmpXSushi: TimeSeries = {
          x: treasuryValues.blockNumbers[i],
          y: 0,
        };
        reservesSushi.push(tmpXSushi);
      }
    }

    for (let i = 0; i < reservesHistory.length; i++) {
      reserves.push({
        x: reservesHistory[i].block,
        y: reservesHistory[i].yUSD,
      });
      reservesDPI.push({
        x: reservesHistory[i].block,
        y: reservesHistory[i].DPI,
      });
      reservesETH.push({
        x: reservesHistory[i].block,
        y: reservesHistory[i].WETH,
      });
      reservesINDEXLP.push({
        x: reservesHistory[i].block,
        y: reservesHistory[i].INDEXLP,
      });
      reservesINDEX.push({
        x: reservesHistory[i].block,
        y: reservesHistory[i].INDEX,
      });
      reservesSushi.push({
        x: reservesHistory[i].block,
        y: reservesHistory[i].Sushi,
      });
    }

    // // on DPI purchase
    // reserves.push({
    //   // x: 1603739830,
    //   x: 11133885,
    //   y: (totalYUsdValue * yusdPrice) + (DPIBalance * dpiPrice),
    // });
    // // comps
    // reserves.push({
    //   x: 11160087,
    //   y: (totalYUsdValue * yusdPrice) + (185500 * yusdPrice),
    // })
    // // on ETH purchase
    // reserves.push({
    //   x: 11244494,
    //   // y: (totalYUsdValue * yusdPrice) + (totalWETHValue * wethPrice),
    //   y: (totalYUsdValue * yusdPrice),
    // });
    // // now
    // reserves.push({
    //   x: currentBlock,
    //   y: (totalYUsdValue * yusdPrice),
    // })

    // let reservesDPI: TimeSeries[] = [];
    // let prices: any = await getDPIPrices("1603739830", now.toString());
    // let timeArray = [];
    // for (var prop in prices) {
    //   timeArray.push(prop);
    // }
    // for (let i = 0; i < treasuryValues.reservesAdded.length; i++) {
    //   // if (DPIBalance && treasuryValues.blockNumbers[i] > 11133885) { // live set 11133885 (test: 10946646)
    //   //   const tmp: TimeSeries = {
    //   //     // x: treasuryValues.blockNumbers[i],
    //   //     x: treasuryValues.blockTimes[i],
    //   //     y: DPIBalance * prices[getNearestBlock(timeArray, treasuryValues.blockTimes[i])],
    //   //   };
    //   //   reservesDPI.push(tmp);
    //   // } else {
    //   // }
    //   if(
    //     treasuryValues.blockNumbers[i] !== 11254648
    //   ){
    //     const tmpDPI: TimeSeries = {
    //       // x: treasuryValues.blockTimes[i],
    //       x: treasuryValues.blockNumbers[i],
    //       y: 0,
    //     };
    //     reservesDPI.push(tmpDPI);
    //   }
    // }
    // // DPI purchase
    // reservesDPI.push({
    //   // x: 1603739830,
    //   x: 11133885,
    //   y: DPIBalance * dpiPrice,
    // });
    // // comps
    // reservesDPI.push({
    //   x: 11160087,
    //   y: DPIBalance * dpiPrice,
    // })
    // // on ETH purchase
    // reservesDPI.push({
    //   x: 11244494,
    //   y: DPIBalance * dpiPrice,
    // });
    // // now
    // reservesDPI.push({
    //   x: currentBlock,
    //   y: DPIBalance * dpiPrice,
    // });

    // let reservesETH: TimeSeries[] = [];
    // for (let i = 0; i < treasuryValues.reservesAdded.length; i++) {
    //   if(
    //     treasuryValues.blockNumbers[i] !== 11254648
    //   ){
    //     const tmpETH: TimeSeries = {
    //       // x: treasuryValues.blockTimes[i],
    //       x: treasuryValues.blockNumbers[i],
    //       y: 0,
    //     };
    //     reservesETH.push(tmpETH);
    //   }
    // }
    // // on DPI purchase
    // reservesETH.push({
    //   // x: 1603739830,
    //   x: 11133885,
    //   y: 0,
    // });
    // // comps
    // reservesETH.push({
    //   x: 11160087,
    //   y: 0,
    // })
    // // on ETH purchase
    // reservesETH.push({
    //   x: 11244494,
    //   y: totalWETHValue * wethPrice,
    // });
    // // now
    // reservesETH.push({
    //   x: currentBlock,
    //   y: totalWETHValue * wethPrice,
    // })
    // console.log("reserves", reserves)
    // console.log("reservesDPI", reservesDPI)
    // console.log("reservesETH", reservesETH)
    // reserves.sort((a, b) => (a.x > b.x) ? 1 : -1)
    // reservesDPI.sort((a, b) => (a.x > b.x) ? 1 : -1)
    // reservesETH.sort((a, b) => (a.x > b.x) ? 1 : -1)
    const series: SeriesInterface[] = [
      {
        name: "yUSD Reserves",
        data: reserves ? reserves.slice(reserves.length - (defaultRebaseRange + 6)) : [],
      },
      {
        name: "DPI Reserves",
        data: reservesDPI ? reservesDPI.slice(reservesDPI.length - (defaultRebaseRange + 6)) : [],
      },
      {
        name: "ETH Reserves",
        data: reservesETH ? reservesETH.slice(reservesETH.length - (defaultRebaseRange + 6)) : [],
      },
      {
        name: "Sushi Gains",
        data: reservesSushi ? reservesSushi.slice(reservesSushi.length - (defaultRebaseRange + 6)) : [],
      },
      {
        name: "INDEX Coop LP",
        data: reservesINDEXLP ? reservesINDEXLP.slice(reservesINDEXLP.length - (defaultRebaseRange + 6)) : [],
      },
      {
        name: "INDEX Coop Gains",
        data: reservesINDEX ? reservesINDEX.slice(reservesINDEX.length - (defaultRebaseRange + 6)) : [],
      },
    ];

    let theme;
    let labelColor;
    let borderColor;
    if (darkMode) {
      theme = "dark";
      labelColor = colors.grey[600];
      borderColor = colors.grey[900];
    } else {
      theme = "light";
      labelColor = colors.grey[600];
      borderColor = colors.grey[600];
    }

    let options: OptionInterface = {
      chart: {
        background: "#ffffff00",
        type: "area",
        height: 350,
        stacked: true,
      },
      stroke: {
        curve: "stepline",
      },
      dataLabels: {
        enabled: false,
      },
      fill: {
        colors: ["#C60C4D", "#8150E6", "#4777e0", "#D16C00", "#838bfc", "#FFB900"],
      },
      legend: {
        position: "top",
        horizontalAlign: "left",
        labels: {
          colors: [labelColor],
        },
      },
      markers: {
        hover: {
          sizeOffset: 5,
        },
      },
      colors: ["#C60C4D", "#8150E6", "#4777e0", "#D16C00", "#838bfc", "#FFB900"],
      xaxis: {
        // type: "datetime",
        labels: {
          style: {
            colors: labelColor,
          },
          // formatter: (value: any) => {
          //   return getTimestampDate({ ts: value });
          // },
        },
        axisBorder: {
          show: false,
        },
        title: {
          // text: "Block Number",
          style: {
            color: labelColor,
          },
        },
      },
      yaxis: {
        title: {
          // text: "yUSD In Reserves",
          style: {
            color: labelColor,
          },
        },
        labels: {
          style: {
            colors: labelColor,
          },
          formatter: (value: any) => {
            return "~$" + numeral(value).format("0.00a");
          },
        },
        axisBorder: {
          show: false,
        },
      },
      grid: {
        borderColor: borderColor,
        padding: {
          right: 5,
        },
      },
      theme: {
        mode: theme,
      },
      tooltip: {
        theme: theme,
      },
    };

    setOptsReserves(options);
    setSeriesReserves(series);
  }, [setOptsReserves, setSeriesReserves, darkMode, status, yam, totalDPIValue, treasuryValues]);

  const fetchSold = useCallback(async () => {
    if (!yam || !treasuryValues) {
      return;
    }

    let sales: number[] = [];
    for (let i = 0; i < treasuryValues.yamsSold.length; i++) {
      sales.push(treasuryValues.yamsSold[i]);
    }

    const series: SeriesInterface[] = [
      {
        name: "Yams Sold",
        data: sales ? sales.slice(sales.length - defaultRebaseRange) : [],
      },
    ];

    let theme;
    let labelColor;
    let borderColor;
    if (darkMode) {
      theme = "dark";
      labelColor = colors.grey[600];
      borderColor = colors.grey[900];
    } else {
      theme = "light";
      labelColor = colors.grey[600];
      borderColor = colors.grey[600];
    }

    let options: OptionInterface = {
      chart: {
        background: "#ffffff00",
        type: "bar",
        height: 350,
        stacked: true,
      },
      stroke: {
        curve: "stepline",
      },
      dataLabels: {
        enabled: false,
      },
      // fill: {
      //   colors: ["#C60C4D", "#8150E6"],
      // },
      legend: {
        position: "top",
        horizontalAlign: "left",
      },
      markers: {
        hover: {
          sizeOffset: 5,
        },
      },
      colors: ["#C60C4D", "#8150E6"],
      xaxis: {
        // type: "datetime",
        categories: treasuryValues.blockNumbers ? treasuryValues.blockNumbers : [],
        labels: {
          style: {
            colors: labelColor,
          },
          // formatter: (value: any) => {
          //   return getTimestampDate({ ts: value });
          // },
        },
        axisBorder: {
          show: false,
        },
        title: {
          // text: "Block Number",
          style: {
            color: labelColor,
          },
        },
      },
      yaxis: {
        title: {
          // text: "YAMs Sold",
          style: {
            color: labelColor,
          },
        },
        labels: {
          style: {
            colors: labelColor,
          },
          formatter: (value: any) => {
            return numeral(value).format("0a");
          },
        },
        axisBorder: {
          show: false,
        },
      },
      grid: {
        borderColor: borderColor,
        padding: {
          right: 5,
        },
      },
      theme: {
        mode: theme,
      },
      tooltip: {
        theme: theme,
      },
    };

    setOptsSold(options);
    setSeriesSold(series);
  }, [setOptsSold, setSeriesSold, darkMode, status, yam, treasuryValues]);

  const fetchMinted = useCallback(async () => {
    if (!yam || !treasuryValues) {
      return;
    }

    let mints: number[] = [];
    for (let i = 0; i < treasuryValues.yamsSold.length; i++) {
      mints.push(treasuryValues.yamsSold[i] - treasuryValues.yamsFromReserves[i] + treasuryValues.yamsToReserves[i]);
    }

    const series: SeriesInterface[] = [
      {
        name: "Yam Minted",
        data: mints ? mints.slice(mints.length - defaultRebaseRange) : [],
      },
    ];

    let theme;
    let labelColor;
    let borderColor;
    if (darkMode) {
      theme = "dark";
      labelColor = colors.grey[600];
      borderColor = colors.grey[900];
    } else {
      theme = "light";
      labelColor = colors.grey[600];
      borderColor = colors.grey[600];
    }

    let options: OptionInterface = {
      chart: {
        background: "#ffffff00",
        type: "bar",
        height: 350,
        stacked: true,
      },
      stroke: {
        curve: "stepline",
      },
      dataLabels: {
        enabled: false,
      },
      legend: {
        position: "top",
        horizontalAlign: "left",
      },
      markers: {
        hover: {
          sizeOffset: 5,
        },
      },
      colors: ["#C60C4D", "#8150E6"],
      xaxis: {
        // type: "datetime",
        categories: treasuryValues.blockNumbers ? treasuryValues.blockNumbers : [],
        labels: {
          style: {
            colors: labelColor,
          },
          // formatter: (value: any) => {
          //   return getTimestampDate({ ts: value });
          // },
        },
        axisBorder: {
          show: false,
        },
        title: {
          // text: "Block Number",
          style: {
            color: labelColor,
          },
        },
      },
      yaxis: {
        title: {
          // text: "YAMs Minted",
          style: {
            color: labelColor,
          },
        },
        labels: {
          style: {
            colors: labelColor,
          },
          formatter: (value: any) => {
            return numeral(value).format("0a");
          },
        },
        axisBorder: {
          show: false,
        },
      },
      grid: {
        borderColor: borderColor,
        padding: {
          right: 5,
        },
      },
      theme: {
        mode: theme,
      },
      tooltip: {
        theme: theme,
      },
    };

    setOptsMinted(options);
    setSeriesMinted(series);
  }, [setOptsMinted, setSeriesMinted, darkMode, status, yam, treasuryValues]);

  useEffect(() => {
    fetchTreasury();
    let refreshInterval = setInterval(() => fetchTreasury(), 100000);
    // console.log("treasuryValues", treasuryValues);
    return () => clearInterval(refreshInterval);
  }, [fetchTreasury]);

  const handleDismissUnlockModal = useCallback(() => {
    setUnlockModalIsOpen(false);
  }, [setUnlockModalIsOpen]);

  const handleUnlockWalletClick = useCallback(() => {
    setUnlockModalIsOpen(true);
  }, [setUnlockModalIsOpen]);

  const DisplayChartScaling = useMemo(() => {
    if (seriesScaling) {
      return (
        <>
          <CardContent>
            <Chart options={optsScaling ? optsScaling : {}} series={seriesScaling ? seriesScaling : []} type="line" height={300} />
          </CardContent>
        </>
      );
    } else {
      return (
        <>
          <YamLoader space={320}></YamLoader>
        </>
      );
    }
  }, [optsScaling, optsScaling]);

  const DisplayChartReserves = useMemo(() => {
    if (seriesReserves) {
      return (
        <>
          <CardContent>
            <Split>
              <Chart options={optsReserves ? optsReserves : {}} series={seriesReserves ? seriesReserves : []} type="area" height={300} />
            </Split>
          </CardContent>
        </>
      );
    } else {
      return (
        <>
          <YamLoader space={320}></YamLoader>
        </>
      );
    }
  }, [optsReserves, seriesReserves]);

  const DisplayChartSold = useMemo(() => {
    if (seriesSold) {
      return (
        <>
          <CardContent>
            <Split>
              <Chart options={optsSold ? optsSold : {}} series={seriesSold ? seriesSold : []} type="bar" height={200} />
            </Split>
          </CardContent>
        </>
      );
    } else {
      return (
        <>
          <YamLoader space={200}></YamLoader>
        </>
      );
    }
  }, [optsSold, seriesSold]);

  const DisplayChartMint = useMemo(() => {
    if (seriesMinted) {
      return (
        <>
          <CardContent>
            <Split>
              <Chart options={optsMinted ? optsMinted : {}} series={seriesMinted ? seriesMinted : []} type="bar" height={200} />
            </Split>
          </CardContent>
        </>
      );
    } else {
      return (
        <>
          <YamLoader space={200}></YamLoader>
        </>
      );
    }
  }, [optsMinted, seriesMinted]);

  const DisplayCharts = useMemo(() => {
    if (status === "connected") {
      return (
        <>
          <Split>
            <Card>
              <CardTitle text="🚀 Scaling Factor History" />
              <Spacer size="sm" />
              {DisplayChartScaling}
            </Card>
            <Card>
              <CardTitle text="💰 Treasury History ($)" />
              <Spacer size="sm" />
              {DisplayChartReserves}
            </Card>
          </Split>
          <Spacer />
          <Split>
            <Card>
              <CardTitle text="🔽 Yams Sold Per Rebase" />
              <Spacer size="sm" />
              {DisplayChartSold}
            </Card>
            <Card>
              <CardTitle text="🔼 Yams Minted Per Rebase" />
              <Spacer size="sm" />
              {DisplayChartMint}
            </Card>
          </Split>
        </>
      );
    }
    return (
      <>
        <Box row justifyContent="center">
          <Button onClick={handleUnlockWalletClick} text="Unlock wallet to display charts" variant="secondary" />
        </Box>
        <UnlockWalletModal isOpen={unlockModalIsOpen} onDismiss={handleDismissUnlockModal} />
      </>
    );
  }, [
    status,
    unlockModalIsOpen,
    handleDismissUnlockModal,
    handleUnlockWalletClick,
    optsScaling,
    seriesScaling,
    optsReserves,
    seriesReserves,
    optsSold,
    seriesSold,
    optsMinted,
    seriesMinted,
  ]);

  return <>{DisplayCharts}</>;
};

export default Charts;
