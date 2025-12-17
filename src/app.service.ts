import { Injectable } from '@nestjs/common';
import {
  ApiResponse,
  AvgCounter,
  DayAverage,
  DayCounter,
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
}
