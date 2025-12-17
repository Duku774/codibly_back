import { Injectable } from '@nestjs/common';
import {
  ApiResponse,
  AvgCounter,
  DayAverage,
  DayCounter,
  GenerationData,
  OptimalCharge,
} from './interfaces/generation.interface';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
  async getThreeDays(): Promise<any> {
    const fromDate = new Date();
    fromDate.setHours(1, 1, 0, 0);
    const toDate = new Date(fromDate);
    toDate.setDate(toDate.getDate() + 3); // NOTE: Last day is missing a few intervals
    const response = await fetch(
      `https://api.carbonintensity.org.uk/generation/${fromDate.toISOString()}/${toDate.toISOString()}`,
    );

    if (!response.ok) {
      return 'Error';
    }

    const responseData: ApiResponse = (await response.json()) as ApiResponse;

    const fuelNames = [
      'gas',
      'coal',
      'biomass',
      'nuclear',
      'hydro',
      'imports',
      'other',
      'wind',
      'solar',
    ];

    function createEmptyCounters(): AvgCounter[] {
      return fuelNames.map((name) => ({ name, total: 0, number: 0 }));
    }

    const counters: DayCounter = {
      today: createEmptyCounters(),
      tomorrow: createEmptyCounters(),
      dayAfter: createEmptyCounters(),
    };

    responseData.data.forEach((interval, index) => {
      let dayKey: keyof DayCounter;
      const diff = Math.floor(index / 48); // Each day has 48 half hour intervals

      if (diff === 0) dayKey = 'today';
      else if (diff === 1) dayKey = 'tomorrow';
      else if (diff === 2) dayKey = 'dayAfter';
      else return;

      interval.generationmix.forEach((gen) => {
        const counter = counters[dayKey].find((o) => o.name === gen.fuel);
        if (counter) {
          counter.total += gen.perc;
          counter.number += 1;
        }
      });
    });

    function computeAverages(countersArr: AvgCounter[]) {
      return countersArr.map((o) => ({
        name: o.name,
        avg: o.number > 0 ? o.total / o.number : 0,
      }));
    }

    const averagesByDay = {
      today: computeAverages(counters.today),
      tomorrow: computeAverages(counters.tomorrow),
      dayAfter: computeAverages(counters.dayAfter),
    };

    const pureFuel = ['biomass', 'nuclear', 'hydro', 'wind', 'solar'];

    function computePure(averages: DayAverage[]) {
      return averages
        .filter((energy) => pureFuel.includes(energy.name))
        .reduce((sum, energy) => sum + energy.avg, 0);
    }

    const pureByDay = {
      todayPure: computePure(averagesByDay.today),
      tomorrowPure: computePure(averagesByDay.tomorrow),
      dayAfterPure: computePure(averagesByDay.dayAfter),
    };

    return { averages: averagesByDay, pure: pureByDay };
  }
  async getOptimalCharge(hours: number): Promise<any> {
    const fromDate = new Date();
    const toDate = new Date(fromDate);
    toDate.setDate(toDate.getDate() + 2);
    const response = await fetch(
      `https://api.carbonintensity.org.uk/generation/${fromDate.toISOString()}/${toDate.toISOString()}`,
    );

    if (!response.ok) {
      return 'Error';
    }

    const responseData: ApiResponse = (await response.json()) as ApiResponse;

    const intervalsNum = hours * 2;

    const intervals: GenerationData[][] = [];

    responseData.data.forEach((interval, index, array) => {
      if (index + intervalsNum <= array.length) {
        const intervalGroup = array.slice(index, index + intervalsNum);
        intervals.push(intervalGroup);
      }
    });

    const pureFuel = ['biomass', 'nuclear', 'hydro', 'wind', 'solar'];
    let pureEnergyMax = 0;
    let optimal: OptimalCharge = {
      from: '',
      to: '',
      avgPure: 0,
    };

    intervals.forEach((interval) => {
      let pureEnergy = 0;
      const from = interval[0].from;
      let to = interval[0].to;
      interval.forEach((inter) => {
        to = inter.to;
        inter.generationmix.forEach((energy) => {
          if (pureFuel.includes(energy.fuel)) pureEnergy += energy.perc;
        });
      });
      pureEnergy /= intervalsNum;
      if (pureEnergy > pureEnergyMax) {
        pureEnergyMax = pureEnergy;
        optimal = { from: from, to: to, avgPure: pureEnergy };
      }
    });

    return optimal;
  }
}
